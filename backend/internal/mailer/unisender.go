package mailer

import (
	"Snabju/backend/internal/domain"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

type UniSenderMailer struct {
	apiKey    string
	listID    string
	fromName  string
	fromEmail string
}

func NewUniSender(apiKey, listID, fromName, fromEmail string) *UniSenderMailer {
	return &UniSenderMailer{
		apiKey:    apiKey,
		listID:    listID,
		fromName:  fromName,
		fromEmail: fromEmail,
	}
}

func (u *UniSenderMailer) send(_ context.Context, to, subject, body string) error {
	data := url.Values{
		"format":       {"json"},
		"api_key":      {u.apiKey},
		"email":        {to},
		"sender_name":  {u.fromName},
		"sender_email": {u.fromEmail},
		"subject":      {subject},
		"body":         {body},
		"list_id":      {u.listID},
	}

	resp, err := http.PostForm("https://api.unisender.com/ru/api/sendEmail", data)
	if err != nil {
		return fmt.Errorf("unisender: post: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("unisender: read body: %w", err)
	}

	var result struct {
		Error string `json:"error"`
		Code  string `json:"code"`
	}
	if err := json.Unmarshal(raw, &result); err != nil {
		return fmt.Errorf("unisender: parse response: %w", err)
	}
	if result.Error != "" {
		return fmt.Errorf("unisender: api error: %s (%s)", result.Error, result.Code)
	}
	return nil
}

func (u *UniSenderMailer) SendRegistrationEmail(ctx context.Context, p domain.UserRegisteredPayload) error {
	if p.Email == nil {
		return nil
	}
	body := fmt.Sprintf(`
<h2>Добро пожаловать в Snabju!</h2>
<p>Вы успешно зарегистрировались.</p>
<p>Ваш телефон: <strong>%s</strong></p>
<p>Теперь вы можете оформлять заказы и отслеживать историю покупок.</p>
`, p.Phone)
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
<p>Адрес доставки: %s</p>
`, p.ContactName, p.OrderID, p.Total, p.ContactPhone, p.Address)
	return u.send(ctx, *p.Email, "Заказ принят — Snabju", body)
}
