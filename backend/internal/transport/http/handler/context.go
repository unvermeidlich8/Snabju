package handler

import (
	"net/http"

	"github.com/google/uuid"
)

type contextKey string

const (
	ContextKeySessionID contextKey = "session_id"
	ContextKeyUserID    contextKey = "user_id"
)

// sessionIDFromRequest читает session_id из контекста (проставляет middleware),
// при отсутствии — из cookie напрямую.
func sessionIDFromRequest(r *http.Request) string {
	if v, ok := r.Context().Value(ContextKeySessionID).(string); ok && v != "" {
		return v
	}
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return ""
	}
	return cookie.Value
}

// userIDFromRequest возвращает userID из контекста (nil для гостя).
func userIDFromRequest(r *http.Request) *uuid.UUID {
	v, ok := r.Context().Value(ContextKeyUserID).(*uuid.UUID)
	if !ok || v == nil {
		return nil
	}
	return v
}
