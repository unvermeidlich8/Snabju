-- +goose Up
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_type VARCHAR(32) NOT NULL DEFAULT 'retail';

-- +goose Down
ALTER TABLE orders DROP COLUMN IF EXISTS customer_type;
