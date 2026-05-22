package postgres

import (
	"Snabju/backend/internal/domain"
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresUserRepo struct {
	db *pgxpool.Pool
}

func NewPostgresUserRepo(db *pgxpool.Pool) domain.UserRepository {
	return &postgresUserRepo{db: db}
}

func (p *postgresUserRepo) Create(ctx context.Context, u *domain.User) error {

}

func (p *postgresUserRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {

}

func (p *postgresUserRepo) GetByPhone(ctx context.Context, phone string) (*domain.User, error) {

}

func (p *postgresUserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {

}

func (p *postgresUserRepo) Update(ctx context.Context, u *domain.User) error {

}
