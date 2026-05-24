package handler

import (
	"Snabju/backend/internal/domain"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CartHandler struct {
	cartService domain.CartService
}

func NewCartHandler(cartService domain.CartService) *CartHandler {
	return &CartHandler{cartService: cartService}
}

func (h *CartHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	sessionID := sessionIDFromRequest(r)
	userID := userIDFromRequest(r)

	items, err := h.cartService.GetItems(r.Context(), sessionID, userID)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	if items == nil {
		items = []domain.CartItem{}
	}

	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *CartHandler) AddItem(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProductID string `json:"product_id"`
		Qty       int    `json:"qty"`
		AsPallet  bool   `json:"as_pallet"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid product_id")
		return
	}

	sessionID := sessionIDFromRequest(r)
	userID := userIDFromRequest(r)

	item, err := h.cartService.AddItem(r.Context(), sessionID, userID, productID, req.Qty, req.AsPallet)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, item)
}

func (h *CartHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid item id")
		return
	}

	var req struct {
		Qty int `json:"qty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.cartService.UpdateItem(r.Context(), id, req.Qty); err != nil {
		handleServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *CartHandler) RemoveItem(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid item id")
		return
	}

	if err := h.cartService.RemoveItem(r.Context(), id); err != nil {
		handleServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
