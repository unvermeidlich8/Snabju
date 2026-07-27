package postgres

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresMarkdownRepo struct {
	pool *pgxpool.Pool
}

func NewPostgresMarkdownRepo(pool *pgxpool.Pool) domain.MarkdownRepository {
	return &postgresMarkdownRepo{pool: pool}
}

func (r *postgresMarkdownRepo) Create(ctx context.Context, m *domain.MarkdownItem) error {
	m.ID = uuid.New()
	m.CreatedAt = time.Now()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO markdown_items(id, product_id, qty, price, reason, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		m.ID, m.ProductID, m.Qty, m.Price, nullableString(m.Reason), m.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("postgres.MarkdownRepo.Create: %w", err)
	}
	return nil
}

func (r *postgresMarkdownRepo) List(ctx context.Context) ([]*domain.MarkdownItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, product_id, qty, price, COALESCE(reason, ''), created_at
		 FROM markdown_items WHERE qty > 0 ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("postgres.MarkdownRepo.List: %w", err)
	}
	defer rows.Close()

	var items []*domain.MarkdownItem
	for rows.Next() {
		var m domain.MarkdownItem
		if err := rows.Scan(&m.ID, &m.ProductID, &m.Qty, &m.Price, &m.Reason, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("postgres.MarkdownRepo.List scan: %w", err)
		}
		items = append(items, &m)
	}
	return items, rows.Err()
}

func (r *postgresMarkdownRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.MarkdownItem, error) {
	var m domain.MarkdownItem
	err := r.pool.QueryRow(ctx,
		`SELECT id, product_id, qty, price, COALESCE(reason, ''), created_at FROM markdown_items WHERE id = $1`,
		id,
	).Scan(&m.ID, &m.ProductID, &m.Qty, &m.Price, &m.Reason, &m.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("postgres.MarkdownRepo.GetByID: %w", domain.ErrNotFound)
	}
	return &m, nil
}

func (r *postgresMarkdownRepo) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM markdown_items WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("postgres.MarkdownRepo.Delete: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *postgresMarkdownRepo) DecrementQty(ctx context.Context, id uuid.UUID, qty int) error {
	result, err := r.pool.Exec(ctx,
		`UPDATE markdown_items SET qty = qty - $1 WHERE id = $2 AND qty >= $1`,
		qty, id,
	)
	if err != nil {
		return fmt.Errorf("postgres.MarkdownRepo.DecrementQty: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("insufficient markdown qty")
	}
	return nil
}
