package domain

import (
	"context"

	"github.com/google/uuid"
)

type Category struct {
	ID        uuid.UUID
	Title     string
	Swatch    string
	Icon      string
	SortOrder int
}

type CategoryRepository interface {
	List(ctx context.Context) ([]Category, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Category, error)
}
