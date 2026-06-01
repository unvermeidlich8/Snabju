-- Seed: additional categories derived from product import
-- Run: docker-compose exec -T db psql -U snabju -d snabju -f /dev/stdin < db/seeds/002_categories.sql

INSERT INTO categories (id, title, swatch, icon, sort_order) VALUES
  ('00000000-0000-0000-0001-000000000006', 'Клеи и ленты',              '#fde68a', 'tape',   6),
  ('00000000-0000-0000-0001-000000000007', 'Лакокрасочные материалы',   '#e9d5ff', 'paint',  7),
  ('00000000-0000-0000-0001-000000000008', 'Сантехника',                '#bfdbfe', 'pipe',   8),
  ('00000000-0000-0000-0001-000000000009', 'Отопление',                 '#fed7aa', 'heat',   9),
  ('00000000-0000-0000-0001-000000000010', 'Расходные материалы',       '#d1fae5', 'box',   10),
  ('00000000-0000-0000-0001-000000000011', 'Химия и очистители',        '#f0abfc', 'spray', 11),
  ('00000000-0000-0000-0001-000000000012', 'Инструменты и оснастка',    '#e2e8f0', 'tool',  12)
ON CONFLICT (id) DO NOTHING;
