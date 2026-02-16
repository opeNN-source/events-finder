package smtp

import (
	"context"
	"log/slog"
	"sync"
	"time"
)

type worker struct {
	id     int
	jobs   <-chan sendJob
	ctx    context.Context
	wg     *sync.WaitGroup
	cfg    Config
	logger *slog.Logger
}

func newWorker(
	id int,
	jobs <-chan sendJob,
	ctx context.Context,
	wg *sync.WaitGroup,
	cfg Config,
	logger *slog.Logger,
) *worker {
	return &worker{
		id:     id,
		ctx:    ctx,
		wg:     wg,
		jobs:   jobs,
		cfg:    cfg,
		logger: logger,
	}
}

func (w *worker) run() {
	defer w.wg.Done()

	w.logger.Info("SMTP: worker started", "id", w.id)

	for {
		select {
		case <-w.ctx.Done():
			w.logger.Info("SMTP: worker shutting down", "id", w.id)
			return

		case job, ok := <-w.jobs:
			if !ok {
				w.logger.Info("SMTP: jobs channel closed", "id", w.id)
				return
			}

			w.logger.Debug("SMTP: job received",
				"worker_id", w.id,
				"to", job.to,
				"subject", job.subject,
			)

			var lastErr error

			for attempt := 1; attempt <= w.cfg.Retry; attempt++ {
				w.logger.Debug("SMTP: sending email attempt",
					"worker_id", w.id,
					"attempt", attempt,
					"to", job.to,
				)

				ctx, cancel := context.WithTimeout(w.ctx, w.cfg.DialTimeout)

				err := SendEmailWithTimeout(ctx, job, w.cfg.From)
				cancel()

				if err == nil {
					w.logger.Info("SMTP: email sent successfully",
						"worker_id", w.id,
						"to", job.to,
					)
					lastErr = nil
					break
				}

				lastErr = err

				w.logger.Warn("SMTP: send attempt failed",
					"worker_id", w.id,
					"attempt", attempt,
					"to", job.to,
					"error", err.Error(),
				)

				if !isRetryableSMTPError(err) {
					w.logger.Warn("SMTP: non-retryable error, aborting",
						"worker_id", w.id,
						"to", job.to,
						"error", err.Error(),
					)
					break
				}

				time.Sleep(w.cfg.Timeout)
			}

			if lastErr != nil {
				w.logger.Error("SMTP: email permanently failed",
					"worker_id", w.id,
					"to", job.to,
					"subject", job.subject,
					"error", lastErr.Error(),
				)
			}
		}
	}
}
