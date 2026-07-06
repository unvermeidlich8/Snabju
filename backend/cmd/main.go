package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"Snabju/backend/internal/crypto"
	appkafka "Snabju/backend/internal/kafka"
	"Snabju/backend/internal/mailer"
	appredis "Snabju/backend/internal/redis"
	"Snabju/backend/internal/repository/postgres"
	"Snabju/backend/internal/service"
	server "Snabju/backend/internal/transport/http"
	"Snabju/backend/internal/transport/http/handler"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

func main() {
	if err := godotenv.Load(); err != nil {
		slog.Warn("no .env file, reading from environment")
	}

	cfg := loadConfig()

	// --- PostgreSQL ---
	pool, err := pgxpool.New(context.Background(), cfg.dbURL)
	if err != nil {
		slog.Error("failed to create pg pool", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		slog.Error("failed to ping postgres", "err", err)
		os.Exit(1)
	}
	slog.Info("connected to PostgreSQL")

	// --- Redis ---
	redisClient := redis.NewClient(&redis.Options{Addr: cfg.redisAddr})
	if err := redisClient.Ping(context.Background()).Err(); err != nil {
		slog.Error("failed to ping redis", "err", err)
		os.Exit(1)
	}
	defer redisClient.Close()
	slog.Info("connected to Redis")

	// --- Repositories ---
	userRepo := postgres.NewPostgresUserRepo(pool)
	categoryRepo := postgres.NewPostgresCategoryRepo(pool)
	productRepo := postgres.NewPostgresProductRepo(pool)
	cartRepo := postgres.NewPostgresCartRepo(pool)
	orderRepo := postgres.NewPostgresOrderRepo(pool)
	markdownRepo := postgres.NewPostgresMarkdownRepo(pool)

	// --- Infrastructure ---
	hasher := crypto.BcryptHasher{}
	sessionStore := appredis.NewSessionStore(redisClient, cfg.sessionTTL)
	producer := appkafka.NewProducer(cfg.kafkaBrokers)
	defer producer.Close()

	var m mailer.Sender
	if cfg.unisenderAPIKey != "" {
		m = mailer.NewUniSender(cfg.unisenderAPIKey, cfg.unisenderListID, cfg.unisenderFromName, cfg.smtpFrom)
		slog.Info("email provider: UniSender")
	} else {
		m = mailer.New(cfg.smtpHost, cfg.smtpPort, cfg.smtpUser, cfg.smtpPass, cfg.smtpFrom, cfg.smtpTLS)
		slog.Info("email provider: SMTP")
	}

	// --- Services ---
	userSvc := service.NewUserService(userRepo, cartRepo, hasher, sessionStore, producer)
	categorySvc := service.NewCategoryService(categoryRepo)
	productSvc := service.NewProductService(productRepo)
	cartSvc := service.NewCartService(cartRepo, markdownRepo)
	orderSvc := service.NewOrderService(orderRepo, userRepo, producer)
	markdownSvc := service.NewMarkdownService(markdownRepo)

	// --- Kafka consumers ---
	notificationConsumer := appkafka.NewNotificationConsumer(cfg.kafkaBrokers, m)
	go notificationConsumer.Run(context.Background())
	defer notificationConsumer.Close()

	// --- Handlers ---
	authHandler := handler.NewAuthHandler(userSvc)
	catalogHandler := handler.NewCatalogHandler(categorySvc, productSvc)
	cartHandler := handler.NewCartHandler(cartSvc)
	orderHandler := handler.NewOrderHandler(orderSvc)
	profileHandler := handler.NewProfileHandler(userSvc)
	adminHandler := handler.NewAdminHandler(categorySvc, productSvc, orderSvc)
	uploadHandler := handler.NewUploadHandler(cfg.uploadsDir, cfg.publicBaseURL)
	markdownHandler := handler.NewMarkdownHandler(markdownSvc)

	// --- Router ---
	router := server.NewRouter(
		authHandler,
		catalogHandler,
		cartHandler,
		orderHandler,
		profileHandler,
		adminHandler,
		uploadHandler,
		markdownHandler,
		sessionStore,
		userRepo,
		cfg.uploadsDir,
		cfg.allowedOrigins,
	)

	// --- HTTP Server ---
	srv := &http.Server{
		Addr:         ":" + cfg.serverPort,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 35 * time.Second, // чуть больше Timeout middleware (30s)
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("server started", "port", cfg.serverPort)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("graceful shutdown failed", "err", err)
	}
	slog.Info("server stopped")
}

type config struct {
	serverPort        string
	dbURL             string
	redisAddr         string
	sessionTTL        time.Duration
	allowedOrigins    []string
	kafkaBrokers      []string
	smtpHost          string
	smtpPort          int
	smtpUser          string
	smtpPass          string
	smtpFrom          string
	smtpTLS           mailer.TLSPolicy
	unisenderAPIKey   string
	unisenderListID   string
	unisenderFromName string
	uploadsDir        string
	publicBaseURL     string
}

func loadConfig() config {
	cfg := config{
		serverPort:        getEnv("SERVER_PORT", "8080"),
		dbURL:             requireEnv("DB_URL"),
		redisAddr:         getEnv("REDIS_URL", "localhost:6379"),
		allowedOrigins:    strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:3000"), ","),
		kafkaBrokers:      strings.Split(getEnv("KAFKA_BROKERS", "localhost:9092"), ","),
		smtpHost:          getEnv("SMTP_HOST", "localhost"),
		smtpUser:          getEnv("SMTP_USER", ""),
		smtpPass:          getEnv("SMTP_PASS", ""),
		smtpFrom:          getEnv("SMTP_FROM", "noreply@snabju.ru"),
		smtpTLS:           mailer.ParseTLSPolicy(getEnv("SMTP_TLS", "none")),
		unisenderAPIKey:   getEnv("UNISENDER_API_KEY", ""),
		unisenderListID:   getEnv("UNISENDER_LIST_ID", ""),
		unisenderFromName: getEnv("UNISENDER_FROM_NAME", "Snabju"),
		uploadsDir:        getEnv("UPLOADS_DIR", "./uploads"),
		publicBaseURL:     getEnv("PUBLIC_BASE_URL", "http://localhost:8080"),
	}

	ttlHours := getEnv("SESSION_TTL_HOURS", "720")
	if h, err := strconv.Atoi(ttlHours); err == nil {
		cfg.sessionTTL = time.Duration(h) * time.Hour
	} else {
		cfg.sessionTTL = 720 * time.Hour
	}

	smtpPort := getEnv("SMTP_PORT", "1025")
	if p, err := strconv.Atoi(smtpPort); err == nil {
		cfg.smtpPort = p
	} else {
		cfg.smtpPort = 1025
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func requireEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		slog.Error("required env var not set", "key", key)
		os.Exit(1)
	}
	return v
}
