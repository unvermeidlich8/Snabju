-- +goose Up

-- Пользователи
CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    phone         VARCHAR(20)  UNIQUE,
    email         VARCHAR(255) UNIQUE,
    name          VARCHAR(255),
    password_hash TEXT,
    is_b2b        BOOLEAN      NOT NULL DEFAULT FALSE,
    company       VARCHAR(255),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Контактные данные и сессия для гостевых заказов
ALTER TABLE orders ADD COLUMN session_id    VARCHAR(255);
ALTER TABLE orders ADD COLUMN contact_name  VARCHAR(255);
ALTER TABLE orders ADD COLUMN contact_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN address       TEXT;

-- Привязка user_id к users
ALTER TABLE orders
    ADD CONSTRAINT orders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE cart_items
    ADD CONSTRAINT cart_items_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Индексы для быстрого поиска корзины и заказов по сессии
CREATE INDEX idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX idx_cart_items_user_id    ON cart_items(user_id);
CREATE INDEX idx_orders_session_id     ON orders(session_id);
CREATE INDEX idx_orders_user_id        ON orders(user_id);

-- +goose Down
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_session_id;
DROP INDEX IF EXISTS idx_cart_items_user_id;
DROP INDEX IF EXISTS idx_cart_items_session_id;

ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;
ALTER TABLE orders     DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE orders DROP COLUMN IF EXISTS address;
ALTER TABLE orders DROP COLUMN IF EXISTS contact_phone;
ALTER TABLE orders DROP COLUMN IF EXISTS contact_name;
ALTER TABLE orders DROP COLUMN IF EXISTS session_id;

DROP TABLE IF EXISTS users;