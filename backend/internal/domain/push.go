package domain

import (
	"context"
	"github.com/google/uuid"
)

type PushSubscription struct {
	Endpoint string `json:"endpoint"`
	Keys     struct {
		P256dh string `json:"p256dh"`
		Auth   string `json:"auth"`
	} `json:"keys"`
}
type PushRepository interface {
	Upsert(context.Context, uuid.UUID, PushSubscription) error
}
