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

type orderService struct {
	orderRepo domain.OrderRepository
	userRepo  domain.UserRepository
	publisher domain.EventPublisher
}

func NewOrderService(orderRepo domain.OrderRepository, userRepo domain.UserRepository, publisher domain.EventPublisher) domain.OrderService {
	return &orderService{
		orderRepo: orderRepo,
		userRepo:  userRepo,
		publisher: publisher,
	}
}

func (s *orderService) Create(ctx context.Context, o *domain.Order) (*domain.Order, error) {
	if strings.TrimSpace(o.ContactName) == "" {
		return nil, domain.ErrValidation{Field: "contact_name", Msg: "required"}
	}
	if strings.TrimSpace(o.ContactPhone) == "" {
		return nil, domain.ErrValidation{Field: "contact_phone", Msg: "required"}
	}
	if strings.TrimSpace(o.Address) == "" {
		return nil, domain.ErrValidation{Field: "address", Msg: "required"}
	}
	if o.UserID == nil && strings.TrimSpace(o.SessionID) == "" {
		return nil, domain.ErrValidation{Field: "session_id", Msg: "required for guest orders"}
	}

	o.Status = "Новый"
	o.StatusKind = domain.OrderStatusPending

	if err := s.orderRepo.Create(ctx, o); err != nil {
		return nil, fmt.Errorf("orderService.Create: %w", err)
	}

	s.publishOrderConfirmed(ctx, o)
	metrics.OrdersCreatedTotal.Inc()

	return o, nil
}

func (s *orderService) publishOrderConfirmed(ctx context.Context, o *domain.Order) {
	var email *string
	if o.UserID != nil {
		if user, err := s.userRepo.GetByID(ctx, *o.UserID); err == nil {
			email = user.Email
		}
	} else if o.GuestEmail != "" {
		email = &o.GuestEmail
	}

	payload, err := json.Marshal(domain.OrderConfirmedPayload{
		OrderID:      o.ID.String(),
		ContactName:  o.ContactName,
		ContactPhone: o.ContactPhone,
		Address:      o.Address,
		Email:        email,
		Total:        o.Total,
	})
	if err != nil {
		slog.Error("order: marshal event payload", "err", err)
		return
	}
	if err := s.publisher.Publish(ctx, "notifications", domain.Event{
		Type:    domain.EventOrderConfirmed,
		Payload: payload,
	}); err != nil {
		slog.Error("order: publish event", "err", err)
	}
}

func (s *orderService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("orderService.GetByID: %w", err)
	}
	return order, nil
}

func (s *orderService) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Order, error) {
	orders, err := s.orderRepo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("orderService.ListByUser: %w", err)
	}
	return orders, nil
}

func (s *orderService) ListBySession(ctx context.Context, sessionID string) ([]domain.Order, error) {
	orders, err := s.orderRepo.ListBySessionID(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("orderService.ListBySession: %w", err)
	}
	return orders, nil
}

func (s *orderService) ListAll(ctx context.Context, limit, offset int) ([]domain.Order, int, error) {
	orders, total, err := s.orderRepo.ListAll(ctx, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("orderService.ListAll: %w", err)
	}
	return orders, total, nil
}

func (s *orderService) UpdateStatus(ctx context.Context, id uuid.UUID, kind domain.OrderStatus, status string) error {
	if err := s.orderRepo.UpdateStatus(ctx, id, kind, status); err != nil {
		return fmt.Errorf("orderService.UpdateStatus: %w", err)
	}
	return nil
}
