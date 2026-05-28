package handler

import (
	"Snabju/backend/internal/domain"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type ProfileHandler struct {
	userService domain.UserService
}

func NewProfileHandler(userService domain.UserService) *ProfileHandler {
	return &ProfileHandler{userService: userService}
}

type profileResponse struct {
	ID        uuid.UUID `json:"id"`
	Phone     *string   `json:"phone"`
	Email     *string   `json:"email"`
	Name      string    `json:"name"`
	IsB2B     bool      `json:"is_b2b"`
	IsAdmin   bool      `json:"is_admin"`
	Company   string    `json:"company"`
	CreatedAt time.Time `json:"created_at"`
}

func toProfileResponse(u *domain.User) profileResponse {
	return profileResponse{
		ID:        u.ID,
		Phone:     u.Phone,
		Email:     u.Email,
		Name:      u.Name,
		IsB2B:     u.IsB2B,
		IsAdmin:   u.IsAdmin,
		Company:   u.Company,
		CreatedAt: u.CreatedAt,
	}
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromRequest(r)
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := h.userService.GetProfile(r.Context(), *userID)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, toProfileResponse(user))
}

func (h *ProfileHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromRequest(r)
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.userService.UpdateProfile(r.Context(), *userID, req.Name, req.Email); err != nil {
		handleServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}
