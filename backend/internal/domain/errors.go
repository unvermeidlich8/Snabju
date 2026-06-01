package domain

import "errors"

var (
	ErrNotFound           = errors.New("not found")
	ErrAlreadyExists      = errors.New("already exists")
	ErrSKUExists          = errors.New("товар с таким артикулом уже существует")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrHasProducts        = errors.New("категория содержит товары")
)

type ErrValidation struct {
	Field string
	Msg   string
}

func (e ErrValidation) Error() string {
	return e.Field + ": " + e.Msg
}
