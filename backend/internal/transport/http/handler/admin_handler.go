package handler

import (
	"Snabju/backend/internal/domain"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type AdminHandler struct {
	categoryService domain.CategoryService
	productService  domain.ProductService
	orderService    domain.OrderService
}

func NewAdminHandler(categoryService domain.CategoryService, productService domain.ProductService, orderService domain.OrderService) *AdminHandler {
	return &AdminHandler{categoryService: categoryService, productService: productService, orderService: orderService}
}

// POST /api/v1/admin/categories
func (h *AdminHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title     string `json:"title"`
		Swatch    string `json:"swatch"`
		Icon      string `json:"icon"`
		ImageURL  string `json:"image_url"`
		SortOrder int    `json:"sort_order"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}

	cat, err := h.categoryService.Create(r.Context(), domain.CreateCategoryInput{
		Title:     req.Title,
		Swatch:    req.Swatch,
		Icon:      req.Icon,
		ImageURL:  req.ImageURL,
		SortOrder: req.SortOrder,
	})
	if err != nil {
		handleServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, cat)
}

// PATCH /api/v1/admin/categories/:id
func (h *AdminHandler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid category id")
		return
	}
	var req struct {
		Title     string `json:"title"`
		Swatch    string `json:"swatch"`
		Icon      string `json:"icon"`
		ImageURL  string `json:"image_url"`
		SortOrder int    `json:"sort_order"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	cat, err := h.categoryService.Update(r.Context(), id, domain.UpdateCategoryInput{
		Title:     req.Title,
		Swatch:    req.Swatch,
		Icon:      req.Icon,
		ImageURL:  req.ImageURL,
		SortOrder: req.SortOrder,
	})
	if err != nil {
		handleServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, cat)
}

// DELETE /api/v1/admin/categories/:id
func (h *AdminHandler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid category id")
		return
	}
	if err := h.categoryService.Delete(r.Context(), id); err != nil {
		handleServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /api/v1/admin/brands
func (h *AdminHandler) ListBrands(w http.ResponseWriter, r *http.Request) {
	brands, err := h.productService.ListBrands(r.Context())
	if err != nil {
		handleServiceError(w, err)
		return
	}
	if brands == nil {
		brands = []string{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": brands})
}

// POST /api/v1/admin/products
func (h *AdminHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SKU        string   `json:"sku"`
		Title      string   `json:"title"`
		Sub        string   `json:"sub"`
		CategoryID *string  `json:"category_id"`
		Brand      string   `json:"brand"`
		Unit       string   `json:"unit"`
		UnitDetail string   `json:"unit_detail"`
		Price      float64  `json:"price"`
		OldPrice   *float64 `json:"old_price"`
		PriceBox   *float64 `json:"price_box"`
		BoxQty     int      `json:"box_qty"`
		Stock      int      `json:"stock"`
		StockUnit  string   `json:"stock_unit"`
		ETA        string   `json:"eta"`
		Rating     float64  `json:"rating"`
		Tag        string   `json:"tag"`
		ImageURL   string   `json:"image_url"`
		Specs      []struct {
			Key   string `json:"key"`
			Value string `json:"value"`
		} `json:"specs"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}

	in := domain.CreateProductInput{
		SKU:        req.SKU,
		Title:      req.Title,
		Sub:        req.Sub,
		Brand:      req.Brand,
		Unit:       req.Unit,
		UnitDetail: req.UnitDetail,
		Price:      req.Price,
		OldPrice:   req.OldPrice,
		PriceBox:   req.PriceBox,
		BoxQty:     req.BoxQty,
		Stock:      req.Stock,
		StockUnit:  req.StockUnit,
		ETA:        req.ETA,
		Rating:     req.Rating,
		Tag:        req.Tag,
		ImageURL:   req.ImageURL,
	}

	if req.CategoryID != nil && *req.CategoryID != "" {
		id, err := uuid.Parse(*req.CategoryID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid category_id")
			return
		}
		in.CategoryID = &id
	}

	for i, s := range req.Specs {
		in.Specs = append(in.Specs, domain.ProductSpec{Key: s.Key, Value: s.Value, SortOrder: i + 1})
	}

	product, err := h.productService.Create(r.Context(), in)
	if err != nil {
		var valErr domain.ErrValidation
		if errors.As(err, &valErr) {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		handleServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, product)
}

// PATCH /api/v1/admin/products/:id
func (h *AdminHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	var req struct {
		Title      string   `json:"title"`
		Sub        string   `json:"sub"`
		CategoryID *string  `json:"category_id"`
		Unit       string   `json:"unit"`
		Price      float64  `json:"price"`
		PriceBox   *float64 `json:"price_box"`
		BoxQty     int      `json:"box_qty"`
		Stock      int      `json:"stock"`
		StockUnit  string   `json:"stock_unit"`
		Tag        string   `json:"tag"`
		ImageURL   string   `json:"image_url"`
		Specs      []struct {
			Key   string `json:"key"`
			Value string `json:"value"`
		} `json:"specs"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}

	in := domain.UpdateProductInput{
		Title:     req.Title,
		Sub:       req.Sub,
		Unit:      req.Unit,
		Price:     req.Price,
		PriceBox:  req.PriceBox,
		BoxQty:    req.BoxQty,
		Stock:     req.Stock,
		StockUnit: req.StockUnit,
		Tag:       req.Tag,
		ImageURL:  req.ImageURL,
	}
	if req.CategoryID != nil && *req.CategoryID != "" {
		catID, err := uuid.Parse(*req.CategoryID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid category_id")
			return
		}
		in.CategoryID = &catID
	}
	for i, s := range req.Specs {
		in.Specs = append(in.Specs, domain.ProductSpec{Key: s.Key, Value: s.Value, SortOrder: i + 1})
	}

	product, err := h.productService.Update(r.Context(), id, in)
	if err != nil {
		var valErr domain.ErrValidation
		if errors.As(err, &valErr) {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		handleServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, product)
}

// DELETE /api/v1/admin/products/:id
func (h *AdminHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid product id")
		return
	}
	if err := h.productService.Delete(r.Context(), id); err != nil {
		handleServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /api/v1/admin/orders
func (h *AdminHandler) ListOrders(w http.ResponseWriter, r *http.Request) {
	limit := 50
	offset := 0
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			limit = n
		}
	}
	if v := r.URL.Query().Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = n
		}
	}

	orders, total, err := h.orderService.ListAll(r.Context(), limit, offset)
	if err != nil {
		handleServiceError(w, err)
		return
	}
	if orders == nil {
		orders = []domain.Order{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": orders, "total": total})
}

// PATCH /api/v1/admin/orders/:id/status
func (h *AdminHandler) UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid order id")
		return
	}
	var req struct {
		StatusKind string `json:"status_kind"`
		Status     string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	kind := domain.OrderStatus(req.StatusKind)
	switch kind {
	case domain.OrderStatusPending, domain.OrderStatusProgress, domain.OrderStatusDone, domain.OrderStatusCancelled:
	default:
		writeError(w, http.StatusBadRequest, "invalid status_kind")
		return
	}
	if err := h.orderService.UpdateStatus(r.Context(), id, kind, req.Status); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "order not found")
			return
		}
		handleServiceError(w, err)
		return
	}
	order, err := h.orderService.GetByID(r.Context(), id)
	if err != nil {
		handleServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, order)
}
