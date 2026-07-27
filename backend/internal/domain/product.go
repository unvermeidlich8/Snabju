package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type ProductSpec struct {
	Key       string `json:"key"`
	Value     string `json:"value"`
	SortOrder int    `json:"sort_order"`
}

type Product struct {
	ID         uuid.UUID     `json:"id"`
	SKU        string        `json:"sku"`
	Title      string        `json:"title"`
	Sub        string        `json:"sub"`
	CategoryID *uuid.UUID    `json:"category_id"`
	CatLabel   string        `json:"cat_label"`
	Unit       string        `json:"unit"`
	UnitDetail string        `json:"unit_detail"`
	Price      float64       `json:"price"`
	OldPrice   *float64      `json:"old_price"`
	PriceBox   *float64      `json:"price_box"`
	BoxQty     int           `json:"box_qty"`
	Stock      int           `json:"stock"`
	StockUnit  string        `json:"stock_unit"`
	ETA        string        `json:"eta"`
	Rating     float64       `json:"rating"`
	Reviews    int           `json:"reviews"`
	Tag        string        `json:"tag"`
	ImageURL   string        `json:"image_url"`
	IsActive   bool          `json:"is_active"`
	Specs      []ProductSpec `json:"specs"`
	CreatedAt  time.Time     `json:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at"`
}

type ProductFilter struct {
	CategoryID      *uuid.UUID
	Search          string
	Brands          []string
	Limit           int
	Offset          int
	Sort            string // popular | price_asc | price_desc | new
	IncludeInactive bool
}

type ProductPage struct {
	Items []Product
	Total int
}

type CreateProductInput struct {
	SKU        string
	Title      string
	Sub        string
	CategoryID *uuid.UUID
	Brand      string
	Unit       string
	UnitDetail string
	Price      float64
	OldPrice   *float64
	PriceBox   *float64
	BoxQty     int
	Stock      int
	StockUnit  string
	ETA        string
	Rating     float64
	Tag        string
	ImageURL   string
	Specs      []ProductSpec
}

type UpdateProductInput struct {
	Title      string
	Sub        string
	CategoryID *uuid.UUID
	Unit       string
	Price      float64
	PriceBox   *float64
	BoxQty     int
	Stock      int
	StockUnit  string
	Tag        string
	ImageURL   string
	IsActive   bool
	Specs      []ProductSpec
}

type ProductRepository interface {
	ListPaged(ctx context.Context, f ProductFilter) (ProductPage, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Product, error)
	GetBySKU(ctx context.Context, sku string) (*Product, error)
	Create(ctx context.Context, in CreateProductInput) (*Product, error)
	Update(ctx context.Context, id uuid.UUID, in UpdateProductInput) (*Product, error)
	Delete(ctx context.Context, id uuid.UUID) error
	ListBrands(ctx context.Context) ([]string, error)
}

type ProductService interface {
	ListPaged(ctx context.Context, f ProductFilter) (ProductPage, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Product, error)
	GetBySKU(ctx context.Context, sku string) (*Product, error)
	Create(ctx context.Context, in CreateProductInput) (*Product, error)
	Update(ctx context.Context, id uuid.UUID, in UpdateProductInput) (*Product, error)
	Delete(ctx context.Context, id uuid.UUID) error
	ListBrands(ctx context.Context) ([]string, error)
}
