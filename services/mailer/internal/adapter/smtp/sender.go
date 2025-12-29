package smtp

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/smtp"
	"strings"
	"time"

	"github.com/s21-nn-developers/mailer/internal/domain"
	templates "github.com/s21-nn-developers/mailer/internal/template"
	"github.com/s21-nn-developers/mailer/internal/utils"
)

type Config struct {
	Host     string `envconfig:"SMTP_HOST" required:"true"`
	Port     int    `envconfig:"SMTP_PORT" default:"587"`
	Username string `envconfig:"SMTP_USERNAME" required:"true"`
	Password string `envconfig:"SMTP_PASSWORD" required:"true"`
	From     string `envconfig:"SMTP_FROM" required:"true"`
	FromName string `envconfig:"SMTP_FROM_NAME" default:"My Service"`
	UseTLS   bool   `envconfig:"SMTP_USE_TLS" default:"true"`

	DialTimeout time.Duration `envconfig:"SMTP_DIAL_TIMEOUT" default:"5s"`
	Timeout     time.Duration `envconfig:"SMTP_TIMEOUT" default:"1s"`
	Retry       int           `envconfig:"SMTP_RETRY" default:"5"`
	WorkerCount int           `envconfig:"SMTP_WORKER_COUNT" default:"3"`
	QueueSize   int           `envconfig:"SMTP_JOBS_QUEUE_SIZE" default:"10"`
}

type MailSender struct {
	cfg      Config
	template domain.Renderer
	logger   *slog.Logger

	pool *workerPool
}

func NewSMTP(
	c Config,
	template domain.Renderer,
	wPool *workerPool,
	logger *slog.Logger,
) *MailSender {
	return &MailSender{
		cfg:      c,
		template: template,
		logger:   logger,
		pool:     wPool,
	}
}

func (m MailSender) SendRegEvent(to string, eventsData []domain.Event) error {
	addr := fmt.Sprintf("%s:%d", m.cfg.Host, m.cfg.Port)
	auth := smtp.PlainAuth(
		"",
		m.cfg.Username,
		m.cfg.Password,
		m.cfg.Host,
	)

	for _, eData := range eventsData {
		html, err := m.template.Render(domain.RegHtmlFilename, eData)
		if err != nil {
			m.logger.Error(
				"SMTP: render html err",
				"filename", domain.RegHtmlFilename,
			)

			return err
		}

		timeFormat := "20060102T150405Z"

		eventIcs := templates.NewEventEmailRegistation(
			eData.Id,
			eData.Name,
			eData.Description,
			eData.Format,
			eData.Region,
			eData.Category,
			eData.Type,
			eData.StartTime.UTC().Format(timeFormat),
			time.Now().UTC().Format(timeFormat),
			eData.EndTime.UTC().Format(timeFormat),
		)

		ics, err := m.template.Render(domain.RegIcsFilename, eventIcs)
		if err != nil {
			m.logger.Error(
				"SMTP: render ics err",
				"filename", domain.RegIcsFilename,
			)

			return err
		}

		body := utils.TemporaryHtmlAndIcsEmail(
			m.cfg.From,
			to,
			domain.RegSubject,
			html,
			ics,
		)

		m.pool.submit(newSendJob(to, domain.RegSubject, addr, auth, body))
	}

	return nil
}

func SendEmailWithTimeout(
	ctx context.Context,
	job sendJob,
	from string,
) error {
	d := net.Dialer{}

	conn, err := d.DialContext(ctx, "tcp", job.addr)

	if err != nil {
		return err
	}

	client, err := smtp.NewClient(conn, strings.Split(job.addr, ":")[0])

	if err != nil {
		return err
	}

	defer client.Quit()

	if ok, _ := client.Extension("STARTTLS"); ok {
		tlsConfig := &tls.Config{
			ServerName: strings.Split(job.addr, ":")[0],
		}
		if err := client.StartTLS(tlsConfig); err != nil {
			return err
		}
	}

	if err := client.Auth(job.auth); err != nil {
		return err
	}

	if err := client.Mail(from); err != nil {
		return err
	}

	if err := client.Rcpt(job.to); err != nil {
		return err
	}

	w, err := client.Data()
	if err != nil {
		return err
	}

	_, err = w.Write(job.body)
	if err != nil {
		return err
	}

	return nil
}

func isRetryableSMTPError(err error) bool {
	if err == nil {
		return false
	}

	// Потеря соединения
	if errors.Is(err, io.EOF) {
		return true
	}

	// таймаут
	var netErr net.Error
	if errors.As(err, &netErr) && netErr.Timeout() {
		return true
	}

	msg := err.Error()

	if strings.Contains(msg, "connection reset") ||
		strings.Contains(msg, "connection refused") ||
		strings.Contains(msg, "broken pipe") ||
		strings.Contains(msg, "no route to host") ||
		strings.Contains(msg, "network is unreachable") {
		return true
	}

	// 4xx SMTP ошибки (сервер перегружен, попробуйте позже)
	if strings.Contains(err.Error(), "4") {
		return true
	}

	return false
}
