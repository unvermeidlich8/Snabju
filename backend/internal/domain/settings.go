package domain

import "context"

type SettingsRepository interface {
	GetB2BDiscountPercent(ctx context.Context) (float64, error)
	SetB2BDiscountPercent(ctx context.Context, percent float64) error
}
