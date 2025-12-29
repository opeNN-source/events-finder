package controller

import (
	"auth_service/internal/models"
	"auth_service/internal/services/auth"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
)

type AuthController struct {
	Logger      *slog.Logger
	AuthService *auth.Auth
}

func NewController(service *auth.Auth, logger *slog.Logger) *AuthController {
	return &AuthController{AuthService: service, Logger: logger}
}

func (c *AuthController) LoginHandler(w http.ResponseWriter, r *http.Request) {
	var user models.NewUserReq

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	c.Logger.Debug("pass", slog.String("pass", user.Password))

	if user.Email == "" {
		http.Error(w, "invalid email", http.StatusBadRequest)
		return
	}
	if user.Password == "" {
		http.Error(w, "invalid password", http.StatusBadRequest)
		return
	}

	NewUser := models.NewUser{Email: user.Email, HashPass: []byte(user.Password)}
	tokens, err := c.AuthService.Login(r.Context(), NewUser)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(tokens); err != nil {
		c.Logger.Debug("Не удалось отправить токены")
		return
	}
	c.Logger.Info("Успешный логин пользователя", slog.String("email", user.Email))
}

func (c *AuthController) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var user models.NewUserReq

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if user.Email == "" {
		http.Error(w, "invalid email", http.StatusBadRequest)
		return
	}
	if user.Password == "" {
		http.Error(w, "invalid password", http.StatusBadRequest)
		return
	}
	NewUser := models.NewUser{Email: user.Email, HashPass: []byte(user.Password)}

	if err := c.AuthService.Register(r.Context(), NewUser); err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			http.Error(w, "user already exists", http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	c.Logger.Info("Создан пользователь", slog.String("email", user.Email))
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (c *AuthController) RefreshHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var token models.RefreshToken
	if err := json.NewDecoder(r.Body).Decode(&token); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if token.Token == "" {
		http.Error(w, "invalid token", http.StatusBadRequest)
		return
	}

	tok, err := c.AuthService.Refresh(r.Context(), token.Token)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	if err := json.NewEncoder(w).Encode(tok); err != nil {
		c.Logger.Error("Не удалось отправить токены", slog.Any("error", err))
	}
}

func (c *AuthController) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var token models.RefreshToken

	if err := json.NewDecoder(r.Body).Decode(&token); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if token.Token == "" {
		http.Error(w, "invalid token", http.StatusBadRequest)
		return
	}
	if err := c.AuthService.Logout(r.Context(), token.Token); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	c.Logger.Info("Пользователь разлогинился", slog.String("token", token.Token[:8]))
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
