package server

import (
	"auth_service/internal/controller"
	"context"
	"errors"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"
)

type Server struct {
	HttpServer *http.Server
	Router     *mux.Router
	Logger     *slog.Logger
}

func NewServer(controller *controller.AuthController, logger *slog.Logger) *Server {
	router := mux.NewRouter()

	router.HandleFunc("/login", controller.LoginHandler).Methods("POST")
	router.HandleFunc("/logout", controller.LogoutHandler).Methods("POST")
	router.HandleFunc("/refresh", controller.RefreshHandler).Methods("POST")
	router.HandleFunc("/register", controller.RegisterHandler).Methods("POST")

	srv := &http.Server{
		Addr:    ":8080",
		Handler: router,
	}
	return &Server{
		HttpServer: srv,
		Router:     router,
		Logger:     logger,
	}
}

func (s *Server) Start() {
	go func() {
		s.Logger.Info("Server starting", slog.String("port", s.HttpServer.Addr))
		if err := s.HttpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			s.Logger.Error("Server error", slog.Any("error", err))
		}
	}()
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.HttpServer.Shutdown(ctx)
}
