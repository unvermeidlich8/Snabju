package service

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"

	"github.com/google/uuid"
)

type productService struct {
	productRepo domain.ProductRepository
}

func NewProductService(productRepo domain.ProductRepository) domain.ProductService {
	return &productService{productRepo: productRepo}
}

func (s *productService) ListPaged(ctx context.Context, f domain.ProductFilter) (domain.ProductPage, error) {
	if f.Limit <= 0 {
		f.Limit = 20
	}
	if f.Offset < 0 {
		f.Offset = 0
	}
	page, err := s.productRepo.ListPaged(ctx, f)
	if err != nil {
		return domain.ProductPage{}, fmt.Errorf("productService.ListPaged: %w", err)
	}
	return page, nil
}

func (s *productService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Product, error) {
	product, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("productService.GetByID: %w", err)
	}
	return product, nil
}

func (s *productService) GetBySKU(ctx context.Context, sku string) (*domain.Product, error) {
	product, err := s.productRepo.GetBySKU(ctx, sku)
	if err != nil {
		return nil, fmt.Errorf("productService.GetBySKU: %w", err)
	}
	return product, nil
}
