package grpccontroller

import (
	"auth_service/internal/models"
	"auth_service/internal/services/auth"
	"auth_service/protos/gen/go/authservicegen"
	"context"
	"log/slog"
	"net/mail"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type AuthGRPCServer struct {
	authservicegen.UnimplementedAuthServiceServer
	AuthService *auth.Auth
	Logger      *slog.Logger
}

func NewGRPCController(service *auth.Auth, logger *slog.Logger) *AuthGRPCServer {
	return &AuthGRPCServer{AuthService: service, Logger: logger}
}

func (s *AuthGRPCServer) Register(ctx context.Context, req *authservicegen.RegisterRequest) (*authservicegen.StatusResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "email or password missing")
	}
	if _, err := mail.ParseAddress(req.Email); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid email")
	}
	user := models.NewUser{
		Email:    req.Email,
		HashPass: []byte(req.Password),
	}

	if err := s.AuthService.Register(ctx, user); err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, status.Error(codes.AlreadyExists, "user already exists")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	s.Logger.Info("User created", slog.String("email", req.Email))
	return &authservicegen.StatusResponse{Status: "ok"}, nil
}

func (s *AuthGRPCServer) Login(ctx context.Context, req *authservicegen.LoginRequest) (*authservicegen.TokenPair, error) {
	if req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "email or password missing")
	}
	user := models.NewUser{
		Email:    req.Email,
		HashPass: []byte(req.Password),
	}

	tokens, err := s.AuthService.Login(ctx, user)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, status.Error(codes.AlreadyExists, "user already exists")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	s.Logger.Debug("User logged in", slog.String("email", req.Email))
	return &authservicegen.TokenPair{AccessToken: tokens.AccessToken, RefreshToken: tokens.RefreshToken}, nil
}

func (s *AuthGRPCServer) Refresh(ctx context.Context, req *authservicegen.RefreshRequest) (*authservicegen.TokenPair, error) {
	if req.RefreshToken == "" {
		return nil, status.Error(codes.Unauthenticated, "missing refresh token")
	}

	token, err := s.AuthService.Refresh(ctx, req.RefreshToken)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "refresh token expired")
	}
	s.Logger.Debug("Token refreshed", slog.String("prev_token", req.RefreshToken))
	return &authservicegen.TokenPair{AccessToken: token.AccessToken, RefreshToken: token.RefreshToken}, nil
}

func (s *AuthGRPCServer) Logout(ctx context.Context, req *authservicegen.LogoutRequest) (*authservicegen.StatusResponse, error) {
	if err := s.AuthService.Logout(ctx, req.RefreshToken); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	s.Logger.Debug("User logout", slog.String("token", req.RefreshToken))
	return &authservicegen.StatusResponse{Status: "ok"}, nil
}
