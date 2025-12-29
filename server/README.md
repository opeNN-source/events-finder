# Server

REST API сервер сервиса для поиска мероприятий.

## Требования

- `python3.13` (точная версия указана в `pyproject.toml`), используйте `pyenv install`
- `postgresql` (точная версия указана в `docker-compose.yml`)
- Последняя версия `docker`


## Разработка

При локальной разработке мы используем:

- Плагин [`editorconfig`](http://editorconfig.org/) (**обязательно**)
- [`uv`](https://github.com/astral-sh/uv) (**обязательно**)
- [`pyenv`](https://github.com/pyenv/pyenv)

### Запуск с Docker (рекомендуется)

Самый простой способ запустить проект локально - использовать Docker Compose:

```bash
# 1. Скопируйте файл с переменными окружения
cp config/.env.template config/.env

# 2. Запустить сервер и базу данных
docker compose up

# Или в фоновом режиме
docker compose up -d
```

**Важно:** 
- При первом запуске автоматически выполнится SQL скрипт `scripts/create_dev_database.sql` для инициализации базы данных
- Если нужно пересоздать БД, удалите volume: `docker compose down -v`

Сервер будет доступен по адресу: **http://localhost:8000**

API документация (Swagger): **http://localhost:8000/docs**

### Разработка

**Форматирование кода:**
```bash
make format
```

**Проверка кода (линтинг):**
```bash
make lint
```

**Запуск тестов:**
```bash
uv run pytest
```

**Запуск CI проверок:**
```bash
docker compose run --rm server /code/docker/ci.sh
```
