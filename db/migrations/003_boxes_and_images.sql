-- +goose Up
-- +goose StatementBegin
ALTER TABLE products RENAME COLUMN price_pallet TO price_box;
ALTER TABLE products RENAME COLUMN pallet_qty   TO box_qty;
ALTER TABLE products  ADD COLUMN  image_url TEXT;
ALTER TABLE categories ADD COLUMN image_url TEXT;
ALTER TABLE users      ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE products RENAME COLUMN price_box TO price_pallet;
ALTER TABLE products RENAME COLUMN box_qty   TO pallet_qty;
ALTER TABLE products   DROP COLUMN image_url;
ALTER TABLE categories DROP COLUMN image_url;
ALTER TABLE users      DROP COLUMN is_admin;
-- +goose StatementEnd