package kafka

import (
	"Snabju/backend/internal/domain"
	"context"
	"encoding/json"
	"fmt"

	"github.com/segmentio/kafka-go"
)

type Producer struct {
	writer *kafka.Writer
}

func NewProducer(brokers []string) *Producer {
	return &Producer{
		writer: &kafka.Writer{
			Addr:     kafka.TCP(brokers...),
			Balancer: &kafka.LeastBytes{},
		},
	}
}

func (p *Producer) Publish(ctx context.Context, topic string, event domain.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("kafka.Producer.Publish: marshal: %w", err)
	}
	if err := p.writer.WriteMessages(ctx, kafka.Message{
		Topic: topic,
		Value: data,
	}); err != nil {
		return fmt.Errorf("kafka.Producer.Publish: write: %w", err)
	}
	return nil
}

func (p *Producer) Close() error {
	return p.writer.Close()
}
