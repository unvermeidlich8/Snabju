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
