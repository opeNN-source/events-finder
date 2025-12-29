package config

import (
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"github.com/s21-nn-developers/mailer/internal/adapter/smtp"
	controller "github.com/s21-nn-developers/mailer/internal/controller/grpc"
	"github.com/s21-nn-developers/mailer/internal/logger"
)

type App struct {
	Name    string `envconfig:"APP_NAME"    required:"true"`
	Version string `envconfig:"APP_VERSION" required:"true"`
}

type Config struct {
	App
	Logger logger.Config
	SMTP   smtp.Config
	Grpc   controller.Config
}

func InitConfig() (Config, error) {
	config := Config{}

	err := godotenv.Load("config/.env")

	if err != nil {
		return Config{}, err
	}

	err = envconfig.Process("", &config)

	if err != nil {
		return Config{}, err
	}

	return config, nil
}
