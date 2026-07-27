-- +goose Up
CREATE TABLE markdown_items (
    id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty        INT            NOT NULL CHECK (qty >= 0),
    price      NUMERIC(12,2)  NOT NULL CHECK (price > 0),
    reason     TEXT,
    created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

ALTER TABLE cart_items ADD COLUMN markdown_item_id UUID REFERENCES markdown_items(id) ON DELETE SET NULL;

-- +goose Down
ALTER TABLE cart_items DROP COLUMN markdown_item_id;
DROP TABLE markdown_items;
