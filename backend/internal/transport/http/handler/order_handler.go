package handler

import (
	"Snabju/backend/internal/domain"
	"Snabju/backend/internal/tochka"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type OrderHandler struct {
	orderService       domain.OrderService
	tochkaClient       *tochka.Client
	webhookVerifier    *tochka.WebhookVerifier
	tochkaCustomerCode string
	tochkaMerchantID   string
}

func NewOrderHandler(orderService domain.OrderService, tochkaClient *tochka.Client, webhookVerifier *tochka.WebhookVerifier, customerCode, merchantID string) *OrderHandler {
	return &OrderHandler{orderService: orderService, tochkaClient: tochkaClient, webhookVerifier: webhookVerifier, tochkaCustomerCode: customerCode, tochkaMerchantID: merchantID}
}

func (h *OrderHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ContactName    string `json:"contact_name"`
		ContactPhone   string `json:"contact_phone"`
		Address        string `json:"address"`
		GuestEmail     string `json:"guest_email"`
		DeliveryMethod string `json:"delivery_method"`
		PaymentMethod  string `json:"payment_method"`
		CustomerType   string `json:"customer_type"`
		Comment        string `json:"comment"`
		Company        string `json:"company"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.PaymentMethod == "sbp" && (h.tochkaClient == nil || !h.tochkaClient.Enabled()) {
		writeError(w, http.StatusServiceUnavailable, "оплата через СБП временно недоступна")
		return
	}

	sessionID := sessionIDFromRequest(r)
	userID := userIDFromRequest(r)

	order := &domain.Order{
		SessionID:      sessionID,
		UserID:         userID,
		ContactName:    req.ContactName,
		ContactPhone:   req.ContactPhone,
		Address:        req.Address,
		GuestEmail:     req.GuestEmail,
		DeliveryMethod: req.DeliveryMethod,
		PaymentMethod:  req.PaymentMethod,
		CustomerType:   req.CustomerType,
		Comment:        req.Comment,
		Company:        req.Company,
	}

	created, err := h.orderService.Create(r.Context(), order)
	if err != nil {
		handleServiceError(w, err)
		return
	}
	if created.PaymentMethod == "sbp" {
		operationID, paymentLink, err := h.tochkaClient.CreateSBPPayment(r.Context(), created)
		if err != nil {
			slog.Error("create Tochka payment link", "order_id", created.ID, "err", err)
			writeError(w, http.StatusBadGateway, "не удалось создать ссылку на оплату")
			return
		}
		if err := h.orderService.SetPaymentLink(r.Context(), created.ID, operationID, paymentLink); err != nil {
			slog.Error("save Tochka payment link", "order_id", created.ID, "err", err)
			writeError(w, http.StatusInternalServerError, "не удалось сохранить ссылку на оплату")
			return
		}
		created.PaymentStatus = "created"
		created.PaymentOperationID = operationID
		created.PaymentLink = paymentLink
	}

	writeJSON(w, http.StatusCreated, created)
}

func (h *OrderHandler) TochkaWebhook(w http.ResponseWriter, r *http.Request) {
	if h.webhookVerifier == nil {
		writeError(w, http.StatusServiceUnavailable, "webhook не настроен")
		return
	}
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid webhook body")
		return
	}
	claims, err := h.webhookVerifier.Verify(r.Context(), string(body))
	if err != nil {
		slog.Warn("invalid Tochka webhook", "err", err)
		// Точка отправляет тестовый запрос при регистрации вебхука. Его тело может
		// не быть подписанным, но банк ожидает HTTP 200. Необработанные данные не
		// влияют на заказ — возврат нужен только чтобы подтвердить доступность URL.
		w.WriteHeader(http.StatusOK)
		return
	}
	if asString(claims["webhookType"]) != "acquiringInternetPayment" || asString(claims["status"]) != "APPROVED" || asString(claims["paymentType"]) != "sbp" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if h.tochkaCustomerCode != "" && asString(claims["customerCode"]) != h.tochkaCustomerCode {
		writeError(w, http.StatusUnauthorized, "invalid customer")
		return
	}
	if h.tochkaMerchantID != "" && asString(claims["merchantId"]) != h.tochkaMerchantID {
		writeError(w, http.StatusUnauthorized, "invalid merchant")
		return
	}
	orderID, err := uuid.Parse(asString(claims["paymentLinkId"]))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid payment link")
		return
	}
	amount, err := strconv.ParseFloat(asString(claims["amount"]), 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid amount")
		return
	}
	if err := h.orderService.ConfirmPayment(r.Context(), orderID, asString(claims["operationId"]), amount); err != nil {
		var validation domain.ErrValidation
		if errors.As(err, &validation) {
			writeError(w, http.StatusBadRequest, validation.Msg)
			return
		}
		slog.Error("confirm Tochka payment", "order_id", orderID, "err", err)
		writeError(w, http.StatusInternalServerError, "payment processing failed")
		return
	}
	w.WriteHeader(http.StatusOK)
}

func asString(value any) string {
	switch v := value.(type) {
	case string:
		return v
	case json.Number:
		return v.String()
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	default:
		return fmt.Sprint(v)
	}
}

func (h *OrderHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromRequest(r)
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	orders, err := h.orderService.ListByUser(r.Context(), *userID)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	if orders == nil {
		orders = []domain.Order{}
	}

	writeJSON(w, http.StatusOK, map[string]any{"items": orders})
}

func (h *OrderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid order id")
		return
	}

	order, err := h.orderService.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "order not found")
			return
		}
		handleServiceError(w, err)
		return
	}

	// проверяем что заказ принадлежит текущей сессии или пользователю
	sessionID := sessionIDFromRequest(r)
	userID := userIDFromRequest(r)

	ownsOrder := (userID != nil && order.UserID != nil && *order.UserID == *userID) ||
		(sessionID != "" && order.SessionID == sessionID)

	if !ownsOrder {
		// возвращаем 404 чтобы не раскрывать существование заказа
		writeError(w, http.StatusNotFound, "order not found")
		return
	}

	writeJSON(w, http.StatusOK, order)
}
