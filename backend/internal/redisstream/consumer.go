package redisstream

import (
	"Snabju/backend/internal/domain"
	"Snabju/backend/internal/mailer"
	push "Snabju/backend/internal/push"
	"Snabju/backend/internal/telegram"
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	stream        = "notifications"
	groupName     = "notifications-consumer"
	consumerName  = "worker-1"
	blockDuration = 5 * time.Second
)

type NotificationConsumer struct {
	client     *redis.Client
	mailer     mailer.Sender
	telegram   telegram.Notifier
	adminEmail string
	push       *push.Sender
}

func NewNotificationConsumer(client *redis.Client, m mailer.Sender, tg telegram.Notifier, adminEmail string, p *push.Sender) *NotificationConsumer {
	return &NotificationConsumer{client: client, mailer: m, telegram: tg, adminEmail: adminEmail, push: p}
}

func (c *NotificationConsumer) Run(ctx context.Context) {
	// Create consumer group if it doesn't exist; MKSTREAM creates the stream too.
	err := c.client.XGroupCreateMkStream(ctx, stream, groupName, "$").Err()
	if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
		slog.Error("notification consumer: create group", "err", err)
	}

	// Process any messages that were pending before restart.
	c.processPending(ctx)

	for {
		if ctx.Err() != nil {
			return
		}

		streams, err := c.client.XReadGroup(ctx, &redis.XReadGroupArgs{
			Group:    groupName,
			Consumer: consumerName,
			Streams:  []string{stream, ">"},
			Count:    10,
			Block:    blockDuration,
		}).Result()

		if err != nil {
			if err == redis.Nil || ctx.Err() != nil {
				continue
			}
			slog.Error("notification consumer: xreadgroup", "err", err)
			time.Sleep(time.Second)
			continue
		}

		for _, s := range streams {
			for _, msg := range s.Messages {
				c.processMessage(ctx, msg)
			}
		}
	}
}

func (c *NotificationConsumer) processPending(ctx context.Context) {
	streams, err := c.client.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    groupName,
		Consumer: consumerName,
		Streams:  []string{stream, "0"},
		Count:    100,
	}).Result()
	if err != nil && err != redis.Nil {
		slog.Error("notification consumer: read pending", "err", err)
		return
	}
	for _, s := range streams {
		for _, msg := range s.Messages {
			c.processMessage(ctx, msg)
		}
	}
}

func (c *NotificationConsumer) processMessage(ctx context.Context, msg redis.XMessage) {
	raw, ok := msg.Values["data"].(string)
	if !ok {
		slog.Error("notification consumer: missing data field", "id", msg.ID)
		c.ack(ctx, msg.ID)
		return
	}

	var event domain.Event
	if err := json.Unmarshal([]byte(raw), &event); err != nil {
		slog.Error("notification consumer: unmarshal", "id", msg.ID, "err", err)
		c.ack(ctx, msg.ID)
		return
	}

	if err := c.handle(ctx, event); err != nil {
		slog.Error("notification consumer: handle", "type", event.Type, "id", msg.ID, "err", err)
		// Don't ack — message stays pending for retry.
		return
	}

	c.ack(ctx, msg.ID)
}

func (c *NotificationConsumer) ack(ctx context.Context, id string) {
	if err := c.client.XAck(ctx, stream, groupName, id).Err(); err != nil {
		slog.Error("notification consumer: xack", "id", id, "err", err)
	}
}

func (c *NotificationConsumer) handle(ctx context.Context, event domain.Event) error {
	switch event.Type {
	case domain.EventUserRegistered:
		var p domain.UserRegisteredPayload
		if err := json.Unmarshal(event.Payload, &p); err != nil {
			return err
		}
		if err := c.mailer.SendRegistrationEmail(ctx, p); err != nil {
			slog.Error("notification consumer: send registration email", "err", err)
		}
		if c.adminEmail != "" {
			_ = c.mailer.SendAdminRegistrationEmail(ctx, c.adminEmail, p)
		}
		if c.push != nil {
			if err := c.push.Send(ctx, "Новая регистрация", "Зарегистрировался: "+p.Name); err != nil {
				slog.Error("notification consumer: push registration", "err", err)
			}
		}
		if c.telegram != nil {
			if err := c.telegram.SendRegistrationNotification(ctx, p); err != nil {
				slog.Error("notification consumer: send registration telegram", "err", err)
			}
		}

	case domain.EventOrderConfirmed:
		var p domain.OrderConfirmedPayload
		if err := json.Unmarshal(event.Payload, &p); err != nil {
			return err
		}
		if err := c.mailer.SendOrderConfirmationEmail(ctx, p); err != nil {
			slog.Error("notification consumer: send order email", "err", err)
		}
		if c.adminEmail != "" {
			_ = c.mailer.SendAdminOrderEmail(ctx, c.adminEmail, p)
		}
		if c.push != nil {
			if err := c.push.Send(ctx, "Новый заказ", p.ContactName+" · заказ принят в обработку"); err != nil {
				slog.Error("notification consumer: push order", "err", err)
			}
		}
		if c.telegram != nil {
			if err := c.telegram.SendOrderNotification(ctx, p); err != nil {
				slog.Error("notification consumer: send order telegram", "err", err)
			}
		}

	case domain.EventOrderStatusChanged:
		var p domain.OrderStatusChangedPayload
		if err := json.Unmarshal(event.Payload, &p); err != nil {
			return err
		}
		if c.telegram != nil {
			if err := c.telegram.SendOrderStatusNotification(ctx, p); err != nil {
				slog.Error("notification consumer: send order status telegram", "err", err)
			}
		}
	}
	return nil
}
