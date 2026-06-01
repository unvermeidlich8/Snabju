package handler

import (
	"Snabju/backend/internal/domain"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func handleServiceError(w http.ResponseWriter, err error) {
	var valErr domain.ErrValidation
	switch {
	case errors.As(err, &valErr):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrInvalidCredentials):
		writeError(w, http.StatusUnauthorized, "invalid credentials")
	case errors.Is(err, domain.ErrNotFound):
		writeError(w, http.StatusNotFound, "not found")
	case errors.Is(err, domain.ErrPhoneExists), errors.Is(err, domain.ErrEmailExists),
		errors.Is(err, domain.ErrAlreadyExists), errors.Is(err, domain.ErrSKUExists),
		errors.Is(err, domain.ErrHasProducts):
		writeError(w, http.StatusConflict, err.Error())
	default:
		slog.Error("unhandled service error", "err", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
	}
}
