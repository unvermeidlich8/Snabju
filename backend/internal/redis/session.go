package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type SessionStore struct {
	client *redis.Client
	ttl    time.Duration
}

func NewSessionStore(client *redis.Client, ttl time.Duration) *SessionStore {
	return &SessionStore{client: client, ttl: ttl}
}

type sessionPayload struct {
	UserID *uuid.UUID `json:"user_id"`
}

func (s *SessionStore) Create(ctx context.Context, userID uuid.UUID) (string, error) {
	sessionID := uuid.New().String()
	payload, err := json.Marshal(sessionPayload{UserID: &userID})
	if err != nil {
		return "", fmt.Errorf("redis.SessionStore.Create: marshal: %w", err)
	}
	if err := s.client.Set(ctx, sessionKey(sessionID), payload, s.ttl).Err(); err != nil {
		return "", fmt.Errorf("redis.SessionStore.Create: set: %w", err)
	}
	return sessionID, nil
}

func (s *SessionStore) GetUserID(ctx context.Context, sessionID string) (*uuid.UUID, error) {
	val, err := s.client.Get(ctx, sessionKey(sessionID)).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, nil
		}
		return nil, fmt.Errorf("redis.SessionStore.GetUserID: get: %w", err)
	}
	var p sessionPayload
	if err := json.Unmarshal(val, &p); err != nil {
		return nil, fmt.Errorf("redis.SessionStore.GetUserID: unmarshal: %w", err)
	}
	return p.UserID, nil
}

func (s *SessionStore) Delete(ctx context.Context, sessionID string) error {
	if err := s.client.Del(ctx, sessionKey(sessionID)).Err(); err != nil {
		return fmt.Errorf("redis.SessionStore.Delete: %w", err)
	}
	return nil
}

func sessionKey(sessionID string) string {
	return "session:" + sessionID
}
