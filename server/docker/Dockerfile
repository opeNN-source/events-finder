# syntax = docker/dockerfile:1
# Этот Dockerfile использует multi-stage сборку для DEV и PROD образов:
# https://docs.docker.com/develop/develop-images/multistage-build/

FROM python:3.13.5-slim-bookworm AS development_build

# `SERVER_ENV` аргумент используется для prod / dev сборок:
ARG SERVER_ENV \
  # Необходимо для исправления прав доступа к файлам, созданным Docker:
  UID=1000 \
  GID=1000

ENV SERVER_ENV=${SERVER_ENV} \
  # python:
  PYTHONFAULTHANDLER=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PYTHONDONTWRITEBYTECODE=1 \
  # pip:
  PIP_NO_CACHE_DIR=1 \
  PIP_DISABLE_PIP_VERSION_CHECK=1 \
  PIP_DEFAULT_TIMEOUT=100 \
  PIP_ROOT_USER_ACTION=ignore \
  # tini:
  TINI_VERSION=v0.19.0 \
  # uv:
  UV_COMPILE_BYTECODE=1 \
  UV_PROJECT_ENVIRONMENT=/usr/local \
  # Директория для кэша uv:
  UV_CACHE_DIR=/root/.cache/uv

SHELL ["/bin/bash", "-eo", "pipefail", "-c"]

# Системные зависимости (не используем точные версии, так как их сложно обновлять,
# закрепляем при необходимости):
RUN apt-get update && apt-get upgrade -y \
  && apt-get install --no-install-recommends -y \
    bash \
    brotli \
    build-essential \
    curl \
    gettext \
    git \
    libpq-dev \
  # Установка `tini`:
  # https://github.com/krallin/tini
  # Получение архитектуры для загрузки соответствующей версии tini:
  && dpkgArch="$(dpkg --print-architecture | awk -F- '{ print $NF }')" \
  && curl -o /usr/local/bin/tini -sSLO "https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${dpkgArch}" \
  && chmod +x /usr/local/bin/tini && tini --version \
  # Установка `uv` глобально для всех пользователей:
  # https://github.com/astral-sh/uv
  # Устанавливаем в /root/.local/bin, затем копируем в /usr/local/bin
  && curl -LsSf https://astral.sh/uv/install.sh | sh \
  && cp /root/.local/bin/uv /usr/local/bin/uv \
  && cp /root/.local/bin/uvx /usr/local/bin/uvx \
  && uv --version \
  # Очистка кэша:
  && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
  && apt-get clean -y && rm -rf /var/lib/apt/lists/*

WORKDIR /server

RUN groupadd -g "${GID}" -r server \
  && useradd -d '/server' -g server -l -r -u "${UID}" server \
  && chown server:server -R '/server'

# Копируем только requirements для кэширования в docker слое:
COPY --chown=server:server ./uv.lock ./pyproject.toml ./README.md /server/

# Инициализация проекта:
RUN --mount=type=cache,target="$UV_CACHE_DIR" \
  echo "$SERVER_ENV" \
  && uv --version \
  && uv sync --frozen --no-install-project \
    $(if [ "$SERVER_ENV" = 'production' ]; then echo '--no-dev'; fi)

# Специальный скрипт для точки входа:
COPY ./docker/entrypoint.sh /docker-entrypoint.sh

# Настройка прав доступа:
RUN chmod +x '/docker-entrypoint.sh' \
  # Замена разделителя строк CRLF на LF для пользователей Windows:
  && sed -i 's/\r$//g' '/docker-entrypoint.sh'

# Запуск от имени непривилегированного пользователя:
USER server

# Настройка загрузки приложения через кастомный entrypoint:
ENTRYPOINT ["tini", "--", "/docker-entrypoint.sh"]

# Следующий этап только для production сборки:
FROM development_build AS production_build
COPY --chown=server:server . /server
