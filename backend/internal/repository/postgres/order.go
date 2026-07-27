package postgres

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresOrderRepo struct {
	pool *pgxpool.Pool
}

func NewPostgresOrderRepo(pool *pgxpool.Pool) domain.OrderRepository {
	return &postgresOrderRepo{pool: pool}
}

const orderCols = `id, user_id, session_id, status, status_kind, items_count, total, eta,
	contact_name, contact_phone, address, COALESCE(guest_email, ''), created_at, updated_at`

func (r *postgresOrderRepo) scanOrder(rows pgx.Rows) (domain.Order, error) {
	var o domain.Order
	err := rows.Scan(
		&o.ID, &o.UserID, &o.SessionID, &o.Status, &o.StatusKind, &o.ItemsCount, &o.Total, &o.ETA,
		&o.ContactName, &o.ContactPhone, &o.Address, &o.GuestEmail, &o.CreatedAt, &o.UpdatedAt,
	)
	return o, err
}

func (r *postgresOrderRepo) Create(ctx context.Context, o *domain.Order) error {
	now := time.Now()
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	o.CreatedAt = now
	o.UpdatedAt = now
	_, err := r.pool.Exec(ctx,
		`INSERT INTO orders(id, user_id, session_id, status, status_kind, items_count, total, eta,
		contact_name, contact_phone, address, guest_email, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
		o.ID, o.UserID, o.SessionID, o.Status, o.StatusKind, o.ItemsCount, o.Total, o.ETA,
		o.ContactName, o.ContactPhone, o.Address, nullableString(o.GuestEmail), o.CreatedAt, o.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("postgres.OrderRepo.Create: %w", err)
	}
	return nil
}

func (r *postgresOrderRepo) CreateItems(ctx context.Context, items []domain.OrderItem) error {
	for _, item := range items {
		_, err := r.pool.Exec(ctx,
			`INSERT INTO order_items(id, order_id, product_id, title, sku, unit, price, qty, total)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			item.ID, item.OrderID, item.ProductID, item.Title, item.SKU, item.Unit,
			item.Price, item.Qty, item.Total,
		)
		if err != nil {
			return fmt.Errorf("postgres.OrderRepo.CreateItems: %w", err)
		}
	}
	return nil
}

func (r *postgresOrderRepo) GetItems(ctx context.Context, orderID uuid.UUID) ([]domain.OrderItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, order_id, product_id, title, sku, unit, price, qty, total
		 FROM order_items WHERE order_id = $1 ORDER BY title`,
		orderID,
	)
	if err != nil {
		return nil, fmt.Errorf("postgres.OrderRepo.GetItems: %w", err)
	}
	defer rows.Close()

	var items []domain.OrderItem
	for rows.Next() {
		var it domain.OrderItem
		if err := rows.Scan(&it.ID, &it.OrderID, &it.ProductID, &it.Title, &it.SKU, &it.Unit, &it.Price, &it.Qty, &it.Total); err != nil {
			return nil, fmt.Errorf("postgres.OrderRepo.GetItems scan: %w", err)
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

func (r *postgresOrderRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+orderCols+` FROM orders WHERE id = $1`, id)
	if err != nil {
		return nil, fmt.Errorf("postgres.OrderRepo.GetByID: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, fmt.Errorf("postgres.OrderRepo.GetByID: %w", err)
		}
		return nil, domain.ErrNotFound
	}

	o, err := r.scanOrder(rows)
	if err != nil {
		return nil, fmt.Errorf("postgres.OrderRepo.GetByID scan: %w", err)
	}
	rows.Close()

	items, err := r.GetItems(ctx, o.ID)
	if err != nil {
		return nil, err
	}
	o.Items = items
	return &o, nil
}

func (r *postgresOrderRepo) listOrders(ctx context.Context, query string, arg any) ([]domain.Order, error) {
	rows, err := r.pool.Query(ctx, query, arg)
	if err != nil {
		return nil, fmt.Errorf("postgres.OrderRepo list: %w", err)
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		o, err := r.scanOrder(rows)
		if err != nil {
			return nil, fmt.Errorf("postgres.OrderRepo list scan: %w", err)
		}
		orders = append(orders, o)
	}
	return orders, rows.Err()
}

func (r *postgresOrderRepo) ListByUserID(ctx context.Context, userID uuid.UUID) ([]domain.Order, error) {
	return r.listOrders(ctx,
		`SELECT `+orderCols+` FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
		userID,
	)
}

func (r *postgresOrderRepo) ListBySessionID(ctx context.Context, sessionID string) ([]domain.Order, error) {
	return r.listOrders(ctx,
		`SELECT `+orderCols+` FROM orders WHERE session_id = $1 ORDER BY created_at DESC`,
		sessionID,
	)
}

func (r *postgresOrderRepo) ListAll(ctx context.Context, limit, offset int) ([]domain.Order, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM orders`).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("postgres.OrderRepo.ListAll count: %w", err)
	}

	rows, err := r.pool.Query(ctx,
		`SELECT `+orderCols+` FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("postgres.OrderRepo.ListAll: %w", err)
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		o, err := r.scanOrder(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("postgres.OrderRepo.ListAll scan: %w", err)
		}
		orders = append(orders, o)
	}
	return orders, total, rows.Err()
}

func (r *postgresOrderRepo) UpdateStatus(ctx context.Context, id uuid.UUID, kind domain.OrderStatus, status string) error {
	result, err := r.pool.Exec(ctx,
		`UPDATE orders SET status = $1, status_kind = $2, updated_at = $3 WHERE id = $4`,
		status, kind, time.Now(), id,
	)
	if err != nil {
		return fmt.Errorf("postgres.OrderRepo.UpdateStatus: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

var _ domain.OrderRepository = (*postgresOrderRepo)(nil)
