package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type CartItem struct {
	ID        uuid.UUID
	SessionID string
	UserID    *uuid.UUID
	ProductID uuid.UUID
	Qty       int
	AsPallet  bool
	CreatedAt time.Time
}

type CartRepository interface {
	Add(ctx context.Context, item *CartItem) error
	Update(ctx context.Context, id uuid.UUID, qty int) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListBySession(ctx context.Context, sessionID string) ([]CartItem, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]CartItem, error)
	// MigrateSession переносит анонимную корзину к пользователю при регистрации
	MigrateSession(ctx context.Context, sessionID string, userID uuid.UUID) error
	Clear(ctx context.Context, userID uuid.UUID) error
}
