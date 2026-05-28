package middleware

import (
	"Snabju/backend/internal/domain"
	"Snabju/backend/internal/transport/http/handler"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

// AdminOnly разрешает запрос только авторизованным пользователям с is_admin=true.
func AdminOnly(userRepo domain.UserRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID, ok := r.Context().Value(handler.ContextKeyUserID).(*uuid.UUID)
			if !ok || userID == nil {
				jsonError(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			user, err := userRepo.GetByID(r.Context(), *userID)
			if err != nil || !user.IsAdmin {
				jsonError(w, http.StatusForbidden, "forbidden")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func jsonError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
