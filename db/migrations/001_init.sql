-- +goose Up
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Категории товаров
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    swatch      VARCHAR(50)  NOT NULL,
    icon        VARCHAR(100) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0
);

-- Товары
CREATE TABLE products (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    sku          VARCHAR(100) NOT NULL UNIQUE,
    title        VARCHAR(500) NOT NULL,
    sub          TEXT,
    category_id  UUID         REFERENCES categories(id),
    cat_label    VARCHAR(255),
    unit         VARCHAR(50),
    unit_detail  VARCHAR(100),
    price        NUMERIC(12,2) NOT NULL,
    old_price    NUMERIC(12,2),
    price_pallet NUMERIC(12,2),
    pallet_qty   INT          NOT NULL DEFAULT 0,
    stock        INT          NOT NULL DEFAULT 0,
    stock_unit   VARCHAR(50),
    eta          VARCHAR(100),
    rating       NUMERIC(3,2) NOT NULL DEFAULT 0,
    reviews      INT          NOT NULL DEFAULT 0,
    tag          VARCHAR(100),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Характеристики товара (массив пар key/value)
CREATE TABLE product_specs (
    id         SERIAL PRIMARY KEY,
    product_id UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    key        VARCHAR(255) NOT NULL,
    value      TEXT         NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0
);

-- Промо-баннеры
CREATE TABLE promos (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title      VARCHAR(500) NOT NULL,
    sub        TEXT,
    accent     BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order INT          NOT NULL DEFAULT 0
);

-- Статус заказа
CREATE TYPE order_status_kind AS ENUM ('pending', 'progress', 'done');

-- Заказы
CREATE TABLE orders (
    id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    status      VARCHAR(100)       NOT NULL DEFAULT 'Новый',
    status_kind order_status_kind  NOT NULL DEFAULT 'pending',
    items_count INT                NOT NULL DEFAULT 0,
    total       NUMERIC(12,2)      NOT NULL DEFAULT 0,
    eta         VARCHAR(100),
    created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- Корзина (session_id до авторизации, user_id после)
CREATE TABLE cart_items (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255),
    user_id    UUID,
    product_id UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty        INT          NOT NULL DEFAULT 1,
    as_pallet  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS orders;
DROP TYPE IF EXISTS order_status_kind;
DROP TABLE IF EXISTS promos;
DROP TABLE IF EXISTS product_specs;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP EXTENSION IF EXISTS "pgcrypto";