package config

import (
	"fmt"
	"os"
	"time"
)

type Config struct {
	TokenTTL     time.Duration
	RedisAddr    string
	Storage_path string
}

func MustLoad() *Config {
	var cfg Config
	cfg.RedisAddr = os.Getenv("REDIS_ADDR")
	Dur, err := time.ParseDuration(os.Getenv("TOKEN_TTL"))
	if err != nil {
		panic(err.Error())
	}
	cfg.TokenTTL = Dur

	cfg.Storage_path = fmt.Sprintf(
		"postgres://%s:%s@postgres:5432/%s?sslmode=disable",
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DB"),
	)

	return &cfg
}
