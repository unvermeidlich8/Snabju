package domain

import (
	"context"
	"encoding/json"
)

type EventType string

const (
	EventUserRegistered     EventType = "user_registered"
	EventOrderConfirmed     EventType = "order_confirmed"
	EventOrderStatusChanged EventType = "order_status_changed"
)

type Event struct {
	Type    EventType       `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type UserRegisteredPayload struct {
	UserID string  `json:"user_id"`
	Phone  string  `json:"phone"`
	Email  *string `json:"email"`
	Name   string  `json:"name"`
}

type OrderConfirmedPayload struct {
	OrderID      string  `json:"order_id"`
	ContactName  string  `json:"contact_name"`
	ContactPhone string  `json:"contact_phone"`
	Address      string  `json:"address"`
	Email        *string `json:"email"`
	Total        float64 `json:"total"`
}

type OrderStatusChangedPayload struct {
	OrderID       string      `json:"order_id"`
	ContactName   string      `json:"contact_name"`
	ContactPhone  string      `json:"contact_phone"`
	NewStatus     string      `json:"new_status"`
	NewStatusKind OrderStatus `json:"new_status_kind"`
}

type EventPublisher interface {
	Publish(ctx context.Context, topic string, event Event) error
}
