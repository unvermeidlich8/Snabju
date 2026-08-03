package postgres

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type pushRepo struct{ pool *pgxpool.Pool }

func NewPushRepo(pool *pgxpool.Pool) domain.PushRepository { return &pushRepo{pool} }
func (r *pushRepo) Upsert(ctx context.Context, userID uuid.UUID, s domain.PushSubscription) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO push_subscriptions(user_id,endpoint,p256dh,auth) VALUES($1,$2,$3,$4) ON CONFLICT(endpoint) DO UPDATE SET user_id=EXCLUDED.user_id,p256dh=EXCLUDED.p256dh,auth=EXCLUDED.auth`, userID, s.Endpoint, s.Keys.P256dh, s.Keys.Auth)
	if err != nil {
		return fmt.Errorf("push upsert: %w", err)
	}
	return nil
}
func (r *pushRepo) List(ctx context.Context) ([]domain.PushSubscription, error) {
	rows, err := r.pool.Query(ctx, `SELECT endpoint, p256dh, auth FROM push_subscriptions`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []domain.PushSubscription
	for rows.Next() {
		var s domain.PushSubscription
		if err := rows.Scan(&s.Endpoint, &s.Keys.P256dh, &s.Keys.Auth); err != nil {
			return nil, err
		}
		result = append(result, s)
	}
	return result, rows.Err()
}
