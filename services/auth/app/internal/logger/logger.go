package logger

import (
	"flag"
	"log/slog"

	slogzap "github.com/samber/slog-zap"
	"go.uber.org/zap"
)

func NewLogger() (*slog.Logger, error) {
	Level := fetchLogLevel()
	cfg := zap.NewProductionConfig()
	var slogLevel slog.Level

	switch Level {
	case "debug":
		cfg.Level = zap.NewAtomicLevelAt(zap.DebugLevel)
		slogLevel = slog.LevelDebug
	case "info":
		cfg.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
		slogLevel = slog.LevelInfo
	case "warn":
		cfg.Level = zap.NewAtomicLevelAt(zap.WarnLevel)
		slogLevel = slog.LevelWarn
	case "error":
		cfg.Level = zap.NewAtomicLevelAt(zap.ErrorLevel)
		slogLevel = slog.LevelError
	default:
		cfg.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
		slogLevel = slog.LevelInfo
	}

	zapLogger, err := cfg.Build()
	if err != nil {
		return nil, err
	}
	return slog.New(slogzap.Option{Level: slogLevel, Logger: zapLogger}.NewZapHandler()), nil
}

func fetchLogLevel() string {
	var res string

	flag.StringVar(&res, "logLevel", "", "config logging level")
	flag.Parse()

	return res
}
