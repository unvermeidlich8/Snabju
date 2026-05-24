package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type OrderStatus string

const (
	OrderStatusPending  OrderStatus = "pending"
	OrderStatusProgress OrderStatus = "progress"
	OrderStatusDone     OrderStatus = "done"
)

type Order struct {
	ID           uuid.UUID
	UserID       *uuid.UUID
	SessionID    string
	Status       string // человекочитаемый, напр. "Новый"
	StatusKind   OrderStatus
	ItemsCount   int
	Total        float64
	ETA          string
	ContactName  string
	ContactPhone string
	Address      string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type OrderRepository interface {
	Create(ctx context.Context, o *Order) error
	GetByID(ctx context.Context, id uuid.UUID) (*Order, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]Order, error)
	ListBySessionID(ctx context.Context, sessionID string) ([]Order, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, kind OrderStatus, status string) error
}

type OrderService interface {
	Create(ctx context.Context, o *Order) (*Order, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Order, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]Order, error)
	ListBySession(ctx context.Context, sessionID string) ([]Order, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, kind OrderStatus, status string) error
}
