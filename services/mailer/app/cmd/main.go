package main

import (
	"github.com/s21-nn-developers/mailer/app"
	"github.com/s21-nn-developers/mailer/config"
)

func main() {
	config, err := config.InitConfig()

	if err != nil {
		panic(err)
	}

	app.App(config)
}
