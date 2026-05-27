package service

import (
	"Snabju/backend/internal/domain"
	"Snabju/backend/internal/metrics"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"github.com/google/uuid"
)

type userService struct {
	userRepo     domain.UserRepository
	cartRepo     domain.CartRepository
	hasher       domain.PasswordHasher
	sessionStore domain.SessionStore
	publisher    domain.EventPublisher
}

func NewUserService(userRepo domain.UserRepository, cartRepo domain.CartRepository, hasher domain.PasswordHasher, sessionStore domain.SessionStore, publisher domain.EventPublisher) domain.UserService {
	return &userService{
		userRepo:     userRepo,
		cartRepo:     cartRepo,
		hasher:       hasher,
		sessionStore: sessionStore,
		publisher:    publisher,
	}
}

func (s *userService) Register(ctx context.Context, phone, email, password string) (*domain.User, string, error) {
	phone = strings.TrimSpace(phone)
	if len(phone) < 11 || (!strings.HasPrefix(phone, "+7") && !strings.HasPrefix(phone, "8")) {
		return nil, "", domain.ErrValidation{Field: "phone", Msg: "must start with +7 or 8 and be at least 11 digits"}
	}
	email = strings.TrimSpace(email)
	if !strings.Contains(email, "@") {
		return nil, "", domain.ErrValidation{Field: "email", Msg: "invalid format"}
	}
	if len(password) < 8 {
		return nil, "", domain.ErrValidation{Field: "password", Msg: "min 8 characters"}
	}

	hash, err := s.hasher.Hash(password)
	if err != nil {
		return nil, "", fmt.Errorf("register: hash password: %w", err)
	}

	user := &domain.User{
		Phone:        &phone,
		Email:        &email,
		PasswordHash: hash,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, "", fmt.Errorf("register: %w", err)
	}

	sessionID, err := s.sessionStore.Create(ctx, user.ID)
	if err != nil {
		return nil, "", fmt.Errorf("register: create session: %w", err)
	}

	s.publishUserRegistered(ctx, user)
	metrics.UsersRegisteredTotal.Inc()

	return user, sessionID, nil
}

func (s *userService) publishUserRegistered(ctx context.Context, user *domain.User) {
	payload, err := json.Marshal(domain.UserRegisteredPayload{
		UserID: user.ID.String(),
		Phone:  *user.Phone,
		Email:  user.Email,
	})
	if err != nil {
		slog.Error("register: marshal event payload", "err", err)
		return
	}
	if err := s.publisher.Publish(ctx, "notifications", domain.Event{
		Type:    domain.EventUserRegistered,
		Payload: payload,
	}); err != nil {
		slog.Error("register: publish event", "err", err)
	}
}

func (s *userService) Logout(ctx context.Context, sessionID string) error {
	if err := s.sessionStore.Delete(ctx, sessionID); err != nil {
		return fmt.Errorf("logout: %w", err)
	}
	return nil
}

func (s *userService) Login(ctx context.Context, phone, password string) (sessionID string, err error) {
	phone = strings.TrimSpace(phone)

	user, err := s.userRepo.GetByPhone(ctx, phone)
	if err != nil {
		// не раскрываем причину: пользователь не найден или неверный пароль — одна ошибка
		return "", domain.ErrInvalidCredentials
	}

	if !s.hasher.Verify(password, user.PasswordHash) {
		return "", domain.ErrInvalidCredentials
	}

	sessionID, err = s.sessionStore.Create(ctx, user.ID)
	if err != nil {
		return "", fmt.Errorf("login: create session: %w", err)
	}

	return sessionID, nil
}

func (s *userService) GetProfile(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("getProfile: %w", err)
	}
	return user, nil
}

func (s *userService) UpdateProfile(ctx context.Context, userID uuid.UUID, name, email string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("updateProfile: %w", err)
	}

	if name != "" {
		user.Name = strings.TrimSpace(name)
	}
	if email != "" {
		email = strings.TrimSpace(email)
		if !strings.Contains(email, "@") {
			return domain.ErrValidation{Field: "email", Msg: "invalid format"}
		}
		user.Email = &email
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return fmt.Errorf("updateProfile: %w", err)
	}
	return nil
}

func (s *userService) MergeAnonymousCart(ctx context.Context, userID uuid.UUID, sessionID string) error {
	if err := s.cartRepo.MigrateSession(ctx, sessionID, userID); err != nil {
		return fmt.Errorf("mergeAnonymousCart: %w", err)
	}
	return nil
}
