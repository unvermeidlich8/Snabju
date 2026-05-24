package postgres

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresProductRepo struct {
	pool *pgxpool.Pool
}

func NewPostgresProductRepo(pool *pgxpool.Pool) domain.ProductRepository {
	return &postgresProductRepo{pool: pool}
}

const productCols = `id, sku, title, sub, category_id, cat_label, unit, unit_detail,
	price, old_price, price_pallet, pallet_qty, stock, stock_unit, eta,
	rating, reviews, tag, created_at, updated_at`

func scanProduct(rows pgx.Rows) (domain.Product, error) {
	var p domain.Product
	err := rows.Scan(
		&p.ID, &p.SKU, &p.Title, &p.Sub, &p.CategoryID, &p.CatLabel, &p.Unit, &p.UnitDetail,
		&p.Price, &p.OldPrice, &p.PricePallet, &p.PalletQty, &p.Stock, &p.StockUnit, &p.ETA,
		&p.Rating, &p.Reviews, &p.Tag, &p.CreatedAt, &p.UpdatedAt,
	)
	return p, err
}

func (r *postgresProductRepo) loadSpecs(ctx context.Context, ids []uuid.UUID) (map[uuid.UUID][]domain.ProductSpec, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT product_id, key, value, sort_order FROM product_specs
		WHERE product_id = ANY($1) ORDER BY product_id, sort_order`,
		ids,
	)
	if err != nil {
		return nil, fmt.Errorf("postgres.ProductRepo.loadSpecs: %w", err)
	}
	defer rows.Close()

	result := make(map[uuid.UUID][]domain.ProductSpec)
	for rows.Next() {
		var productID uuid.UUID
		var s domain.ProductSpec
		if err := rows.Scan(&productID, &s.Key, &s.Value, &s.SortOrder); err != nil {
			return nil, fmt.Errorf("postgres.ProductRepo.loadSpecs scan: %w", err)
		}
		result[productID] = append(result[productID], s)
	}
	return result, rows.Err()
}

func (r *postgresProductRepo) ListPaged(ctx context.Context, f domain.ProductFilter) (domain.ProductPage, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+productCols+`, COUNT(*) OVER() AS total
		FROM products
		WHERE ($1::uuid IS NULL OR category_id = $1)
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`,
		f.CategoryID, f.Limit, f.Offset,
	)
	if err != nil {
		return domain.ProductPage{}, fmt.Errorf("postgres.ProductRepo.ListPaged: %w", err)
	}
	defer rows.Close()

	var products []domain.Product
	var total int
	for rows.Next() {
		var p domain.Product
		err := rows.Scan(
			&p.ID, &p.SKU, &p.Title, &p.Sub, &p.CategoryID, &p.CatLabel, &p.Unit, &p.UnitDetail,
			&p.Price, &p.OldPrice, &p.PricePallet, &p.PalletQty, &p.Stock, &p.StockUnit, &p.ETA,
			&p.Rating, &p.Reviews, &p.Tag, &p.CreatedAt, &p.UpdatedAt,
			&total,
		)
		if err != nil {
			return domain.ProductPage{}, fmt.Errorf("postgres.ProductRepo.ListPaged scan: %w", err)
		}
		products = append(products, p)
	}
	if err := rows.Err(); err != nil {
		return domain.ProductPage{}, fmt.Errorf("postgres.ProductRepo.ListPaged: %w", err)
	}

	if len(products) > 0 {
		ids := make([]uuid.UUID, len(products))
		for i, p := range products {
			ids[i] = p.ID
		}
		specsMap, err := r.loadSpecs(ctx, ids)
		if err != nil {
			return domain.ProductPage{}, err
		}
		for i := range products {
			products[i].Specs = specsMap[products[i].ID]
		}
	}

	return domain.ProductPage{Items: products, Total: total}, nil
}

func (r *postgresProductRepo) getOne(ctx context.Context, query string, args ...any) (*domain.Product, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return nil, domain.ErrNotFound
	}

	p, err := scanProduct(rows)
	if err != nil {
		return nil, err
	}

	specsMap, err := r.loadSpecs(ctx, []uuid.UUID{p.ID})
	if err != nil {
		return nil, err
	}
	p.Specs = specsMap[p.ID]

	return &p, nil
}

func (r *postgresProductRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Product, error) {
	p, err := r.getOne(ctx, `SELECT `+productCols+` FROM products WHERE id = $1`, id)
	if err != nil {
		return nil, fmt.Errorf("postgres.ProductRepo.GetByID: %w", err)
	}
	return p, nil
}

func (r *postgresProductRepo) GetBySKU(ctx context.Context, sku string) (*domain.Product, error) {
	p, err := r.getOne(ctx, `SELECT `+productCols+` FROM products WHERE sku = $1`, sku)
	if err != nil {
		return nil, fmt.Errorf("postgres.ProductRepo.GetBySKU: %w", err)
	}
	return p, nil
}
