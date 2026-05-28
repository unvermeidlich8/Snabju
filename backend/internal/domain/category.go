package domain

import (
	"context"

	"github.com/google/uuid"
)

type Category struct {
	ID        uuid.UUID `json:"id"`
	Title     string    `json:"title"`
	Swatch    string    `json:"swatch"`
	Icon      string    `json:"icon"`
	ImageURL  string    `json:"image_url"`
	SortOrder int       `json:"sort_order"`
}

type CreateCategoryInput struct {
	Title     string
	Swatch    string
	Icon      string
	ImageURL  string
	SortOrder int
}

type CategoryRepository interface {
	List(ctx context.Context) ([]Category, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Category, error)
	Create(ctx context.Context, in CreateCategoryInput) (*Category, error)
}

type CategoryService interface {
	List(ctx context.Context) ([]Category, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Category, error)
	Create(ctx context.Context, in CreateCategoryInput) (*Category, error)
}
