package domain

import (
	"context"

	"github.com/google/uuid"
)

type SessionStore interface {
	Create(ctx context.Context, userID uuid.UUID) (sessionID string, err error)
	GetUserID(ctx context.Context, sessionID string) (*uuid.UUID, error)
	Delete(ctx context.Context, sessionID string) error
}
