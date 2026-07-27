# Production deployment

## DNS

Create an `A` record for `snabju.shop` pointing to the VPS public IPv4 address.
Do this before starting Caddy: it obtains the HTTPS certificate automatically.

## Server setup

Install Docker Engine with the Compose plugin, Git, and allow TCP ports 22, 80,
and 443 in the firewall. Do not expose PostgreSQL, Redis, backend, or frontend
ports directly.

## First deployment

```bash
git clone <repository-url> snabju
cd snabju
cp .env.production.example .env
chmod 600 .env
# Edit .env on the server and set real secrets.
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 backend caddy
```

The `migrate` container applies pending database migrations before the backend
starts. It exits successfully afterwards.

## Initial catalog data

The catalog is intentionally not included in migrations. On a new production
database, load it once after the stack starts:

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U snabju -d snabju -f /dev/stdin < db/seeds/004_products.sql
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U snabju -d snabju -f /dev/stdin < db/seeds/005_markdown_items.sql
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U snabju -d snabju -f /dev/stdin < db/seeds/006_product_images.sql
```

`004_products.sql` replaces the whole catalog, so run it only for the initial
load or when intentionally replacing the catalog.

## First administrator

Register the account normally through the site, then grant it administrator
rights directly in the production database (replace the email):

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U snabju -d snabju -c \
  "UPDATE users SET is_admin = TRUE WHERE email = 'admin@example.com';"
```

## Updates

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Backups

Back up the PostgreSQL and `uploads_data` Docker volumes regularly, preferably
to storage outside the VPS. Verify restoring a backup before relying on it.
