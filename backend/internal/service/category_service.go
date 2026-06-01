package service

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"

	"github.com/google/uuid"
)

type categoryService struct {
	categoryRepo domain.CategoryRepository
}

func NewCategoryService(categoryRepo domain.CategoryRepository) domain.CategoryService {
	return &categoryService{categoryRepo: categoryRepo}
}

func (s *categoryService) List(ctx context.Context) ([]domain.Category, error) {
	categories, err := s.categoryRepo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("categoryService.List: %w", err)
	}
	return categories, nil
}

func (s *categoryService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	category, err := s.categoryRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("categoryService.GetByID: %w", err)
	}
	return category, nil
}

func (s *categoryService) Create(ctx context.Context, in domain.CreateCategoryInput) (*domain.Category, error) {
	if in.Title == "" {
		return nil, domain.ErrValidation{Field: "title", Msg: "required"}
	}
	cat, err := s.categoryRepo.Create(ctx, in)
	if err != nil {
		return nil, fmt.Errorf("categoryService.Create: %w", err)
	}
	return cat, nil
}

func (s *categoryService) Update(ctx context.Context, id uuid.UUID, in domain.UpdateCategoryInput) (*domain.Category, error) {
	if in.Title == "" {
		return nil, domain.ErrValidation{Field: "title", Msg: "required"}
	}
	cat, err := s.categoryRepo.Update(ctx, id, in)
	if err != nil {
		return nil, fmt.Errorf("categoryService.Update: %w", err)
	}
	return cat, nil
}

func (s *categoryService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.categoryRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("categoryService.Delete: %w", err)
	}
	return nil
}
