package main

import (
	"context"
	"database/sql"
	"log/slog"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"github.com/pressly/goose/v3"
)

func main() {
	_ = godotenv.Load(".env")

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		slog.Error("DB_URL is not set")
		os.Exit(1)
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		slog.Error("failed to open db", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := goose.SetDialect("postgres"); err != nil {
		slog.Error("set dialect", "err", err)
		os.Exit(1)
	}

	args := os.Args[1:]
	cmd := "up"
	if len(args) > 0 {
		cmd, args = args[0], args[1:]
	}

	if err := goose.RunContext(context.Background(), cmd, db, "db/migrations", args...); err != nil {
		slog.Error("migration failed", "cmd", cmd, "err", err)
		os.Exit(1)
	}
}
