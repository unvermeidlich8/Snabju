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

## Updates

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Backups

Back up the PostgreSQL and `uploads_data` Docker volumes regularly, preferably
to storage outside the VPS. Verify restoring a backup before relying on it.
