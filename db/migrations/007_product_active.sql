-- +goose Up
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- +goose Down
ALTER TABLE products DROP COLUMN IF EXISTS is_active;
