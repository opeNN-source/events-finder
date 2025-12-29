package jwtman

import (
	"errors"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTManager struct {
	SecretKey     []byte
	TokenDuration time.Duration
}

type Claims struct {
	UserID string
	jwt.RegisteredClaims
}

func (manager *JWTManager) GenerateAccessToken(UID int) (string, error) {
	jti := uuid.New().String()
	claims := &Claims{UserID: strconv.Itoa(UID),
		RegisteredClaims: jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(time.Now().Add(manager.TokenDuration)),
			IssuedAt: jwt.NewNumericDate(time.Now()), ID: jti,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(manager.SecretKey)
}

// )))))
func (manager *JWTManager) VerifyToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return manager.SecretKey, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
