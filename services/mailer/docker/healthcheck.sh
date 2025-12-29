#!/usr/bin/env sh

# Для Docker, проверка gRPC Health на порту 50051

set -o errexit
set -o nounset

# Проверяем сервис 'your.service.name'
grpc-health-probe -addr=mailer-mailer-1:50051 -service=mailer.EmailService

/bin/echo 'ok'
