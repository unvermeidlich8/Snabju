-- +goose Up
ALTER TYPE order_status_kind ADD VALUE IF NOT EXISTS 'cancelled';

-- +goose Down
-- PostgreSQL does not support removing enum values; no-op
