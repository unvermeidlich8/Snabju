package handler

import (
	"Snabju/backend/internal/domain"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type MarkdownHandler struct {
	svc domain.MarkdownService
}

func NewMarkdownHandler(svc domain.MarkdownService) *MarkdownHandler {
	return &MarkdownHandler{svc: svc}
}

// GET /api/v1/markdown
func (h *MarkdownHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.List(r.Context())
	if err != nil {
		handleServiceError(w, err)
		return
	}
	if items == nil {
		items = []*domain.MarkdownItem{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

// POST /api/v1/admin/markdown
func (h *MarkdownHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProductID string  `json:"product_id"`
		Qty       int     `json:"qty"`
		Price     float64 `json:"price"`
		Reason    string  `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid product_id")
		return
	}
	item, err := h.svc.Create(r.Context(), productID, req.Qty, req.Price, req.Reason)
	if err != nil {
		var valErr domain.ErrValidation
		if errors.As(err, &valErr) {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		handleServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

// DELETE /api/v1/admin/markdown/:id
func (h *MarkdownHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		handleServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
