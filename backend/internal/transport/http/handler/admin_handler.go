package handler

import (
	"Snabju/backend/internal/domain"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/google/uuid"
)

type AdminHandler struct {
	categoryService domain.CategoryService
	productService  domain.ProductService
}

func NewAdminHandler(categoryService domain.CategoryService, productService domain.ProductService) *AdminHandler {
	return &AdminHandler{categoryService: categoryService, productService: productService}
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
