-- +goose Up
CREATE TABLE order_items (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID          NOT NULL REFERENCES products(id),
    title      VARCHAR(500)  NOT NULL,
    sku        VARCHAR(100)  NOT NULL,
    unit       VARCHAR(50)   NOT NULL DEFAULT '',
    price      NUMERIC(12,2) NOT NULL,
    qty        INT           NOT NULL,
    total      NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- +goose Down
DROP TABLE IF EXISTS order_items;
