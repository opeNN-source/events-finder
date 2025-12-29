#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

# Инициализация глобальных переменных и функций:
: "${SERVER_ENV:=development}"

# Завершаем CI, если `SERVER_ENV` не установлен в `development`:
if [ "$SERVER_ENV" != 'development' ]; then
  echo 'SERVER_ENV не установлен в development. Запускать тесты небезопасно.'
  exit 1
fi

pyclean () {
  # Очистка кэша:
  find . \
    | grep -E '(__pycache__|\.(mypy_|pytest_)?cache|\.(hypothesis|perm|static)|\.py[cod]$)' \
    | xargs rm -rf \
  || true
}

run_ci () {
  echo '[ci запущен]'
  set -x  # выводим команды в процессе CI.

  # Тестирование файловой системы и прав доступа:
  touch .perm && rm -f .perm

  # Проверка `.env` файлов:
  dotenv-linter config/.env config/.env.template

  # Запуск линтинга для всех python файлов в проекте:
  ruff check --exit-non-zero-on-fix
  ruff format --check --diff
  flake8 .

  # Проверка типов:
  mypy .

  # Генерация отчета о безопасности зависимостей,
  # не блокирует выполнение, так как много ложных срабатываний:
  safety check --full-report || true

  # Проверка синхронизации зависимостей uv:
  uv sync --check

  # Проверка статуса зависимостей:
  uv pip check

  set +x
  echo '[ci завершен]'
}

# Очистка кэша перед запуском скрипта:
pyclean

# Очистка при завершении:
trap pyclean EXIT INT TERM

# Запуск CI процесса:
run_ci
