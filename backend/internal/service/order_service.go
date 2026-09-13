package service

import (
	"Snabju/backend/internal/domain"
	"Snabju/backend/internal/metrics"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
)

type orderService struct {
	orderRepo    domain.OrderRepository
	userRepo     domain.UserRepository
	cartRepo     domain.CartRepository
	productRepo  domain.ProductRepository
	publisher    domain.EventPublisher
	settingsRepo domain.SettingsRepository
}

func NewOrderService(
	orderRepo domain.OrderRepository,
	userRepo domain.UserRepository,
	cartRepo domain.CartRepository,
	productRepo domain.ProductRepository,
	publisher domain.EventPublisher, settingsRepo domain.SettingsRepository,
) domain.OrderService {
	return &orderService{
		orderRepo:   orderRepo,
		userRepo:    userRepo,
		cartRepo:    cartRepo,
		productRepo: productRepo,
		publisher:   publisher, settingsRepo: settingsRepo,
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
	if o.DeliveryMethod == "" {
		o.DeliveryMethod = "pickup"
	}
	if o.CustomerType == "" {
		o.CustomerType = "retail"
	}
	if o.CustomerType != "retail" && o.CustomerType != "organization" {
		return nil, domain.ErrValidation{Field: "customer_type", Msg: "некорректный тип покупателя"}
	}
	if o.PaymentMethod == "" {
		return nil, domain.ErrValidation{Field: "payment_method", Msg: "выберите способ оплаты"}
	}
	validPaymentMethods := map[string]bool{"invoice": true, "sbp": true}
	if !validPaymentMethods[o.PaymentMethod] {
		return nil, domain.ErrValidation{Field: "payment_method", Msg: "некорректный способ оплаты"}
	}
	if (o.CustomerType == "retail" && o.PaymentMethod != "sbp") || (o.CustomerType == "organization" && o.PaymentMethod != "invoice") {
		return nil, domain.ErrValidation{Field: "payment_method", Msg: "некорректный способ оплаты для выбранного покупателя"}
	}
	if o.DeliveryMethod != "pickup" && o.DeliveryMethod != "delivery" {
		return nil, domain.ErrValidation{Field: "delivery_method", Msg: "некорректный способ получения"}
	}
	if o.UserID != nil && o.Company == "" {
		if user, err := s.userRepo.GetByID(ctx, *o.UserID); err == nil {
			o.Company = user.Company
			if user.Email != nil {
				o.GuestEmail = *user.Email
			}
		}
	}
	if o.CustomerType == "organization" && strings.TrimSpace(o.Company) == "" {
		return nil, domain.ErrValidation{Field: "company", Msg: "укажите организацию"}
	}
	if o.UserID == nil && strings.TrimSpace(o.SessionID) == "" {
		return nil, domain.ErrValidation{Field: "session_id", Msg: "required for guest orders"}
	}
	if o.PaymentMethod == "sbp" && strings.TrimSpace(o.GuestEmail) == "" {
		return nil, domain.ErrValidation{Field: "email", Msg: "укажите email для кассового чека"}
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
	if len(cartItems) == 0 {
		return nil, domain.ErrValidation{Field: "cart", Msg: "корзина пуста"}
	}

	// Build order items and calculate total
	orderID := uuid.New()
	var orderItems []domain.OrderItem
	var total float64
	stockByProduct := make(map[uuid.UUID]int)
	discount, err := s.settingsRepo.GetB2BDiscountPercent(ctx)
	if err != nil {
		return nil, fmt.Errorf("orderService.Create: get B2B discount: %w", err)
	}

	for _, ci := range cartItems {
		product, err := s.productRepo.GetByID(ctx, ci.ProductID)
		if err != nil {
			return nil, fmt.Errorf("orderService.Create: fetch product %s: %w", ci.ProductID, err)
		}

		price := product.Price
		if ci.MarkdownPrice != nil {
			price = *ci.MarkdownPrice
		} else if ci.IsBox && product.PriceBox != nil {
			price = *product.PriceBox
		}
		if ci.MarkdownPrice == nil && o.CustomerType == "organization" {
			price = math.Round(price*(100-discount)) / 100
		}

		unit := product.Unit
		if ci.IsBox {
			unit = "коробка"
		}

		itemTotal := price * float64(ci.Qty)
		total += itemTotal
		stockQty := ci.Qty
		if ci.IsBox {
			stockQty *= product.BoxQty
		}
		stockByProduct[product.ID] += stockQty

		orderItems = append(orderItems, domain.OrderItem{
			ID:        uuid.New(),
			OrderID:   orderID,
			ProductID: product.ID,
			Title:     product.Title,
			SKU:       product.SKU,
			Unit:      unit,
			Price:     price,
			Qty:       ci.Qty,
			Total:     itemTotal,
		})
	}

	o.ID = orderID
	o.CreatedAt = time.Now()
	o.UpdatedAt = o.CreatedAt
	o.Status = "Новый"
	o.StatusKind = domain.OrderStatusPending
	if o.PaymentMethod == "sbp" {
		o.PaymentStatus = "pending"
	} else {
		o.PaymentStatus = "not_required"
	}
	o.ItemsCount = len(orderItems)
	o.Total = total
	o.Items = orderItems

	// An SBP order must not affect inventory until Tochka confirms the payment.
	// Invoice orders retain the existing behaviour: stock is decremented at checkout.
	if o.PaymentMethod == "sbp" {
		stockByProduct = nil
	}
	if err := s.orderRepo.CreateCheckout(ctx, o, orderItems, stockByProduct); err != nil {
		return nil, fmt.Errorf("orderService.Create: %w", err)
	}

	if o.PaymentMethod != "sbp" {
		s.publishOrderConfirmed(ctx, o)
	}
	metrics.OrdersCreatedTotal.Inc()

	return o, nil
}

func (s *orderService) SetPaymentLink(ctx context.Context, id uuid.UUID, operationID, paymentLink string) error {
	return s.orderRepo.UpdatePayment(ctx, id, "created", operationID, paymentLink, nil)
}

func (s *orderService) ConfirmPayment(ctx context.Context, id uuid.UUID, operationID string, amount float64) error {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("orderService.ConfirmPayment: get order: %w", err)
	}
	if order.PaymentMethod != "sbp" || order.PaymentOperationID != operationID {
		return domain.ErrValidation{Field: "payment", Msg: "платёж не соответствует заказу"}
	}
	if math.Abs(order.Total-amount) > 0.009 {
		return domain.ErrValidation{Field: "payment", Msg: "сумма платежа не соответствует заказу"}
	}
	if order.PaymentStatus == "paid" {
		return nil
	}
	now := time.Now()
	if err := s.orderRepo.ConfirmPayment(ctx, id, operationID, now); err != nil {
		return fmt.Errorf("orderService.ConfirmPayment: update payment: %w", err)
	}
	order.PaymentStatus = "paid"
	order.PaidAt = &now
	s.publishOrderConfirmed(ctx, order)
	return nil
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
