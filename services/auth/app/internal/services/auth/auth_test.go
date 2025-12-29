package auth_test

import (
	jwtman "auth_service/internal/JWT/access"
	"auth_service/internal/models"
	"auth_service/internal/services/auth"
	"context"
	"log/slog"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type MockStorage struct {
	user models.User
}

func (m *MockStorage) GetUserByEmail(ctx context.Context, email string) (models.User, error) {
	return m.user, nil
}

func (m *MockStorage) CreateNewUser(ctx context.Context, user models.NewUser) error {
	m.user = models.User{UID: 1, Email: user.Email, HashPass: user.HashPass}
	return nil
}

func (m *MockStorage) IsAdmin(ctx context.Context, UID int) bool {
	return false
}

type MockRedisStorage struct{}

func (r *MockRedisStorage) SetSession(ctx context.Context, key string, userID string, ttl time.Duration) error {
	return nil
}

func (r *MockRedisStorage) GetSession(ctx context.Context, token string) (string, error) {
	return "", nil
}

func (r *MockRedisStorage) DeleteSession(ctx context.Context, token string) error {
	return nil
}

func TestAuthService_Login(t *testing.T) {
	hash, _ := bcrypt.GenerateFromPassword([]byte("examplepass"), bcrypt.DefaultCost)
	mockStorage := &MockStorage{
		user: models.User{
			UID:      1,
			Email:    "test123@example.com",
			HashPass: hash,
		},
	}
	mockRedis := &MockRedisStorage{}
	jwt := &jwtman.JWTManager{
		SecretKey:     []byte("test"),
		TokenDuration: 15 * time.Minute,
	}
	logger := slog.Default()
	ctx, cancel := context.WithCancel(context.Background())
	authSvc := auth.NewAuth(logger, mockStorage, mockRedis, jwt)

	user := models.NewUser{Email: "test123@example.com", HashPass: []byte("examplepass")}

	token, err := authSvc.Login(ctx, user)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if token.AccessToken == "" {
		t.Error("expected token, got empty string")
	}
	cancel()
}

func TestAuthService_Register(t *testing.T) {
	mockStorage := &MockStorage{}
	email := "example@password"
	password := "testpass"
	mockRedis := &MockRedisStorage{}
	jwt := &jwtman.JWTManager{
		SecretKey:     []byte("test"),
		TokenDuration: 15 * time.Minute,
	}
	user := models.NewUser{Email: email, HashPass: []byte(password)}
	logger := slog.Default()
	ctx, cancel := context.WithCancel(context.Background())
	authSvc := auth.NewAuth(logger, mockStorage, mockRedis, jwt)
	err := authSvc.Register(ctx, user)
	cancel()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if mockStorage.user.Email != user.Email {
		t.Error("emails not equal")
	}
	// я дегенерат))))
	if ok := auth.CheckPasswordHash([]byte(password), mockStorage.user.HashPass); !ok {
		t.Error("password checks incorrectly")
	}
}
