-- Current markdown catalog positions. Safe to run repeatedly.
INSERT INTO markdown_items (id, product_id, qty, price, reason, created_at) VALUES
  ('e08a67a6-08a9-4087-a9ae-6ed5570a765a', '46bd29d5-9bec-49ef-8730-12895edef2a7', 5, 120.00, NULL, '2026-07-06 10:34:29.585023+00'),
  ('ed5dd040-fab9-42bb-8da3-8f78af194bc6', '53a5b219-f2e1-48eb-87f0-e79168e470fd', 6, 120.00, 'fsdfsf', '2026-07-27 10:30:45.864563+00')
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  qty = EXCLUDED.qty,
  price = EXCLUDED.price,
  reason = EXCLUDED.reason,
  created_at = EXCLUDED.created_at;
