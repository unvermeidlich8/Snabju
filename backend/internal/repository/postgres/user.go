package postgres

import (
	"Snabju/backend/internal/domain"
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresUserRepo struct {
	pool *pgxpool.Pool
}

func NewPostgresUserRepo(pool *pgxpool.Pool) domain.UserRepository {
	return &postgresUserRepo{pool: pool}
}

func (r *postgresUserRepo) Create(ctx context.Context, u *domain.User) error {
	now := time.Now()
	u.ID = uuid.New()
	u.CreatedAt = now
	u.UpdatedAt = now
	query := `INSERT INTO users(id, phone, email, name, password_hash, is_b2b, is_admin, company, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err := r.pool.Exec(ctx, query, u.ID, u.Phone, u.Email, u.Name, u.PasswordHash, u.IsB2B, u.IsAdmin, u.Company, u.CreatedAt, u.UpdatedAt)

	if err != nil {
		if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "users_phone_key":
				return domain.ErrPhoneExists
			case "users_email_key":
				return domain.ErrEmailExists
			}
			return domain.ErrAlreadyExists
		}
		return fmt.Errorf("postgres.Create: %w", err)
	}
	return nil
}

func (r *postgresUserRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `SELECT id, phone, email, name, password_hash, is_b2b, is_admin, company, created_at, updated_at FROM users WHERE id = $1`

	var u domain.User
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Phone, &u.Email, &u.Name, &u.PasswordHash, &u.IsB2B, &u.IsAdmin, &u.Company, &u.CreatedAt, &u.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("postgres.GetByID: %w", err)
	}

	return &u, nil
}

func (r *postgresUserRepo) GetByPhone(ctx context.Context, phone string) (*domain.User, error) {
	query := `SELECT id, phone, email, name, password_hash, is_b2b, is_admin, company, created_at, updated_at FROM users WHERE phone = $1`

	var u domain.User
	err := r.pool.QueryRow(ctx, query, phone).Scan(
		&u.ID, &u.Phone, &u.Email, &u.Name, &u.PasswordHash, &u.IsB2B, &u.IsAdmin, &u.Company, &u.CreatedAt, &u.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("postgres.GetByPhone: %w", err)
	}

	return &u, nil
}

func (r *postgresUserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `SELECT id, phone, email, name, password_hash, is_b2b, is_admin, company, created_at, updated_at FROM users WHERE email = $1`

	var u domain.User
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Phone, &u.Email, &u.Name, &u.PasswordHash, &u.IsB2B, &u.IsAdmin, &u.Company, &u.CreatedAt, &u.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("postgres.GetByEmail: %w", err)
	}

	return &u, nil
}

func (r *postgresUserRepo) Update(ctx context.Context, u *domain.User) error {
	u.UpdatedAt = time.Now()
	query := `UPDATE users SET phone=$1, email=$2, name=$3, password_hash=$4, is_b2b=$5, is_admin=$6, company=$7, updated_at=$8 WHERE id=$9`

	result, err := r.pool.Exec(ctx, query, u.Phone, u.Email, u.Name, u.PasswordHash, u.IsB2B, u.IsAdmin, u.Company, u.UpdatedAt, u.ID)
	if err != nil {
		if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "users_phone_key":
				return domain.ErrPhoneExists
			case "users_email_key":
				return domain.ErrEmailExists
			}
		}
		return fmt.Errorf("postgres.Update: %w", err)
	}

	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}

	return nil
}

func (r *postgresUserRepo) ListForAdmin(ctx context.Context, query string, limit, offset int) ([]domain.AdminUser, int, error) {
	pattern := "%" + query + "%"
	const where = `WHERE NOT u.is_admin AND (
		$1 = '' OR u.name ILIKE $2 OR u.company ILIKE $2 OR u.phone ILIKE $2 OR u.email ILIKE $2
	)`

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users u `+where, query, pattern).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("postgres.ListForAdmin count: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT u.id, u.phone, u.email, u.name, u.company, u.created_at,
			COUNT(o.id)::int AS orders_count,
			COALESCE(SUM(o.total) FILTER (WHERE o.status_kind <> 'cancelled'), 0) AS orders_total,
			MAX(o.created_at) AS last_order_at,
			COALESCE((ARRAY_AGG(o.status ORDER BY o.created_at DESC))[1], '') AS last_order_status
		FROM users u
		LEFT JOIN orders o ON o.user_id = u.id
		`+where+`
		GROUP BY u.id
		ORDER BY MAX(o.created_at) DESC NULLS LAST, u.created_at DESC
		LIMIT $3 OFFSET $4`, query, pattern, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("postgres.ListForAdmin: %w", err)
	}
	defer rows.Close()

	users := make([]domain.AdminUser, 0)
	for rows.Next() {
		var user domain.AdminUser
		if err := rows.Scan(&user.ID, &user.Phone, &user.Email, &user.Name, &user.Company, &user.CreatedAt, &user.OrdersCount, &user.OrdersTotal, &user.LastOrderAt, &user.LastOrderStatus); err != nil {
			return nil, 0, fmt.Errorf("postgres.ListForAdmin scan: %w", err)
		}
		users = append(users, user)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("postgres.ListForAdmin rows: %w", err)
	}
	return users, total, nil
}
