package mailer

import (
	"Snabju/backend/internal/domain"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type UniSenderMailer struct {
	apiKey    string
	fromName  string
	fromEmail string
}

func NewUniSender(apiKey, _ /* listID */, fromName, fromEmail string) *UniSenderMailer {
	return &UniSenderMailer{
		apiKey:    apiKey,
		fromName:  fromName,
		fromEmail: fromEmail,
	}
}

func (u *UniSenderMailer) send(_ context.Context, to, subject, htmlBody string) error {
	payload := map[string]any{
		"message": map[string]any{
			"recipients":  []map[string]any{{"email": to}},
			"from_email":  u.fromEmail,
			"from_name":   u.fromName,
			"subject":     subject,
			"body":        map[string]string{"html": htmlBody},
			"track_links": 0,
			"track_read":  0,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("unisender: marshal: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost,
		"https://goapi.unisender.ru/ru/transactional/api/v1/email/send.json",
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("unisender: new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", u.apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("unisender: post: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("unisender: read body: %w", err)
	}

	var result struct {
		Status  string `json:"status"`
		Message string `json:"message"`
		Code    int    `json:"code"`
	}
	if err := json.Unmarshal(raw, &result); err != nil {
		return fmt.Errorf("unisender: parse response: %w", err)
	}
	if result.Status == "error" {
		return fmt.Errorf("unisender: api error: %s (code %d)", result.Message, result.Code)
	}
	return nil
}

func (u *UniSenderMailer) SendRegistrationEmail(ctx context.Context, p domain.UserRegisteredPayload) error {
	if p.Email == nil {
		return nil
	}
	greeting := "Здравствуйте"
	if p.Name != "" {
		greeting = "Здравствуйте, " + p.Name
	}
	body := fmt.Sprintf(`
<h2>Добро пожаловать в Snabju!</h2>
<p>%s! Вы успешно зарегистрировались.</p>
<p>Ваш телефон: <strong>%s</strong></p>
<p>Теперь вы можете оформлять заказы и отслеживать историю покупок.</p>
`, greeting, p.Phone)
	return u.send(ctx, *p.Email, "Добро пожаловать в Snabju", body)
}

func (u *UniSenderMailer) SendOrderConfirmationEmail(ctx context.Context, p domain.OrderConfirmedPayload) error {
	if p.Email == nil {
		return nil
	}
	body := fmt.Sprintf(`
<h2>Заказ принят!</h2>
<p>Здравствуйте, <strong>%s</strong>!</p>
<p>Ваш заказ <strong>#%s</strong> на сумму <strong>%.2f ₽</strong> принят в обработку.</p>
<p>Мы свяжемся с вами по номеру %s для уточнения деталей.</p>
`, p.ContactName, p.OrderID, p.Total, p.ContactPhone)
	return u.send(ctx, *p.Email, "Заказ принят — Snabju", body)
}
