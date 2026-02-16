package controller

import (
	"context"
	"log/slog"

	pb "github.com/s21-nn-developers/mailer/contract/gen/mailerpb"
	"github.com/s21-nn-developers/mailer/internal/domain"
	"github.com/s21-nn-developers/mailer/internal/usecase"
	"github.com/s21-nn-developers/mailer/internal/utils"
)

type Config struct {
	Host     string `envconfig:"GRPC_HOST" default:"0.0.0.0"`
	Port     string `envconfig:"GRPC_PORT" default:"50051"`
	Tls      bool   `envconfig:"GRPC_ENABLE_TLS" default:"false"`
	CertFile string `envconfig:"GRPC_CERT_FILE" default:"server.crt"`
	KeyFile  string `envconfig:"GRPC_KEY_FILE" default:"server.key"`
}

type Server struct {
	pb.UnimplementedEmailServiceServer
	mailUsecase usecase.MailUsecase
	logger      *slog.Logger
}

func NewServer(mailSender usecase.MailUsecase, logger *slog.Logger) *Server {
	return &Server{
		mailUsecase: mailSender,
		logger:      logger,
	}
}

func (s *Server) SendRegistrationNotification(
	c context.Context,
	req *pb.RegistrationRequest,
) (*pb.EmailResponse, error) {
	s.logger.Info("GRPC: incoming SendRegistrationNotification request",
		"to", req.To,
	)

	if !utils.IsValidEmail(req.To) {
		s.logger.Warn("USECASE: invalid email", "to", req.To)

		return &pb.EmailResponse{
				Ok:    false,
				Error: domain.ErrInvalidEmail.Error(),
			},
			nil
	}

	err := s.mailUsecase.RegMail(
		domain.NewRegInput(
			req.To,
			newArrEvents(req.Events),
		),
	)
	if err != nil {
		s.logger.Error("GRPC: RegMail failed",
			"to", req.To,
		)
		return &pb.EmailResponse{
			Ok:    false,
			Error: err.Error(),
		}, nil
	}

	s.logger.Info("GRPC: registration notification sent successfully",
		"to", req.To,
	)

	return &pb.EmailResponse{Ok: true}, nil
}

func newArrEvents(eventsPb []*pb.Event) []domain.Event {
	events := []domain.Event{}

	for _, event := range eventsPb {
		events = append(events, domain.NewEvent(
			event.Id,
			event.Name,
			event.Description,
			event.Format,
			event.Region,
			event.Category,
			event.Type,

			event.StartTime.AsTime(),
			event.EndTime.AsTime(),
		))
	}

	return events
}
