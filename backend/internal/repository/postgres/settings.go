package postgres

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresSettingsRepo struct{ pool *pgxpool.Pool }

func NewPostgresSettingsRepo(pool *pgxpool.Pool) domain.SettingsRepository {
	return &postgresSettingsRepo{pool: pool}
}

func (r *postgresSettingsRepo) GetB2BDiscountPercent(ctx context.Context) (float64, error) {
	var percent float64
	err := r.pool.QueryRow(ctx, `SELECT numeric_value FROM app_settings WHERE key = 'b2b_discount_percent'`).Scan(&percent)
	if err != nil {
		return 0, fmt.Errorf("postgres.SettingsRepo.GetB2BDiscountPercent: %w", err)
	}
	return percent, nil
}

func (r *postgresSettingsRepo) SetB2BDiscountPercent(ctx context.Context, percent float64) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO app_settings(key, numeric_value) VALUES ('b2b_discount_percent', $1) ON CONFLICT (key) DO UPDATE SET numeric_value = EXCLUDED.numeric_value`, percent)
	if err != nil {
		return fmt.Errorf("postgres.SettingsRepo.SetB2BDiscountPercent: %w", err)
	}
	return nil
}
