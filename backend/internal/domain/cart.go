package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type CartItem struct {
	ID             uuid.UUID  `json:"id"`
	SessionID      string     `json:"session_id"`
	UserID         *uuid.UUID `json:"user_id,omitempty"`
	ProductID      uuid.UUID  `json:"product_id"`
	Qty            int        `json:"qty"`
	AsPallet       bool       `json:"as_pallet"`
	MarkdownItemID *uuid.UUID `json:"markdown_item_id,omitempty"`
	MarkdownPrice  *float64   `json:"markdown_price,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

type CartRepository interface {
	Add(ctx context.Context, item *CartItem) error
	GetByID(ctx context.Context, id uuid.UUID) (*CartItem, error)
	Update(ctx context.Context, id uuid.UUID, qty int) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListBySession(ctx context.Context, sessionID string) ([]CartItem, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]CartItem, error)
	MigrateSession(ctx context.Context, sessionID string, userID uuid.UUID) error
	Clear(ctx context.Context, userID uuid.UUID) error
	ClearBySession(ctx context.Context, sessionID string) error
}

type CartService interface {
	AddItem(ctx context.Context, sessionID string, userID *uuid.UUID, productID uuid.UUID, qty int, asPallet bool, markdownItemID *uuid.UUID) (*CartItem, error)
	UpdateItem(ctx context.Context, itemID uuid.UUID, qty int) error
	RemoveItem(ctx context.Context, itemID uuid.UUID) error
	GetItems(ctx context.Context, sessionID string, userID *uuid.UUID) ([]CartItem, error)
	Clear(ctx context.Context, userID uuid.UUID) error
}
