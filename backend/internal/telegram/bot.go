package telegram

import (
	"Snabju/backend/internal/domain"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Notifier interface {
	SendRegistrationNotification(ctx context.Context, p domain.UserRegisteredPayload) error
	SendOrderNotification(ctx context.Context, p domain.OrderConfirmedPayload) error
	SendOrderStatusNotification(ctx context.Context, p domain.OrderStatusChangedPayload) error
}

type Bot struct {
	token       string
	adminChatID string
	httpClient  *http.Client
}

func New(token, adminChatID string) *Bot {
	return &Bot{
		token:       token,
		adminChatID: adminChatID,
		httpClient:  &http.Client{},
	}
}

func (b *Bot) SendRegistrationNotification(ctx context.Context, p domain.UserRegisteredPayload) error {
	text := fmt.Sprintf("Новый пользователь\nТелефон: %s", p.Phone)
	if p.Name != "" {
		text = fmt.Sprintf("Новый пользователь\nИмя: %s\nТелефон: %s", p.Name, p.Phone)
	}
	if p.Email != nil {
		text += fmt.Sprintf("\nEmail: %s", *p.Email)
	}
	return b.send(ctx, b.adminChatID, text)
}

func (b *Bot) SendOrderNotification(ctx context.Context, p domain.OrderConfirmedPayload) error {
	text := fmt.Sprintf(
		"Новый заказ #%s\nКлиент: %s\nТелефон: %s\nСумма: %.2f руб.\nАдрес: %s",
		p.OrderID, p.ContactName, p.ContactPhone, p.Total, p.Address,
	)
	return b.send(ctx, b.adminChatID, text)
}

func (b *Bot) SendOrderStatusNotification(ctx context.Context, p domain.OrderStatusChangedPayload) error {
	text := fmt.Sprintf(
		"Статус заказа #%s изменён\nКлиент: %s\nТелефон: %s\nНовый статус: %s",
		p.OrderID, p.ContactName, p.ContactPhone, p.NewStatus,
	)
	return b.send(ctx, b.adminChatID, text)
}

func (b *Bot) send(ctx context.Context, chatID, text string) error {
	payload := map[string]any{
		"chat_id": chatID,
		"text":    text,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("telegram: marshal: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", b.token),
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("telegram: new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := b.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("telegram: post: %w", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)

	var result struct {
		OK          bool   `json:"ok"`
		Description string `json:"description"`
	}
	if err := json.Unmarshal(raw, &result); err != nil {
		return fmt.Errorf("telegram: parse response: %w", err)
	}
	if !result.OK {
		return fmt.Errorf("telegram: api error: %s", result.Description)
	}
	return nil
}
