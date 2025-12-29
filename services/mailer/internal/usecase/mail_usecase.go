package usecase

import (
	"log/slog"

	"github.com/s21-nn-developers/mailer/internal/domain"
)

type MailUsecase struct {
	mailServer domain.Mailer
	logger     *slog.Logger
}

func NewMailUsecase(sender domain.Mailer, logger *slog.Logger) MailUsecase {
	return MailUsecase{
		mailServer: sender,
		logger:     logger,
	}
}

func (m MailUsecase) RegMail(input domain.RegInput) error {
	m.logger.Info("USECASE: starting RegMail",
		"to", input.To,
	)

	err := m.mailServer.SendRegEvent(input.To, input.Events)

	if err != nil {
		return err
	}

	m.logger.Info("USECASE: registration email sent successfully",
		"to", input.To,
	)

	return nil
}
