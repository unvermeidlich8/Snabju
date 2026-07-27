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
		ProductID      *string `json:"product_id"`
		Qty            int     `json:"qty"`
		AsPallet       bool    `json:"as_pallet"`
		MarkdownItemID *string `json:"markdown_item_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "некорректное тело запроса")
		return
	}

	var productID uuid.UUID
	var markdownItemID *uuid.UUID

	if req.MarkdownItemID != nil && *req.MarkdownItemID != "" {
		id, err := uuid.Parse(*req.MarkdownItemID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "некорректный markdown_item_id")
			return
		}
		markdownItemID = &id
	} else {
		if req.ProductID == nil || *req.ProductID == "" {
			writeError(w, http.StatusBadRequest, "нужно передать product_id или markdown_item_id")
			return
		}
		id, err := uuid.Parse(*req.ProductID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "некорректный product_id")
			return
		}
		productID = id
	}

	sessionID := sessionIDFromRequest(r)
	userID := userIDFromRequest(r)

	item, err := h.cartService.AddItem(r.Context(), sessionID, userID, productID, req.Qty, req.AsPallet, markdownItemID)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, item)
}

func (h *CartHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "некорректный id позиции корзины")
		return
	}

	var req struct {
		Qty int `json:"qty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "некорректное тело запроса")
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
		writeError(w, http.StatusBadRequest, "некорректный id позиции корзины")
		return
	}

	if err := h.cartService.RemoveItem(r.Context(), id); err != nil {
		handleServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
