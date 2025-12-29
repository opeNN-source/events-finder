package app

import (
	"context"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/s21-nn-developers/mailer/config"
	pb "github.com/s21-nn-developers/mailer/contract/gen/mailerpb"
	"github.com/s21-nn-developers/mailer/internal/adapter/smtp"
	controller "github.com/s21-nn-developers/mailer/internal/controller/grpc"
	"github.com/s21-nn-developers/mailer/internal/logger"
	templates "github.com/s21-nn-developers/mailer/internal/template"
	"github.com/s21-nn-developers/mailer/internal/usecase"
	"google.golang.org/grpc"
)

func App(c config.Config) {
	logger := logger.Init(c.Logger)
	logger.Info("App: starting initialization")

	// Working dir
	cwd, err := os.Getwd()
	if err != nil {
		logger.Error("FS: failed to get working directory", "error", err)
		panic(err)
	}
	logger.Info("FS: working directory acquired", "cwd", cwd)

	// Templates
	template, err := templates.NewRenderer(cwd+"/template", logger)
	if err != nil {
		logger.Error("Template: initialization failed", "error", err)
		panic(err)
	}
	logger.Info("Template: renderer initialized")

	mainCtx, cancel := context.WithCancel(context.Background())

	smtpWorkerPool := smtp.NewWorkerPool(c.SMTP, mainCtx, logger)

	mailer := smtp.NewSMTP(c.SMTP, template, smtpWorkerPool, logger)
	logger.Info("SMTP: initialized")

	// Usecase
	usecase := usecase.NewMailUsecase(mailer, logger)
	logger.Info("Usecase: mail usecase ready")

	// Controller / server
	server := controller.NewServer(usecase, logger)
	logger.Info("Server: controller initialized")

	// gRPC
	lis, err := net.Listen("tcp", c.Grpc.Port)
	if err != nil {
		logger.Error("gRPC: failed to start listener", "error", err)
		panic(err)
	}
	logger.Info("gRPC: listener started", "port", c.Grpc.Port)

	s := grpc.NewServer()

	logger.Debug("gRPC: registering EmailService...")
	pb.RegisterEmailServiceServer(s, server)

	logger.Debug("gRPC: registering HealthChecker...")
	controller.RegisterHealthPb(s, "mailer.EmailService")

	// Start serving
	go func() {
		logger.Debug("gRPC: server starting...")
		if err := s.Serve(lis); err != nil {
			logger.Error("gRPC: server stopped with error", "error", err)
			panic(err)
		}
	}()
	logger.Info("gRPC: server started", "port", c.Grpc.Port)

	// Graceful shutdown
	gfs := make(chan os.Signal, 1)
	signal.Notify(gfs, os.Interrupt, syscall.SIGTERM)

	sig := <-gfs
	logger.Info("App: shutdown signal received", "signal", sig)
	s.GracefulStop()
	cancel()
	smtpWorkerPool.Shutdown()
	logger.Info("App: shutting down gracefully")
}
