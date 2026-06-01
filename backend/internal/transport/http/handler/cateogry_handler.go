package handler

import (
	"Snabju/backend/internal/domain"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CatalogHandler struct {
	categoryService domain.CategoryService
	productService  domain.ProductService
}

func NewCatalogHandler(categoryService domain.CategoryService, productService domain.ProductService) *CatalogHandler {
	return &CatalogHandler{
		categoryService: categoryService,
		productService:  productService,
	}
}

func (h *CatalogHandler) Categories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.categoryService.List(r.Context())
	if err != nil {
		handleServiceError(w, err)
		return
	}

	if categories == nil {
		categories = []domain.Category{}
	}

	writeJSON(w, http.StatusOK, map[string]any{"items": categories})
}

func (h *CatalogHandler) ListProducts(w http.ResponseWriter, r *http.Request) {
	f := domain.ProductFilter{
		Limit:  20,
		Offset: 0,
	}

	if raw := r.URL.Query().Get("category_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid category_id")
			return
		}
		f.CategoryID = &id
	}
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			f.Limit = n
		}
	}
	if v := r.URL.Query().Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			f.Offset = n
		}
	}
	if v := r.URL.Query().Get("sort"); v != "" {
		f.Sort = v
	}

	page, err := h.productService.ListPaged(r.Context(), f)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	if page.Items == nil {
		page.Items = []domain.Product{}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"items":  page.Items,
		"total":  page.Total,
		"limit":  f.Limit,
		"offset": f.Offset,
	})
}

func (h *CatalogHandler) GetProduct(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	product, err := h.productService.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "product not found")
			return
		}
		handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, product)
}
