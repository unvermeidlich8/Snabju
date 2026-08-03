package handler

import (
	"Snabju/backend/internal/domain"
	"errors"
	"math"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CatalogHandler struct {
	categoryService domain.CategoryService
	productService  domain.ProductService
	settingsRepo    domain.SettingsRepository
}

func NewCatalogHandler(categoryService domain.CategoryService, productService domain.ProductService, settingsRepo domain.SettingsRepository) *CatalogHandler {
	return &CatalogHandler{
		categoryService: categoryService,
		productService:  productService,
		settingsRepo:    settingsRepo,
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

func (h *CatalogHandler) Brands(w http.ResponseWriter, r *http.Request) {
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
	if v := r.URL.Query().Get("q"); v != "" {
		f.Search = v
	}
	if brands := r.URL.Query()["brand"]; len(brands) > 0 {
		f.Brands = brands
	}

	page, err := h.productService.ListPaged(r.Context(), f)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	if page.Items == nil {
		page.Items = []domain.Product{}
	}
	if err := h.applyB2BPrices(r, page.Items); err != nil {
		handleServiceError(w, err)
		return
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
	if !product.IsActive {
		writeError(w, http.StatusNotFound, "product not found")
		return
	}
	discount, err := h.settingsRepo.GetB2BDiscountPercent(r.Context())
	if err != nil {
		handleServiceError(w, err)
		return
	}
	product.Price = discountPrice(product.Price, discount)
	if product.PriceBox != nil {
		value := discountPrice(*product.PriceBox, discount)
		product.PriceBox = &value
	}
	product.B2BDiscountPercent = discount

	writeJSON(w, http.StatusOK, product)
}

func (h *CatalogHandler) applyB2BPrices(r *http.Request, products []domain.Product) error {
	discount, err := h.settingsRepo.GetB2BDiscountPercent(r.Context())
	if err != nil {
		return err
	}
	for i := range products {
		products[i].Price = discountPrice(products[i].Price, discount)
		if products[i].PriceBox != nil {
			value := discountPrice(*products[i].PriceBox, discount)
			products[i].PriceBox = &value
		}
		products[i].B2BDiscountPercent = discount
	}
	return nil
}

func discountPrice(price, percent float64) float64 { return math.Round(price*(100-percent)) / 100 }
