package logger

import (
	"context"
	"log/slog"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Config struct {
	AppName    string `envconfig:"APP_NAME" required:"true"`
	AppVersion string `envconfig:"APP_VERSION" required:"true"`
	Level      string `default:"error" envconfig:"LOGGER_LEVEL"`
	FileLogger bool   `default:"false"         envconfig:"FILE_LOGGER"`
}

type zapHandler struct {
	logger *zap.Logger
}

func (h *zapHandler) Enabled(_ context.Context, l slog.Level) bool {
	switch l {
	case slog.LevelDebug:
		return h.logger.Level().Enabled(zap.DebugLevel)
	case slog.LevelInfo:
		return h.logger.Level().Enabled(zap.InfoLevel)
	case slog.LevelWarn:
		return h.logger.Level().Enabled(zap.WarnLevel)
	case slog.LevelError:
		return h.logger.Core().Enabled(zap.ErrorLevel)
	default:
		return true
	}
}

func (h *zapHandler) Handle(_ context.Context, record slog.Record) error {
	fields := make([]zap.Field, 0, record.NumAttrs())
	record.Attrs(func(a slog.Attr) bool {
		fields = append(fields, zap.Any(a.Key, a.Value.Any()))
		return true
	})

	switch record.Level {
	case slog.LevelDebug:
		h.logger.Debug(record.Message, fields...)
	case slog.LevelInfo:
		h.logger.Info(record.Message, fields...)
	case slog.LevelWarn:
		h.logger.Warn(record.Message, fields...)
	case slog.LevelError:
		h.logger.Error(record.Message, fields...)
	default:
		h.logger.Info(record.Message, fields...)
	}
	return nil
}

func (h *zapHandler) WithGroup(name string) slog.Handler {
	return &zapHandler{
		logger: h.logger.With(zap.Namespace(name)),
	}
}

func (h *zapHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	zapFields := make([]zap.Field, len(attrs))
	for i, a := range attrs {
		zapFields[i] = zap.Any(a.Key, a.Value.Any())
	}

	return &zapHandler{
		logger: h.logger.With(zapFields...),
	}
}

func (h *zapHandler) With(attrs []slog.Attr) slog.Handler {
	newLogger := h.logger
	zapFields := make([]zap.Field, len(attrs))
	for i, a := range attrs {
		zapFields[i] = zap.Any(a.Key, a.Value.Any())
	}

	newLogger = newLogger.With(zapFields...)
	return &zapHandler{logger: newLogger}
}

func NewZapHandler(logger *zap.Logger) slog.Handler {
	return &zapHandler{
		logger: logger,
	}
}

func initZap(c Config) (*zap.Logger, error) {
	cfg := zap.NewDevelopmentConfig()

	var lvl zapcore.Level

	if err := lvl.UnmarshalText([]byte(c.Level)); err != nil {
		panic(err)
	}

	cfg.Level = zap.NewAtomicLevelAt(lvl)
	cfg.Encoding = "json"
	cfg.OutputPaths = []string{"stdout", "mailer.log"}
	cfg.ErrorOutputPaths = []string{"stderr"}

	return cfg.Build()
}

func Init(c Config) *slog.Logger {
	zapLogger, _ := initZap(c)

	logger := slog.New(NewZapHandler(zapLogger))

	return logger
}
