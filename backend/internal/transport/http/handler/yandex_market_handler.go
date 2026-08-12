package handler

import (
	"Snabju/backend/internal/domain"
	"encoding/xml"
	"net/http"
	"strings"
	"time"
)

const yandexMarketFeedLimit = 5

// YandexMarketHandler serves a small YML feed for product ads in Yandex Direct.
type YandexMarketHandler struct {
	productService domain.ProductService
	baseURL        string
}

func NewYandexMarketHandler(productService domain.ProductService, baseURL string) *YandexMarketHandler {
	return &YandexMarketHandler{
		productService: productService,
		baseURL:        strings.TrimRight(baseURL, "/"),
	}
}

// Feed serves the five most popular active products as YML.
func (h *YandexMarketHandler) Feed(w http.ResponseWriter, r *http.Request) {
	page, err := h.productService.ListPaged(r.Context(), domain.ProductFilter{
		Limit: yandexMarketFeedLimit,
		Sort:  "popular",
	})
	if err != nil {
		handleServiceError(w, err)
		return
	}

	offers := make([]ymlOffer, 0, len(page.Items))
	categories := make(map[string]string)
	for _, product := range page.Items {
		offer := ymlOffer{
			ID:          product.ID.String(),
			Available:   product.Stock > 0,
			URL:         h.baseURL + "/product/" + product.ID.String(),
			Price:       product.Price,
			CurrencyID:  "RUR",
			Name:        product.Title,
			Description: product.Sub,
		}
		if product.CategoryID != nil && product.CatLabel != "" {
			offer.CategoryID = product.CategoryID.String()
			categories[offer.CategoryID] = product.CatLabel
		}
		if product.ImageURL != "" {
			offer.Picture = product.ImageURL
		}
		offers = append(offers, offer)
	}

	ymlCategories := make([]ymlCategory, 0, len(categories))
	for id, name := range categories {
		ymlCategories = append(ymlCategories, ymlCategory{ID: id, Name: name})
	}

	feed := ymlCatalog{
		Date: time.Now().Format("2006-01-02 15:04"),
		Shop: ymlShop{
			Name:       "Snabju",
			Company:    "Snabju",
			URL:        h.baseURL,
			Currencies: []ymlCurrency{{ID: "RUR", Rate: "1"}},
			Categories: ymlCategories,
			Offers:     offers,
		},
	}

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(xml.Header))
	if err := xml.NewEncoder(w).Encode(feed); err != nil {
		return
	}
}

type ymlCatalog struct {
	XMLName xml.Name `xml:"yml_catalog"`
	Date    string   `xml:"date,attr"`
	Shop    ymlShop  `xml:"shop"`
}

type ymlShop struct {
	Name       string        `xml:"name"`
	Company    string        `xml:"company"`
	URL        string        `xml:"url"`
	Currencies []ymlCurrency `xml:"currencies>currency"`
	Categories []ymlCategory `xml:"categories>category"`
	Offers     []ymlOffer    `xml:"offers>offer"`
}

type ymlCurrency struct {
	ID   string `xml:"id,attr"`
	Rate string `xml:"rate,attr"`
}

type ymlCategory struct {
	ID   string `xml:"id,attr"`
	Name string `xml:",chardata"`
}

type ymlOffer struct {
	ID          string  `xml:"id,attr"`
	Available   bool    `xml:"available,attr"`
	URL         string  `xml:"url"`
	Price       float64 `xml:"price"`
	CurrencyID  string  `xml:"currencyId"`
	CategoryID  string  `xml:"categoryId,omitempty"`
	Picture     string  `xml:"picture,omitempty"`
	Name        string  `xml:"name"`
	Description string  `xml:"description,omitempty"`
}
