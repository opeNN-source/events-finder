#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

# Инициализация переменных:
: "${MAILER_ENV:=development}"

# Завершаем CI, если `MAILER_ENV` не development
if [ "$MAILER_ENV" != 'development' ]; then
  echo "MAILER_ENV не установлен в development. Запускать CI небезопасно."
  exit 1
fi

goclean() {
  # Очистка временных и кэшированных файлов Go:
  echo "Очистка кэша Go..."
  go clean -cache -testcache -modcache
}

run_ci() {
  echo "[CI запущен]"
  set -x

  # Проверка линтинга:
  if ! command -v golangci-lint &>/dev/null; then
    echo "golangci-lint не установлен. Установите его для CI."
    exit 1
  fi
  golangci-lint run ./...

  # Проверка форматирования:
  go fmt ./...
  go vet ./...

  # Проверка модулей и зависимостей:
  go mod tidy
  go mod verify

  # Запуск тестов с покрытием:
  go test -v -cover ./...

  set +x
  echo "[CI завершен]"
}

# Очистка перед запуском
goclean

# Очистка при завершении:
trap goclean EXIT INT TERM

# Запуск CI
run_ci
