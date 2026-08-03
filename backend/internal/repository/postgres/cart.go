package postgres

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresCartRepo struct {
	pool *pgxpool.Pool
}

func NewPostgresCartRepo(pool *pgxpool.Pool) domain.CartRepository {
	return &postgresCartRepo{pool: pool}
}

func (r *postgresCartRepo) Add(ctx context.Context, item *domain.CartItem) error {
	item.ID = uuid.New()
	item.CreatedAt = time.Now()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO cart_items(id, session_id, user_id, product_id, qty, as_pallet, markdown_item_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		item.ID, item.SessionID, item.UserID, item.ProductID, item.Qty, item.IsBox, item.MarkdownItemID, item.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("postgres.CartRepo.Add: %w", err)
	}
	return nil
}

func (r *postgresCartRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.CartItem, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT c.id, c.session_id, c.user_id, c.product_id, c.qty, c.as_pallet,
		        c.markdown_item_id, m.price, c.created_at
		 FROM cart_items c
		 LEFT JOIN markdown_items m ON m.id = c.markdown_item_id
		 WHERE c.id = $1`,
		id,
	)

	var item domain.CartItem
	if err := row.Scan(
		&item.ID, &item.SessionID, &item.UserID, &item.ProductID,
		&item.Qty, &item.IsBox, &item.MarkdownItemID, &item.MarkdownPrice, &item.CreatedAt,
	); err != nil {
		return nil, domain.ErrNotFound
	}

	return &item, nil
}

func (r *postgresCartRepo) Update(ctx context.Context, id uuid.UUID, qty int) error {
	result, err := r.pool.Exec(ctx, `UPDATE cart_items SET qty = $1 WHERE id = $2`, qty, id)
	if err != nil {
		return fmt.Errorf("postgres.CartRepo.Update: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *postgresCartRepo) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM cart_items WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("postgres.CartRepo.Delete: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *postgresCartRepo) listBy(ctx context.Context, query string, arg any) ([]domain.CartItem, error) {
	rows, err := r.pool.Query(ctx, query, arg)
	if err != nil {
		return nil, fmt.Errorf("postgres.CartRepo list: %w", err)
	}
	defer rows.Close()

	var items []domain.CartItem
	for rows.Next() {
		var item domain.CartItem
		if err := rows.Scan(
			&item.ID, &item.SessionID, &item.UserID, &item.ProductID,
			&item.Qty, &item.IsBox, &item.MarkdownItemID, &item.MarkdownPrice, &item.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("postgres.CartRepo list scan: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *postgresCartRepo) ListBySession(ctx context.Context, sessionID string) ([]domain.CartItem, error) {
	return r.listBy(ctx,
		`SELECT c.id, c.session_id, c.user_id, c.product_id, c.qty, c.as_pallet,
		        c.markdown_item_id, m.price, c.created_at
		 FROM cart_items c
		 LEFT JOIN markdown_items m ON m.id = c.markdown_item_id
		 WHERE c.session_id = $1 ORDER BY c.created_at`,
		sessionID,
	)
}

func (r *postgresCartRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.CartItem, error) {
	return r.listBy(ctx,
		`SELECT c.id, c.session_id, c.user_id, c.product_id, c.qty, c.as_pallet,
		        c.markdown_item_id, m.price, c.created_at
		 FROM cart_items c
		 LEFT JOIN markdown_items m ON m.id = c.markdown_item_id
		 WHERE c.user_id = $1 ORDER BY c.created_at`,
		userID,
	)
}

func (r *postgresCartRepo) MigrateSession(ctx context.Context, sessionID string, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE cart_items SET user_id = $1 WHERE session_id = $2`,
		userID, sessionID,
	)
	if err != nil {
		return fmt.Errorf("postgres.CartRepo.MigrateSession: %w", err)
	}
	return nil
}

func (r *postgresCartRepo) Clear(ctx context.Context, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM cart_items WHERE user_id = $1`, userID)
	if err != nil {
		return fmt.Errorf("postgres.CartRepo.Clear: %w", err)
	}
	return nil
}

func (r *postgresCartRepo) ClearBySession(ctx context.Context, sessionID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM cart_items WHERE session_id = $1`, sessionID)
	if err != nil {
		return fmt.Errorf("postgres.CartRepo.ClearBySession: %w", err)
	}
	return nil
}
