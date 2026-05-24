package domain

import "errors"

var (
	ErrNotFound           = errors.New("not found")
	ErrAlreadyExists      = errors.New("already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

type ErrValidation struct {
	Field string
	Msg   string
}

func (e ErrValidation) Error() string {
	return e.Field + ": " + e.Msg
}
