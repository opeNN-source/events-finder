package controller

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func RegisterHealthPb(server *grpc.Server, serviceName string) {
	hs := health.NewServer()

	hs.SetServingStatus("", healthpb.HealthCheckResponse_SERVING)

	hs.SetServingStatus(serviceName, healthpb.HealthCheckResponse_SERVING)

	healthpb.RegisterHealthServer(server, hs)
}
