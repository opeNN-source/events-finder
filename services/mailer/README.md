# Event Registration Email Notifier

Простой сервис на Go, который отправляет email-подтверждение после регистрации на мероприятие через SMTP.

[![Go Version](https://img.shields.io/badge/Go-1.25.3+-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![Docker](https://img.shields.io/badge/Docker-ready-blue?logo=docker)](https://www.docker.com)

## Назначение

Отправка уведомлений о приглашении на мероприятие по email

## Возможности

- Любой SMTP-сервер (Gmail, Яндекс, SendGrid, Amazon SES…)
- HTML-шаблоны с подстановкой переменных (html/template)
- Конфигурация через переменные окружения
- Логирование отправок и ошибок
- Поддержка занесения события в календарь (PDF-билет и т.д.)
- Запуск через Docker + docker-compose

