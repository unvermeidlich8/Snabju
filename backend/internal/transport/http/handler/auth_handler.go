package handler

import (
	"Snabju/backend/internal/domain"
	"encoding/json"
	"net/http"
)

const sessionCookieName = "session_id"
const sessionCookieMaxAge = 30 * 24 * 60 * 60 // 30 дней

type AuthHandler struct {
	userService domain.UserService
}

func NewAuthHandler(userService domain.UserService) *AuthHandler {
	return &AuthHandler{userService: userService}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Phone    string `json:"phone"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, sessionID, err := h.userService.Register(r.Context(), req.Phone, req.Email, req.Password)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	setSessionCookie(w, sessionID)
	writeJSON(w, http.StatusCreated, map[string]any{
		"user_id":    user.ID,
		"session_id": sessionID,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Phone    string `json:"phone"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	sessionID, err := h.userService.Login(r.Context(), req.Phone, req.Password)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	setSessionCookie(w, sessionID)
	writeJSON(w, http.StatusOK, map[string]string{
		"session_id": sessionID,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	_ = h.userService.Logout(r.Context(), cookie.Value)

	clearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func setSessionCookie(w http.ResponseWriter, sessionID string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    sessionID,
		Path:     "/",
		MaxAge:   sessionCookieMaxAge,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}
