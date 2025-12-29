# Go Auth Template

Simple authentication service template written in Go.

Includes JWT auth, Redis sessions, PostgreSQL.

## Purpose

This project is a template for building authentication microservices in Go.
It is intended for learning purposes and as a starting point for real projects.

## Features
- JWT authentication (access tokens)
- Session storage via Redis
- PostgreSQL as main storage
- Clean architecture (handlers / services / storage)
- Config via environment variables

## Configuration

The service is configured using environment variables:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `REDIS_ADDR`
- `TOKEN_TTL` (example: `15m`, `1h`)
- `JWT_SECRET`

## How to run

```bash
docker compose up --build
```

## API

### gRPC

- **/Register**

Creates a new user

- **/Login**

Returns JWT token pair

- **/Refresh**

Returns new pair of tokens

- **/Logout**

Deactivates a refresh token

### http

- **/health**

Returns ok