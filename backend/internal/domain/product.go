package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type ProductSpec struct {
	Key       string
	Value     string
	SortOrder int
}

type Product struct {
	ID         uuid.UUID
	SKU        string
	Title      string
	Sub        string
	CategoryID *uuid.UUID
	CatLabel   string
	Unit       string
	UnitDetail string
	Price      float64
	OldPrice   *float64

	PricePallet *float64
	PalletQty   int
	Stock       int
	StockUnit   string
	ETA         string
	Rating      float64
	Reviews     int
	Tag         string
	Specs       []ProductSpec
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type ProductFilter struct {
	CategoryID *uuid.UUID
	Limit      int
	Offset     int
}

type ProductPage struct {
	Items []Product
	Total int
}

type ProductRepository interface {
	ListPaged(ctx context.Context, f ProductFilter) (ProductPage, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Product, error)
	GetBySKU(ctx context.Context, sku string) (*Product, error)
}

type ProductService interface {
	ListPaged(ctx context.Context, f ProductFilter) (ProductPage, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Product, error)
	GetBySKU(ctx context.Context, sku string) (*Product, error)
}
