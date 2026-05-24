package middleware

import (
	"Snabju/backend/internal/domain"
	"Snabju/backend/internal/transport/http/handler"
	"context"
	"net/http"

	"github.com/google/uuid"
)

const sessionCookieName = "session_id"
const sessionCookieMaxAge = 30 * 24 * 60 * 60 // 30 дней

// Session резолвит session_id из cookie и userID из Redis.
// Если cookie нет — генерирует гостевой session_id и устанавливает cookie.
func Session(store domain.SessionStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			sessionID := ""

			cookie, err := r.Cookie(sessionCookieName)
			if err != nil {
				// новый гость — генерируем sessionID и сразу ставим cookie
				sessionID = uuid.New().String()
				http.SetCookie(w, &http.Cookie{
					Name:     sessionCookieName,
					Value:    sessionID,
					Path:     "/",
					MaxAge:   sessionCookieMaxAge,
					HttpOnly: true,
					SameSite: http.SameSiteLaxMode,
				})
			} else {
				sessionID = cookie.Value
			}

			ctx := context.WithValue(r.Context(), handler.ContextKeySessionID, sessionID)

			userID, err := store.GetUserID(ctx, sessionID)
			if err == nil && userID != nil {
				ctx = context.WithValue(ctx, handler.ContextKeyUserID, userID)
			}

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
