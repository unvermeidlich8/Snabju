package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusProgress  OrderStatus = "progress"
	OrderStatusDone      OrderStatus = "done"
	OrderStatusCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID           uuid.UUID   `json:"id"`
	UserID       *uuid.UUID  `json:"user_id,omitempty"`
	SessionID    string      `json:"session_id,omitempty"`
	Status       string      `json:"status"`
	StatusKind   OrderStatus `json:"status_kind"`
	ItemsCount   int         `json:"items_count"`
	Total        float64     `json:"total"`
	ETA          string      `json:"eta"`
	ContactName  string      `json:"contact_name"`
	ContactPhone string      `json:"contact_phone"`
	Address      string      `json:"address"`
	GuestEmail   string      `json:"guest_email,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}

type OrderRepository interface {
	Create(ctx context.Context, o *Order) error
	GetByID(ctx context.Context, id uuid.UUID) (*Order, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]Order, error)
	ListBySessionID(ctx context.Context, sessionID string) ([]Order, error)
	ListAll(ctx context.Context, limit, offset int) ([]Order, int, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, kind OrderStatus, status string) error
}

type OrderService interface {
	Create(ctx context.Context, o *Order) (*Order, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Order, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]Order, error)
	ListBySession(ctx context.Context, sessionID string) ([]Order, error)
	ListAll(ctx context.Context, limit, offset int) ([]Order, int, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, kind OrderStatus, status string) error
}
