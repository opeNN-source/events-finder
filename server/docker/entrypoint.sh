#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

readonly cmd="$*"

echo "Сервер запущен: $cmd"

# Выполнение переданной команды (не изменять):
# shellcheck disable=SC2086
exec $cmd
