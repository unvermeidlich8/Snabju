package postgres

import (
	"Snabju/backend/internal/domain"
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresCategoryRepo struct {
	pool *pgxpool.Pool
}

func NewPostgresCategoryRepo(pool *pgxpool.Pool) domain.CategoryRepository {
	return &postgresCategoryRepo{pool: pool}
}

func (r *postgresCategoryRepo) List(ctx context.Context) ([]domain.Category, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, title, swatch, icon, sort_order FROM categories ORDER BY sort_order`,
	)
	if err != nil {
		return nil, fmt.Errorf("postgres.CategoryRepo.List: %w", err)
	}
	defer rows.Close()

	var result []domain.Category
	for rows.Next() {
		var c domain.Category
		if err := rows.Scan(&c.ID, &c.Title, &c.Swatch, &c.Icon, &c.SortOrder); err != nil {
			return nil, fmt.Errorf("postgres.CategoryRepo.List scan: %w", err)
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (r *postgresCategoryRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	var c domain.Category
	err := r.pool.QueryRow(ctx,
		`SELECT id, title, swatch, icon, sort_order FROM categories WHERE id = $1`, id).
		Scan(&c.ID, &c.Title, &c.Swatch, &c.Icon, &c.SortOrder)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("postgres.CategoryRepo.GetByID: %w", err)
	}
	return &c, nil
}
