package auth

import (
	jwtman "auth_service/internal/JWT/access"
	"auth_service/internal/JWT/refresh"
	"auth_service/internal/models"
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strconv"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/redis/go-redis/v9"
)

type UserRepository interface {
	GetUserByEmail(ctx context.Context, email string) (models.User, error)
	CreateNewUser(ctx context.Context, newUser models.NewUser) error
	IsAdmin(ctx context.Context, UID int) bool
}

type SessionStorage interface {
	SetSession(ctx context.Context, key, userID string, ttl time.Duration) error
	GetSession(ctx context.Context, token string) (string, error)
	DeleteSession(ctx context.Context, token string) error
}

type Auth struct {
	Logger  *slog.Logger
	Storage UserRepository
	JWT     *jwtman.JWTManager
	Redis   SessionStorage
}

type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// Init service logic floor
func NewAuth(logger *slog.Logger, Storage UserRepository, Redis SessionStorage, JWT *jwtman.JWTManager) *Auth {
	return &Auth{Logger: logger, Storage: Storage, JWT: JWT, Redis: Redis}
}

func HashPassword(password []byte) ([]byte, error) {
	bytes, err := bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost)
	return bytes, err
}

func CheckPasswordHash(password, hash []byte) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// Creating new user
func (auth *Auth) Register(ctx context.Context, user models.NewUser) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	hashed, err := HashPassword(user.HashPass)
	if err != nil {
		return err
	}
	user.HashPass = hashed

	return auth.Storage.CreateNewUser(ctx, user)
}

// Getting pair of refresh + access tokens
func (auth *Auth) Login(ctx context.Context, user models.NewUser) (*AuthResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	storedUser, err := auth.Storage.GetUserByEmail(ctx, user.Email)
	if err != nil {
		return nil, err
	}

	if ok := CheckPasswordHash(user.HashPass, storedUser.HashPass); !ok {
		auth.Logger.Info("Wrong password from user", slog.String(user.Email, ""))
		return nil, errors.New("wrong password")
	}

	accessToken, err := auth.JWT.GenerateAccessToken(storedUser.UID)
	if err != nil {
		return nil, err
	}

	refreshToken := refresh.GenerateRefreshToken()
	struid := strconv.Itoa(storedUser.UID)
	if err := auth.StoreRefreshToken(ctx, struid, refreshToken); err != nil {
		return nil, err
	}

	auth.Logger.Debug("Token created succesfully", slog.String("user_id", struid))
	return &AuthResponse{AccessToken: accessToken, RefreshToken: refreshToken}, nil
}

// Saving refresh token in redis
func (auth *Auth) StoreRefreshToken(ctx context.Context, UID, refreshToken string) error {
	key := fmt.Sprintf("refresh:%s", refreshToken)
	return auth.Redis.SetSession(ctx, key, UID, auth.JWT.TokenDuration)
}

// Verify incoming refresh token
func (auth *Auth) VerifyRefreshToken(ctx context.Context, refreshToken string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	key := fmt.Sprintf("refresh:%s", refreshToken)
	userID, err := auth.Redis.GetSession(ctx, key)
	if err == redis.Nil {
		return "", errors.New("invalid or expired refresh token")
	}
	return userID, err
}

// Creating new pair of refresh + access tokens
func (auth *Auth) Refresh(ctx context.Context, refreshToken string) (*AuthResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	userID, err := auth.VerifyRefreshToken(ctx, refreshToken)
	if err != nil {
		return nil, err
	}
	uid, err := strconv.Atoi(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid stored user id: %w", err)
	}

	accessToken, err := auth.JWT.GenerateAccessToken(uid)
	if err != nil {
		return nil, err
	}
	auth.Logger.Debug("Created new token", slog.String("user_id", userID))
	oldKey := fmt.Sprintf("refresh:%s", refreshToken)
	if err := auth.Redis.DeleteSession(ctx, oldKey); err != nil {
		auth.Logger.Warn("Failed delete previous refresh token", slog.String("refresh", refreshToken))
	}
	newRefreshToken := refresh.GenerateRefreshToken()

	if err := auth.StoreRefreshToken(ctx, userID, newRefreshToken); err != nil {
		return nil, err
	}
	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

// Deleting refresh token
func (auth *Auth) Logout(ctx context.Context, refreshToken string) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	key := fmt.Sprintf("refresh:%s", refreshToken)
	err := auth.Redis.DeleteSession(ctx, key)
	if err != nil {
		return err
	}

	auth.Logger.Debug("User logout", slog.String("refresh_token", refreshToken))
	return nil
}
