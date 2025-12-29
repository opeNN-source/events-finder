# syntax=docker/dockerfile:1
# Multi-stage build для Go: development и production

# ========================
# Stage 1: Development build
# ========================
FROM golang:1.25-bookworm AS development_build

# Аргументы для dev/prod и прав пользователя
ARG MAILER_ENV
ARG UID=1000
ARG GID=1000

# ENV для Go и tini
ENV MAILER_ENV=${MAILER_ENV} \
    CGO_ENABLED=1 \
    GO111MODULE=on \
    GOCACHE=/root/.cache/go-build \
    GOMODCACHE=/root/.cache/go-mod \
    TINI_VERSION=v0.19.0 \ 
    GRPCURL_VERSION=v1.8.7

# Используем bash
SHELL ["/bin/bash", "-eo", "pipefail", "-c"]

# Системные зависимости
RUN apt-get update && apt-get upgrade -y \
    && apt-get install --no-install-recommends -y \
    bash \
    curl \
    git \
    build-essential \
    libpq-dev \
    make \
    # Установка tini
    && dpkgArch="$(dpkg --print-architecture | awk -F- '{ print $NF }')" \
    && curl -Lo /usr/local/bin/tini -sSL "https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${dpkgArch}" \
    && chmod +x /usr/local/bin/tini \
    && tini --version \
    # Установка grpcurl
    && go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest \
    && go install github.com/grpc-ecosystem/grpc-health-probe@latest \
    # Очистка кэша apt
    && apt-get purge -y --auto-remove \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

RUN grpcurl --version && grpc-health-probe --version

# Создаем непривилегированного пользователя
RUN groupadd -g "${GID}" -r mailer \
    && useradd -d '/mailer' -g mailer -l -r -u "${UID}" mailer \
    && mkdir -p /mailer \
    && chown mailer:mailer -R /mailer

WORKDIR /mailer

# Копируем go.mod и go.sum для кэширования модулей
COPY --chown=mailer:mailer go.mod go.sum ./

# Загружаем зависимости
RUN --mount=type=cache,target=$GOMODCACHE \
    go mod download

# Копируем весь проект
COPY --chown=mailer:mailer . .

# Сборка dev-версии
RUN --mount=type=cache,target=$GOCACHE \
    if [ "$MAILER_ENV" = "production" ]; then \
    go build -o mailer ./app/cmd/main.go; \
    else \
    go build -o mailer -gcflags "all=-N -l" ./app/cmd/main.go; \
    fi

# Точка входа
COPY ./docker/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh 

USER mailer
ENTRYPOINT ["tini", "--", "/docker-entrypoint.sh"]

# ========================
# Stage 2: Production build
# ========================
FROM development_build AS production_build

# Для production копируем только бинарник и минимальные файлы
WORKDIR /mailer
COPY --from=development_build /mailer/mailer /mailer/mailer
COPY --chown=mailer:mailer ./docker/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Можно очистить исходники и кэш для уменьшения размера
RUN rm -rf /mailer/.git /mailer/.cache /mailer/*test* /mailer/go.*

ENTRYPOINT ["tini", "--", "/docker-entrypoint.sh"]
CMD ["/mailer/mailer"]
