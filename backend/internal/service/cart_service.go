package service

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"

	"github.com/google/uuid"
)

type cartService struct {
	cartRepo domain.CartRepository
}

func NewCartService(cartRepo domain.CartRepository) domain.CartService {
	return &cartService{cartRepo: cartRepo}
}

func (s *cartService) AddItem(ctx context.Context, sessionID string, userID *uuid.UUID, productID uuid.UUID, qty int, asPallet bool) (*domain.CartItem, error) {
	if qty <= 0 {
		return nil, domain.ErrValidation{Field: "qty", Msg: "must be greater than zero"}
	}

	item := &domain.CartItem{
		SessionID: sessionID,
		UserID:    userID,
		ProductID: productID,
		Qty:       qty,
		AsPallet:  asPallet,
	}

	if err := s.cartRepo.Add(ctx, item); err != nil {
		return nil, fmt.Errorf("cartService.AddItem: %w", err)
	}
	return item, nil
}

func (s *cartService) UpdateItem(ctx context.Context, itemID uuid.UUID, qty int) error {
	if qty <= 0 {
		return domain.ErrValidation{Field: "qty", Msg: "must be greater than zero"}
	}
	if err := s.cartRepo.Update(ctx, itemID, qty); err != nil {
		return fmt.Errorf("cartService.UpdateItem: %w", err)
	}
	return nil
}

func (s *cartService) RemoveItem(ctx context.Context, itemID uuid.UUID) error {
	if err := s.cartRepo.Delete(ctx, itemID); err != nil {
		return fmt.Errorf("cartService.RemoveItem: %w", err)
	}
	return nil
}

// GetItems возвращает корзину: для авторизованного пользователя по userID, для гостя — по sessionID.
func (s *cartService) GetItems(ctx context.Context, sessionID string, userID *uuid.UUID) ([]domain.CartItem, error) {
	if userID != nil {
		items, err := s.cartRepo.ListByUser(ctx, *userID)
		if err != nil {
			return nil, fmt.Errorf("cartService.GetItems: %w", err)
		}
		return items, nil
	}

	items, err := s.cartRepo.ListBySession(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("cartService.GetItems: %w", err)
	}
	return items, nil
}

func (s *cartService) Clear(ctx context.Context, userID uuid.UUID) error {
	if err := s.cartRepo.Clear(ctx, userID); err != nil {
		return fmt.Errorf("cartService.Clear: %w", err)
	}
	return nil
}
