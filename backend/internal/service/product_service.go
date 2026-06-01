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

func (s *productService) Create(ctx context.Context, in domain.CreateProductInput) (*domain.Product, error) {
	if in.Title == "" {
		return nil, domain.ErrValidation{Field: "title", Msg: "required"}
	}
	if in.Price <= 0 {
		return nil, domain.ErrValidation{Field: "price", Msg: "must be positive"}
	}
	if in.PriceBox != nil && *in.PriceBox > 0 && in.BoxQty <= 0 {
		return nil, domain.ErrValidation{Field: "box_qty", Msg: "required when price_box is set"}
	}
	product, err := s.productRepo.Create(ctx, in)
	if err != nil {
		return nil, fmt.Errorf("productService.Create: %w", err)
	}
	return product, nil
}

func (s *productService) Update(ctx context.Context, id uuid.UUID, in domain.UpdateProductInput) (*domain.Product, error) {
	if in.Title == "" {
		return nil, domain.ErrValidation{Field: "title", Msg: "required"}
	}
	if in.Price <= 0 {
		return nil, domain.ErrValidation{Field: "price", Msg: "must be positive"}
	}
	p, err := s.productRepo.Update(ctx, id, in)
	if err != nil {
		return nil, fmt.Errorf("productService.Update: %w", err)
	}
	return p, nil
}

func (s *productService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.productRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("productService.Delete: %w", err)
	}
	return nil
}

func (s *productService) ListBrands(ctx context.Context) ([]string, error) {
	brands, err := s.productRepo.ListBrands(ctx)
	if err != nil {
		return nil, fmt.Errorf("productService.ListBrands: %w", err)
	}
	return brands, nil
}
