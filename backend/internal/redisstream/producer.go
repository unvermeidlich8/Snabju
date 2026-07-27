package redisstream

import (
	"Snabju/backend/internal/domain"
	"context"
	"encoding/json"
	"fmt"

	"github.com/redis/go-redis/v9"
)

type Producer struct {
	client *redis.Client
}

func NewProducer(client *redis.Client) *Producer {
	return &Producer{client: client}
}

func (p *Producer) Publish(ctx context.Context, topic string, event domain.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("redisstream.Producer.Publish: marshal: %w", err)
	}
	if err := p.client.XAdd(ctx, &redis.XAddArgs{
		Stream: topic,
		Values: map[string]interface{}{"data": string(data)},
	}).Err(); err != nil {
		return fmt.Errorf("redisstream.Producer.Publish: xadd: %w", err)
	}
	return nil
}
