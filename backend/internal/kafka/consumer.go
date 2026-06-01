package kafka

import (
	"Snabju/backend/internal/domain"
	"Snabju/backend/internal/mailer"
	"context"
	"encoding/json"
	"log/slog"

	"github.com/segmentio/kafka-go"
)

type NotificationConsumer struct {
	reader *kafka.Reader
	mailer mailer.Sender
}

func NewNotificationConsumer(brokers []string, m mailer.Sender) *NotificationConsumer {
	return &NotificationConsumer{
		reader: kafka.NewReader(kafka.ReaderConfig{
			Brokers: brokers,
			GroupID: "notifications-consumer",
			Topic:   "notifications",
		}),
		mailer: m,
	}
}

func (c *NotificationConsumer) Run(ctx context.Context) {
	for {
		msg, err := c.reader.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			slog.Error("notification consumer: read error", "err", err)
			continue
		}

		var event domain.Event
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			slog.Error("notification consumer: unmarshal error", "err", err)
			continue
		}

		if err := c.handle(ctx, event); err != nil {
			slog.Error("notification consumer: handle error", "type", event.Type, "err", err)
		}
	}
}

func (c *NotificationConsumer) handle(ctx context.Context, event domain.Event) error {
	switch event.Type {
	case domain.EventUserRegistered:
		var p domain.UserRegisteredPayload
		if err := json.Unmarshal(event.Payload, &p); err != nil {
			return err
		}
		return c.mailer.SendRegistrationEmail(ctx, p)

	case domain.EventOrderConfirmed:
		var p domain.OrderConfirmedPayload
		if err := json.Unmarshal(event.Payload, &p); err != nil {
			return err
		}
		return c.mailer.SendOrderConfirmationEmail(ctx, p)
	}
	return nil
}

func (c *NotificationConsumer) Close() error {
	return c.reader.Close()
}
