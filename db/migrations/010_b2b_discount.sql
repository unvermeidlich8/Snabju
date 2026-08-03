-- +goose Up
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    numeric_value NUMERIC(5,2) NOT NULL
);
INSERT INTO app_settings(key, numeric_value) VALUES ('b2b_discount_percent', 15)
ON CONFLICT (key) DO NOTHING;

-- +goose Down
DROP TABLE IF EXISTS app_settings;
