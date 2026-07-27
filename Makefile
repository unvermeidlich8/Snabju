DB_URL ?= postgres://snabju:snabju@localhost:5432/snabju?sslmode=disable
MIGRATIONS_DIR = db/migrations

.PHONY: up down restart logs logs-backend logs-frontend build ps \
        migrate migrate-down migrate-status migrate-reset seed

# ── Docker ────────────────────────────────────────────────────────────────────

## Start all services in background
up:
	docker compose up -d

## Stop all services and remove volumes
down:
	docker compose down -v

## Restart a specific service: make restart s=backend
restart:
	docker compose restart $(s)

## Rebuild images and restart (use after code changes outside of air)
build:
	docker compose up -d --build

## Show running containers
ps:
	docker compose ps

## Tail logs for all services
logs:
	docker compose logs -f

## Tail backend logs only
logs-b:
	docker compose logs -f backend

## Tail frontend logs only
logs-f:
	docker compose logs -f frontend

# Apply all pending migrations
migrate:
	go run github.com/pressly/goose/v3/cmd/goose@latest -dir $(MIGRATIONS_DIR) postgres "$(DB_URL)" up

# Roll back the last migration
migrate-down:
	go run github.com/pressly/goose/v3/cmd/goose@latest -dir $(MIGRATIONS_DIR) postgres "$(DB_URL)" down

# Show current migration status
migrate-status:
	go run github.com/pressly/goose/v3/cmd/goose@latest -dir $(MIGRATIONS_DIR) postgres "$(DB_URL)" status

# Roll back all migrations
migrate-reset:
	go run github.com/pressly/goose/v3/cmd/goose@latest -dir $(MIGRATIONS_DIR) postgres "$(DB_URL)" reset

# Apply seed data
seed:
	for f in db/seeds/*.sql; do \
		echo "Seeding $$f..."; \
		psql "$(DB_URL)" -f $$f; \
	done
