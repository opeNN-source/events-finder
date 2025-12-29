package main

import (
	jwtman "auth_service/internal/JWT/access"
	"auth_service/internal/config"
	grpccontroller "auth_service/internal/grpc_controller"
	"auth_service/internal/health"
	"auth_service/internal/logger"
	"auth_service/internal/services/auth"
	redis "auth_service/internal/storage/Redis"
	postgresstorage "auth_service/internal/storage/postgresStorage"
	"auth_service/protos/gen/go/authservicegen"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"google.golang.org/grpc"
)

func main() {
	cfg := config.MustLoad()

	logger, err := logger.NewLogger()
	if err != nil {
		panic("Failed init logger: " + err.Error())
	}

	storage := postgresstorage.NewPostgres(cfg.Storage_path, logger)

	rds := &redis.RedisStorage{Redis: redis.NewRedisClient(cfg.RedisAddr)}

	logger.Info("Redis succesfully connected")

	jwt := &jwtman.JWTManager{
		SecretKey:     []byte(os.Getenv("JWT_SECRET")),
		TokenDuration: 15 * time.Minute,
	}

	authSvc := auth.NewAuth(logger, storage, rds, jwt)

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	grpcServer := grpc.NewServer()

	authservicegen.RegisterAuthServiceServer(
		grpcServer,
		grpccontroller.NewGRPCController(authSvc, logger),
	)

	go func() {
		lis, _ := net.Listen("tcp", ":50051")
		grpcServer.Serve(lis)
	}()
	http.HandleFunc("/health", health.HealthCheck)

	go func() {
		http.ListenAndServe(":8080", nil)
	}()

	<-stop
	logger.Info("Stopping server")

	grpcServer.GracefulStop()

	logger.Info("Server stopped correctly")
}
