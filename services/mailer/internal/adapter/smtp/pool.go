package smtp

import (
	"context"
	"log/slog"
	"sync"
)

type workerPool struct {
	jobs   chan sendJob
	wg     *sync.WaitGroup
	ctx    context.Context
	logger *slog.Logger
}

func NewWorkerPool(cfg Config, ctx context.Context, logger *slog.Logger) *workerPool {
	p := &workerPool{
		jobs:   make(chan sendJob, cfg.QueueSize),
		ctx:    ctx,
		wg:     &sync.WaitGroup{},
		logger: logger,
	}

	for i := 0; i < cfg.WorkerCount; i++ {
		w := newWorker(
			i,
			p.jobs,
			ctx,
			p.wg,
			cfg,
			logger,
		)

		p.wg.Add(1)
		go w.run()

		logger.Info("SMTP: worker started",
			"worker_id", i,
		)
	}

	return p
}

func (p *workerPool) Shutdown() {
	p.wg.Wait()

	close(p.jobs)
	p.logger.Info("SMTP: worker pool shutdown completed")
}

func (p *workerPool) submit(job sendJob) {
	select {
	case <-p.ctx.Done():
		return
	case p.jobs <- job:
		p.logger.Debug("SMTP: job submitted to worker pool",
			"to", job.to,
			"subject", job.subject,
			"queue_len", len(p.jobs),
			"queue_cap", cap(p.jobs),
		)
	}
}
