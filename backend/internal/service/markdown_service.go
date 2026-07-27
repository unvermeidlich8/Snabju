package service

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"

	"github.com/google/uuid"
)

type markdownService struct {
	repo domain.MarkdownRepository
}

func NewMarkdownService(repo domain.MarkdownRepository) domain.MarkdownService {
	return &markdownService{repo: repo}
}

func (s *markdownService) Create(ctx context.Context, productID uuid.UUID, qty int, price float64, reason string) (*domain.MarkdownItem, error) {
	if qty <= 0 {
		return nil, domain.ErrValidation{Field: "qty", Msg: "должно быть больше нуля"}
	}
	if price <= 0 {
		return nil, domain.ErrValidation{Field: "price", Msg: "должно быть больше нуля"}
	}
	m := &domain.MarkdownItem{
		ProductID: productID,
		Qty:       qty,
		Price:     price,
		Reason:    reason,
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, fmt.Errorf("markdownService.Create: %w", err)
	}
	return m, nil
}

func (s *markdownService) List(ctx context.Context) ([]*domain.MarkdownItem, error) {
	items, err := s.repo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("markdownService.List: %w", err)
	}
	return items, nil
}

func (s *markdownService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("markdownService.Delete: %w", err)
	}
	return nil
}
