package jwtman_test

import (
	jwtman "auth_service/internal/JWT/access"
	"strconv"
	"testing"
	"time"
)

func TestJWTManager_GenerateAndVerify(t *testing.T) {
	jwt := &jwtman.JWTManager{
		SecretKey:     []byte("testsecret"),
		TokenDuration: 15 * time.Minute,
	}

	userID := 123
	token, err := jwt.GenerateAccessToken(userID)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	claims, err := jwt.VerifyToken(token)
	if err != nil {
		t.Fatalf("failed to verify token: %v", err)
	}

	if claims.UserID != strconv.Itoa(userID) {
		t.Errorf("expected userID %d, got %s", userID, claims.UserID)
	}

	expiredJWT := &jwtman.JWTManager{
		SecretKey:     []byte("testsecret"),
		TokenDuration: -time.Minute,
	}
	expiredToken, _ := expiredJWT.GenerateAccessToken(userID)
	if _, err := expiredJWT.VerifyToken(expiredToken); err == nil {
		t.Error("expected error for expired token, got none")
	}
}
