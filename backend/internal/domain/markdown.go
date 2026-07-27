package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type MarkdownItem struct {
	ID        uuid.UUID `json:"id"`
	ProductID uuid.UUID `json:"product_id"`
	Qty       int       `json:"qty"`
	Price     float64   `json:"price"`
	Reason    string    `json:"reason,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type MarkdownRepository interface {
	Create(ctx context.Context, m *MarkdownItem) error
	List(ctx context.Context) ([]*MarkdownItem, error)
	GetByID(ctx context.Context, id uuid.UUID) (*MarkdownItem, error)
	Delete(ctx context.Context, id uuid.UUID) error
	DecrementQty(ctx context.Context, id uuid.UUID, qty int) error
}

type MarkdownService interface {
	Create(ctx context.Context, productID uuid.UUID, qty int, price float64, reason string) (*MarkdownItem, error)
	List(ctx context.Context) ([]*MarkdownItem, error)
	Delete(ctx context.Context, id uuid.UUID) error
}
