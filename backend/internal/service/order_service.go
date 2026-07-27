package service

import (
	"Snabju/backend/internal/domain"
	"Snabju/backend/internal/metrics"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"github.com/google/uuid"
)

type orderService struct {
	orderRepo   domain.OrderRepository
	userRepo    domain.UserRepository
	cartRepo    domain.CartRepository
	productRepo domain.ProductRepository
	publisher   domain.EventPublisher
}

func NewOrderService(
	orderRepo domain.OrderRepository,
	userRepo domain.UserRepository,
	cartRepo domain.CartRepository,
	productRepo domain.ProductRepository,
	publisher domain.EventPublisher,
) domain.OrderService {
	return &orderService{
		orderRepo:   orderRepo,
		userRepo:    userRepo,
		cartRepo:    cartRepo,
		productRepo: productRepo,
		publisher:   publisher,
	}
}

func (s *orderService) Create(ctx context.Context, o *domain.Order) (*domain.Order, error) {
	if strings.TrimSpace(o.ContactName) == "" {
		return nil, domain.ErrValidation{Field: "contact_name", Msg: "required"}
	}
	if strings.TrimSpace(o.ContactPhone) == "" {
		return nil, domain.ErrValidation{Field: "contact_phone", Msg: "required"}
	}
	if strings.TrimSpace(o.Address) == "" {
		return nil, domain.ErrValidation{Field: "address", Msg: "required"}
	}
	if o.UserID == nil && strings.TrimSpace(o.SessionID) == "" {
		return nil, domain.ErrValidation{Field: "session_id", Msg: "required for guest orders"}
	}

	// Fetch cart items
	var cartItems []domain.CartItem
	var err error
	if o.UserID != nil {
		cartItems, err = s.cartRepo.ListByUser(ctx, *o.UserID)
	} else {
		cartItems, err = s.cartRepo.ListBySession(ctx, o.SessionID)
	}
	if err != nil {
		return nil, fmt.Errorf("orderService.Create: fetch cart: %w", err)
	}

	// Build order items and calculate total
	orderID := uuid.New()
	var orderItems []domain.OrderItem
	var total float64

	for _, ci := range cartItems {
		product, err := s.productRepo.GetByID(ctx, ci.ProductID)
		if err != nil {
			return nil, fmt.Errorf("orderService.Create: fetch product %s: %w", ci.ProductID, err)
		}

		price := product.Price
		if ci.MarkdownPrice != nil {
			price = *ci.MarkdownPrice
		} else if ci.AsPallet && product.PriceBox != nil {
			price = *product.PriceBox
		}

		itemTotal := price * float64(ci.Qty)
		total += itemTotal

		orderItems = append(orderItems, domain.OrderItem{
			ID:        uuid.New(),
			OrderID:   orderID,
			ProductID: product.ID,
			Title:     product.Title,
			SKU:       product.SKU,
			Unit:      product.Unit,
			Price:     price,
			Qty:       ci.Qty,
			Total:     itemTotal,
		})
	}

	o.ID = orderID
	o.Status = "Новый"
	o.StatusKind = domain.OrderStatusPending
	o.ItemsCount = len(orderItems)
	o.Total = total
	o.Items = orderItems

	if err := s.orderRepo.Create(ctx, o); err != nil {
		return nil, fmt.Errorf("orderService.Create: %w", err)
	}

	if len(orderItems) > 0 {
		if err := s.orderRepo.CreateItems(ctx, orderItems); err != nil {
			return nil, fmt.Errorf("orderService.Create: save items: %w", err)
		}
	}

	// Clear cart
	if o.UserID != nil {
		if err := s.cartRepo.Clear(ctx, *o.UserID); err != nil {
			slog.Error("orderService.Create: clear cart by user", "err", err)
		}
	} else {
		if err := s.cartRepo.ClearBySession(ctx, o.SessionID); err != nil {
			slog.Error("orderService.Create: clear cart by session", "err", err)
		}
	}

	s.publishOrderConfirmed(ctx, o)
	metrics.OrdersCreatedTotal.Inc()

	return o, nil
}

func (s *orderService) publishOrderConfirmed(ctx context.Context, o *domain.Order) {
	var email *string
	if o.UserID != nil {
		if user, err := s.userRepo.GetByID(ctx, *o.UserID); err == nil {
			email = user.Email
		}
	} else if o.GuestEmail != "" {
		email = &o.GuestEmail
	}

	payload, err := json.Marshal(domain.OrderConfirmedPayload{
		OrderID:      o.ID.String(),
		ContactName:  o.ContactName,
		ContactPhone: o.ContactPhone,
		Address:      o.Address,
		Email:        email,
		Total:        o.Total,
	})
	if err != nil {
		slog.Error("order: marshal event payload", "err", err)
		return
	}
	if err := s.publisher.Publish(ctx, "notifications", domain.Event{
		Type:    domain.EventOrderConfirmed,
		Payload: payload,
	}); err != nil {
		slog.Error("order: publish event", "err", err)
	}
}

func (s *orderService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("orderService.GetByID: %w", err)
	}
	return order, nil
}

func (s *orderService) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Order, error) {
	orders, err := s.orderRepo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("orderService.ListByUser: %w", err)
	}
	return orders, nil
}

func (s *orderService) ListBySession(ctx context.Context, sessionID string) ([]domain.Order, error) {
	orders, err := s.orderRepo.ListBySessionID(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("orderService.ListBySession: %w", err)
	}
	return orders, nil
}

func (s *orderService) ListAll(ctx context.Context, limit, offset int) ([]domain.Order, int, error) {
	orders, total, err := s.orderRepo.ListAll(ctx, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("orderService.ListAll: %w", err)
	}
	return orders, total, nil
}

func (s *orderService) UpdateStatus(ctx context.Context, id uuid.UUID, kind domain.OrderStatus, status string) error {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("orderService.UpdateStatus: get order: %w", err)
	}
	if err := s.orderRepo.UpdateStatus(ctx, id, kind, status); err != nil {
		return fmt.Errorf("orderService.UpdateStatus: %w", err)
	}
	s.publishOrderStatusChanged(ctx, order, kind, status)
	return nil
}

func (s *orderService) publishOrderStatusChanged(ctx context.Context, o *domain.Order, kind domain.OrderStatus, status string) {
	payload, err := json.Marshal(domain.OrderStatusChangedPayload{
		OrderID:       o.ID.String(),
		ContactName:   o.ContactName,
		ContactPhone:  o.ContactPhone,
		NewStatus:     status,
		NewStatusKind: kind,
	})
	if err != nil {
		slog.Error("order: marshal status changed payload", "err", err)
		return
	}
	if err := s.publisher.Publish(ctx, "notifications", domain.Event{
		Type:    domain.EventOrderStatusChanged,
		Payload: payload,
	}); err != nil {
		slog.Error("order: publish status changed event", "err", err)
	}
}
