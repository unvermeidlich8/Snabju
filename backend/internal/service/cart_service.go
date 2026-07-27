package service

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"

	"github.com/google/uuid"
)

type cartService struct {
	cartRepo     domain.CartRepository
	productRepo  domain.ProductRepository
	markdownRepo domain.MarkdownRepository
}

func NewCartService(cartRepo domain.CartRepository, productRepo domain.ProductRepository, markdownRepo domain.MarkdownRepository) domain.CartService {
	return &cartService{cartRepo: cartRepo, productRepo: productRepo, markdownRepo: markdownRepo}
}

func (s *cartService) AddItem(ctx context.Context, sessionID string, userID *uuid.UUID, productID uuid.UUID, qty int, asPallet bool, markdownItemID *uuid.UUID) (*domain.CartItem, error) {
	if qty <= 0 {
		return nil, domain.ErrValidation{Field: "qty", Msg: "должно быть больше нуля"}
	}

	item := &domain.CartItem{
		SessionID:      sessionID,
		UserID:         userID,
		ProductID:      productID,
		Qty:            qty,
		AsPallet:       asPallet,
		MarkdownItemID: markdownItemID,
	}

	if markdownItemID != nil {
		m, err := s.markdownRepo.GetByID(ctx, *markdownItemID)
		if err != nil {
			return nil, domain.ErrNotFound
		}
		item.ProductID = m.ProductID
	}

	items, err := s.getScopedItems(ctx, sessionID, userID)
	if err != nil {
		return nil, fmt.Errorf("cartService.AddItem: %w", err)
	}

	sameItems := filterMatchingCartItems(items, item, uuid.Nil)
	existingQty := sumQty(sameItems)
	targetQty := existingQty + qty

	if err := s.validateAvailableQty(ctx, item.ProductID, markdownItemID, targetQty); err != nil {
		return nil, err
	}

	if len(sameItems) > 0 {
		target := sameItems[0]
		if err := s.cartRepo.Update(ctx, target.ID, targetQty); err != nil {
			return nil, fmt.Errorf("cartService.AddItem: %w", err)
		}
		for _, duplicate := range sameItems[1:] {
			if err := s.cartRepo.Delete(ctx, duplicate.ID); err != nil {
				return nil, fmt.Errorf("cartService.AddItem: cleanup duplicate: %w", err)
			}
		}
		target.Qty = targetQty
		return &target, nil
	}

	if err := s.cartRepo.Add(ctx, item); err != nil {
		return nil, fmt.Errorf("cartService.AddItem: %w", err)
	}
	return item, nil
}

func (s *cartService) UpdateItem(ctx context.Context, itemID uuid.UUID, qty int) error {
	if qty <= 0 {
		return domain.ErrValidation{Field: "qty", Msg: "должно быть больше нуля"}
	}

	item, err := s.cartRepo.GetByID(ctx, itemID)
	if err != nil {
		return fmt.Errorf("cartService.UpdateItem: %w", err)
	}

	items, err := s.getScopedItems(ctx, item.SessionID, item.UserID)
	if err != nil {
		return fmt.Errorf("cartService.UpdateItem: %w", err)
	}

	relatedQty := sumQty(filterMatchingCartItems(items, item, item.ID))
	if err := s.validateAvailableQty(ctx, item.ProductID, item.MarkdownItemID, relatedQty+qty); err != nil {
		return err
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

func (s *cartService) getScopedItems(ctx context.Context, sessionID string, userID *uuid.UUID) ([]domain.CartItem, error) {
	if userID != nil {
		return s.cartRepo.ListByUser(ctx, *userID)
	}
	return s.cartRepo.ListBySession(ctx, sessionID)
}

func (s *cartService) validateAvailableQty(ctx context.Context, productID uuid.UUID, markdownItemID *uuid.UUID, qty int) error {
	if markdownItemID != nil {
		m, err := s.markdownRepo.GetByID(ctx, *markdownItemID)
		if err != nil {
			return domain.ErrNotFound
		}
		if qty > m.Qty {
			return domain.ErrValidation{Field: "qty", Msg: "превышает доступный остаток уценки"}
		}
		return nil
	}

	product, err := s.productRepo.GetByID(ctx, productID)
	if err != nil {
		return domain.ErrNotFound
	}
	if qty > product.Stock {
		return domain.ErrValidation{Field: "qty", Msg: "превышает доступный остаток"}
	}
	return nil
}

func filterMatchingCartItems(items []domain.CartItem, target *domain.CartItem, excludeID uuid.UUID) []domain.CartItem {
	var matched []domain.CartItem
	for _, item := range items {
		if excludeID != uuid.Nil && item.ID == excludeID {
			continue
		}
		if item.ProductID != target.ProductID || item.AsPallet != target.AsPallet {
			continue
		}
		if !sameOptionalUUID(item.MarkdownItemID, target.MarkdownItemID) {
			continue
		}
		matched = append(matched, item)
	}
	return matched
}

func sameOptionalUUID(a, b *uuid.UUID) bool {
	if a == nil || b == nil {
		return a == nil && b == nil
	}
	return *a == *b
}

func sumQty(items []domain.CartItem) int {
	total := 0
	for _, item := range items {
		total += item.Qty
	}
	return total
}
