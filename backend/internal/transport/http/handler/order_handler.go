package handler

import (
	"Snabju/backend/internal/domain"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type OrderHandler struct {
	orderService domain.OrderService
}

func NewOrderHandler(orderService domain.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

func (h *OrderHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ContactName  string `json:"contact_name"`
		ContactPhone string `json:"contact_phone"`
		Address      string `json:"address"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	sessionID := sessionIDFromRequest(r)
	userID := userIDFromRequest(r)

	order := &domain.Order{
		SessionID:    sessionID,
		UserID:       userID,
		ContactName:  req.ContactName,
		ContactPhone: req.ContactPhone,
		Address:      req.Address,
	}

	created, err := h.orderService.Create(r.Context(), order)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, created)
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
