package domain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrPhoneExists = errors.New("user with that phone already exists")
	ErrEmailExists = errors.New("user with that email already exists")
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Phone        *string   `json:"phone"`
	Email        *string   `json:"email"`
	Name         string    `json:"name"`
	PasswordHash string    `json:"-"`
	IsB2B        bool      `json:"is_b2b"`
	IsAdmin      bool      `json:"is_admin"`
	Company      string    `json:"company"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type UserRepository interface {
	Create(ctx context.Context, u *User) error
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByPhone(ctx context.Context, phone string) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	Update(ctx context.Context, u *User) error
}

type UserService interface {
	Register(ctx context.Context, phone, email, password string) (*User, string, error)
	Login(ctx context.Context, phone, password string) (sessionID string, err error)
	Logout(ctx context.Context, sessionID string) error
	GetProfile(ctx context.Context, userID uuid.UUID) (*User, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, name, email string) error
	MergeAnonymousCart(ctx context.Context, userID uuid.UUID, sessionID string) error
}

type PasswordHasher interface {
	Hash(password string) (string, error)
	Verify(password, hash string) bool
}
