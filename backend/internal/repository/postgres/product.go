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

type postgresProductRepo struct {
	pool *pgxpool.Pool
}

func NewPostgresProductRepo(pool *pgxpool.Pool) domain.ProductRepository {
	return &postgresProductRepo{pool: pool}
}

const productCols = `id, sku, title, sub, category_id, cat_label, unit, unit_detail,
	price, old_price, price_box, box_qty, stock, stock_unit, eta,
	rating, reviews, tag, COALESCE(image_url, '') AS image_url, created_at, updated_at`

func scanProduct(rows pgx.Rows) (domain.Product, error) {
	var p domain.Product
	err := rows.Scan(
		&p.ID, &p.SKU, &p.Title, &p.Sub, &p.CategoryID, &p.CatLabel, &p.Unit, &p.UnitDetail,
		&p.Price, &p.OldPrice, &p.PriceBox, &p.BoxQty, &p.Stock, &p.StockUnit, &p.ETA,
		&p.Rating, &p.Reviews, &p.Tag, &p.ImageURL, &p.CreatedAt, &p.UpdatedAt,
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
			&p.Price, &p.OldPrice, &p.PriceBox, &p.BoxQty, &p.Stock, &p.StockUnit, &p.ETA,
			&p.Rating, &p.Reviews, &p.Tag, &p.ImageURL, &p.CreatedAt, &p.UpdatedAt,
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

func (r *postgresProductRepo) Create(ctx context.Context, in domain.CreateProductInput) (*domain.Product, error) {
	now := time.Now()
	p := domain.Product{
		ID:         uuid.New(),
		SKU:        in.SKU,
		Title:      in.Title,
		Sub:        in.Sub,
		CategoryID: in.CategoryID,
		Unit:       in.Unit,
		UnitDetail: in.UnitDetail,
		Price:      in.Price,
		OldPrice:   in.OldPrice,
		PriceBox:   in.PriceBox,
		BoxQty:     in.BoxQty,
		Stock:      in.Stock,
		StockUnit:  in.StockUnit,
		ETA:        in.ETA,
		Rating:     in.Rating,
		Tag:        in.Tag,
		ImageURL:   in.ImageURL,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	// resolve cat_label
	if in.CategoryID != nil {
		var label string
		_ = r.pool.QueryRow(ctx, `SELECT title FROM categories WHERE id = $1`, *in.CategoryID).Scan(&label)
		p.CatLabel = label
	}

	_, err := r.pool.Exec(ctx,
		`INSERT INTO products
		 (id, sku, title, sub, category_id, cat_label, unit, unit_detail,
		  price, old_price, price_box, box_qty, stock, stock_unit, eta,
		  rating, reviews, tag, image_url, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NULLIF($19,''),$20,$21)`,
		p.ID, p.SKU, p.Title, p.Sub, p.CategoryID, p.CatLabel, p.Unit, p.UnitDetail,
		p.Price, p.OldPrice, p.PriceBox, p.BoxQty, p.Stock, p.StockUnit, p.ETA,
		p.Rating, 0, p.Tag, p.ImageURL, p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("postgres.ProductRepo.Create: %w", err)
	}

	// insert brand as spec (first, sort_order=0)
	specs := in.Specs
	if in.Brand != "" {
		brandSpec := domain.ProductSpec{Key: "Бренд", Value: in.Brand, SortOrder: 0}
		specs = append([]domain.ProductSpec{brandSpec}, specs...)
		// re-number sort_order
		for i := range specs {
			specs[i].SortOrder = i + 1
		}
	}

	if len(specs) > 0 {
		batch := &pgx.Batch{}
		for _, s := range specs {
			batch.Queue(
				`INSERT INTO product_specs (product_id, key, value, sort_order) VALUES ($1,$2,$3,$4)`,
				p.ID, s.Key, s.Value, s.SortOrder,
			)
		}
		if err := r.pool.SendBatch(ctx, batch).Close(); err != nil {
			return nil, fmt.Errorf("postgres.ProductRepo.Create specs: %w", err)
		}
		p.Specs = specs
	}

	return &p, nil
}

func (r *postgresProductRepo) ListBrands(ctx context.Context) ([]string, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT DISTINCT value FROM product_specs WHERE key = 'Бренд' ORDER BY value`,
	)
	if err != nil {
		return nil, fmt.Errorf("postgres.ProductRepo.ListBrands: %w", err)
	}
	defer rows.Close()

	var brands []string
	for rows.Next() {
		var b string
		if err := rows.Scan(&b); err != nil {
			return nil, err
		}
		brands = append(brands, b)
	}
	return brands, rows.Err()
}
