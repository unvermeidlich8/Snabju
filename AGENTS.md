# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Go backend and a Next.js frontend.

- `backend/cmd/` — entrypoints (`main.go`, migration runner).
- `backend/internal/domain/` — core models and interfaces.
- `backend/internal/service/` — business logic.
- `backend/internal/repository/postgres/` — PostgreSQL persistence.
- `backend/internal/transport/http/` — HTTP handlers and middleware.
- `backend/internal/redis/` and `backend/internal/redisstream/` — sessions and async notifications.
- `backend/internal/telegram/` and `backend/internal/mailer/` — delivery channels.
- `frontend/app/` — App Router pages.
- `frontend/components/` — UI and feature components.
- `frontend/lib/` and `frontend/providers/` — API client, types, and state providers.
- `db/migrations/`, `db/seeds/` — schema and seed SQL.

## Build, Test, and Development Commands

- `docker compose up` — run full local stack.
- `make up` / `make down` — start or stop containers with volumes cleanup on down.
- `make build` — rebuild Docker images and restart services.
- `go run ./backend/cmd/main.go` — run backend locally against existing infra.
- `cd frontend && npm run dev` — run frontend on localhost:3000.
- `cd frontend && npm run build` — production frontend build.
- `cd frontend && npm run lint` — frontend lint check.
- `make migrate`, `make migrate-status`, `make seed` — manage database schema and seed data.

## Coding Style & Naming Conventions

Use standard Go formatting (`gofmt`) and keep package boundaries aligned with the existing architecture: transport → service → repository. Prefer descriptive `snake_case` filenames in Go (`order_service.go`) and PascalCase component filenames in React (`ProductCardList.tsx`). TypeScript uses camelCase for variables and functions. Keep API mapping logic centralized in `frontend/lib/api.ts`.

## Testing Guidelines

There are currently no committed test suites in the repository. For backend changes, add table-driven Go tests as `*_test.go` next to the package under test and run `go test ./...`. For frontend changes, at minimum run `npm run lint` and document any manual verification for catalog, cart, checkout, or admin flows.

## Commit & Pull Request Guidelines

Recent history uses short, imperative commit messages such as `add frontend` and `admin panel changes`. Prefer concise messages in that style, or clearer scoped variants like `backend: add redis stream consumer`. PRs should include:

- a short summary of behavior changes;
- any migration or env var impact;
- screenshots for frontend/admin UI changes;
- manual verification steps and affected routes or commands.

## Architecture Notes

Do not reintroduce Kafka-based notification assumptions. Current async notifications use Redis Streams for both Telegram and email delivery.
