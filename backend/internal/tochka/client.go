package tochka

import (
	"Snabju/backend/internal/domain"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Config struct {
	JWT           string
	CustomerCode  string
	MerchantID    string
	TaxSystemCode string
	VATType       string
	PublicBaseURL string
	PaymentTTL    int
}

type Client struct {
	cfg        Config
	httpClient *http.Client
}

func NewClient(cfg Config) *Client {
	if cfg.CustomerCode == "" {
		var claims struct {
			CustomerCode string `json:"customer_code"`
		}
		parts := strings.Split(cfg.JWT, ".")
		if len(parts) == 3 {
			if payload, err := base64.RawURLEncoding.DecodeString(parts[1]); err == nil {
				_ = json.Unmarshal(payload, &claims)
				cfg.CustomerCode = claims.CustomerCode
			}
		}
	}
	if cfg.PaymentTTL == 0 {
		cfg.PaymentTTL = 1440
	}
	return &Client{cfg: cfg, httpClient: &http.Client{Timeout: 15 * time.Second}}
}

func (c *Client) Enabled() bool {
	return c.cfg.JWT != "" && c.cfg.CustomerCode != "" && c.cfg.TaxSystemCode != "" && c.cfg.VATType != "" && c.cfg.PublicBaseURL != ""
}

func (c *Client) CustomerCode() string { return c.cfg.CustomerCode }

type paymentRequest struct {
	Data paymentData `json:"Data"`
}

type paymentData struct {
	CustomerCode    string        `json:"customerCode"`
	Amount          float64       `json:"amount"`
	Purpose         string        `json:"purpose"`
	RedirectURL     string        `json:"redirectUrl"`
	FailRedirectURL string        `json:"failRedirectUrl"`
	PaymentMode     []string      `json:"paymentMode"`
	MerchantID      string        `json:"merchantId,omitempty"`
	TTL             int           `json:"ttl"`
	PaymentLinkID   string        `json:"paymentLinkId"`
	TaxSystemCode   string        `json:"taxSystemCode"`
	Client          paymentClient `json:"Client"`
	Items           []paymentItem `json:"Items"`
}

type paymentClient struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone,omitempty"`
}

type paymentItem struct {
	VATType       string  `json:"vatType"`
	Name          string  `json:"name"`
	Amount        float64 `json:"amount"`
	Quantity      int     `json:"quantity"`
	PaymentMethod string  `json:"paymentMethod"`
	PaymentObject string  `json:"paymentObject"`
	Measure       string  `json:"measure"`
}

type paymentResponse struct {
	Data struct {
		OperationID string `json:"operationId"`
		PaymentLink string `json:"paymentLink"`
	} `json:"Data"`
}

func (c *Client) CreateSBPPayment(ctx context.Context, order *domain.Order) (operationID, paymentLink string, err error) {
	if !c.Enabled() {
		return "", "", fmt.Errorf("интеграция оплаты Точки не настроена")
	}
	items := make([]paymentItem, 0, len(order.Items))
	for _, item := range order.Items {
		items = append(items, paymentItem{
			VATType: c.cfg.VATType, Name: item.Title, Amount: item.Price, Quantity: item.Qty,
			PaymentMethod: "full_payment", PaymentObject: "goods", Measure: tochkaMeasure(item.Unit),
		})
	}
	baseURL := strings.TrimRight(c.cfg.PublicBaseURL, "/")
	payload := paymentRequest{Data: paymentData{
		CustomerCode: c.cfg.CustomerCode, Amount: order.Total, Purpose: "Заказ Snabju " + order.ID.String(),
		RedirectURL: baseURL + "/account?orderPlaced=1", FailRedirectURL: baseURL + "/cart?payment=failed",
		PaymentMode: []string{"sbp"}, MerchantID: c.cfg.MerchantID, TTL: c.cfg.PaymentTTL,
		PaymentLinkID: order.ID.String(), TaxSystemCode: c.cfg.TaxSystemCode,
		Client: paymentClient{Name: order.ContactName, Email: order.GuestEmail, Phone: order.ContactPhone}, Items: items,
	}}
	body, err := json.Marshal(payload)
	if err != nil {
		return "", "", fmt.Errorf("marshal payment request: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://enter.tochka.com/uapi/acquiring/v1.0/payments_with_receipt", bytes.NewReader(body))
	if err != nil {
		return "", "", fmt.Errorf("create payment request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.cfg.JWT)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("request payment link: %w", err)
	}
	defer resp.Body.Close()
	responseBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", "", fmt.Errorf("read payment response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", "", fmt.Errorf("Точка вернула статус %d: %s", resp.StatusCode, responseErrorMessage(responseBody))
	}
	var result paymentResponse
	if err := json.Unmarshal(responseBody, &result); err != nil {
		return "", "", fmt.Errorf("parse payment response: %w", err)
	}
	if result.Data.OperationID == "" || result.Data.PaymentLink == "" {
		return "", "", fmt.Errorf("Точка не вернула ссылку на оплату")
	}
	return result.Data.OperationID, result.Data.PaymentLink, nil
}

func responseErrorMessage(body []byte) string {
	const maxLength = 1000
	message := strings.Join(strings.Fields(string(body)), " ")
	if message == "" {
		return "ответ без текста"
	}
	if len(message) > maxLength {
		return message[:maxLength] + "…"
	}
	return message
}

func tochkaMeasure(unit string) string {
	switch strings.ToLower(strings.TrimSpace(unit)) {
	case "г", "г.":
		return "г."
	case "кг", "кг.":
		return "кг."
	case "т", "т.":
		return "т."
	case "л", "л.":
		return "л."
	case "м", "м.":
		return "м."
	case "м2", "м2.":
		return "м2."
	case "м3", "м3.":
		return "м3"
	default:
		return "шт."
	}
}
