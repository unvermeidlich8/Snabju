package postgres

import (
	"Snabju/backend/internal/domain"
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresCategoryRepo struct {
	pool *pgxpool.Pool
}

func NewPostgresCategoryRepo(pool *pgxpool.Pool) domain.CategoryRepository {
	return &postgresCategoryRepo{pool: pool}
}

const categoryCols = `id, title, swatch, icon, COALESCE(image_url, '') AS image_url, sort_order`

func scanCategory(row interface{ Scan(...any) error }) (domain.Category, error) {
	var c domain.Category
	err := row.Scan(&c.ID, &c.Title, &c.Swatch, &c.Icon, &c.ImageURL, &c.SortOrder)
	return c, err
}

func (r *postgresCategoryRepo) List(ctx context.Context) ([]domain.Category, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+categoryCols+` FROM categories ORDER BY sort_order`,
	)
	if err != nil {
		return nil, fmt.Errorf("postgres.CategoryRepo.List: %w", err)
	}
	defer rows.Close()

	var result []domain.Category
	for rows.Next() {
		var c domain.Category
		if err := rows.Scan(&c.ID, &c.Title, &c.Swatch, &c.Icon, &c.ImageURL, &c.SortOrder); err != nil {
			return nil, fmt.Errorf("postgres.CategoryRepo.List scan: %w", err)
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (r *postgresCategoryRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	var c domain.Category
	err := r.pool.QueryRow(ctx,
		`SELECT `+categoryCols+` FROM categories WHERE id = $1`, id).
		Scan(&c.ID, &c.Title, &c.Swatch, &c.Icon, &c.ImageURL, &c.SortOrder)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("postgres.CategoryRepo.GetByID: %w", err)
	}
	return &c, nil
}

func (r *postgresCategoryRepo) Create(ctx context.Context, in domain.CreateCategoryInput) (*domain.Category, error) {
	c := domain.Category{
		ID:        uuid.New(),
		Title:     in.Title,
		Swatch:    in.Swatch,
		Icon:      in.Icon,
		ImageURL:  in.ImageURL,
		SortOrder: in.SortOrder,
	}

	_, err := r.pool.Exec(ctx,
		`INSERT INTO categories (id, title, swatch, icon, image_url, sort_order)
		 VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6)`,
		c.ID, c.Title, c.Swatch, c.Icon, c.ImageURL, c.SortOrder,
	)
	if err != nil {
		return nil, fmt.Errorf("postgres.CategoryRepo.Create: %w", err)
	}
	return &c, nil
}

func (r *postgresCategoryRepo) Update(ctx context.Context, id uuid.UUID, in domain.UpdateCategoryInput) (*domain.Category, error) {
	_, err := r.pool.Exec(ctx,
		`UPDATE categories SET title=$1, swatch=$2, icon=$3, image_url=NULLIF($4,''), sort_order=$5 WHERE id=$6`,
		in.Title, in.Swatch, in.Icon, in.ImageURL, in.SortOrder, id,
	)
	if err != nil {
		return nil, fmt.Errorf("postgres.CategoryRepo.Update: %w", err)
	}
	return r.GetByID(ctx, id)
}

func (r *postgresCategoryRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM categories WHERE id=$1`, id)
	if err != nil {
		if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23503" {
			return domain.ErrHasProducts
		}
		return fmt.Errorf("postgres.CategoryRepo.Delete: %w", err)
	}
	return nil
}
