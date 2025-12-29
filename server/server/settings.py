import pydantic_settings
from lite_bootstrap import LitestarConfig
from sqlalchemy.engine.url import URL, make_url


class Settings(pydantic_settings.BaseSettings):
    model_config = pydantic_settings.SettingsConfigDict(
        env_file='config/.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore',
    )

    service_name: str = 'events-finder-server'
    service_version: str = '0.1'
    service_environment: str = 'development'
    service_debug: bool = False
    log_level: str = 'info'

    postgres_name: str  
    postgres_user: str 
    postgres_password: str 
    postgres_host: str = 'db'
    postgres_port: int = 5432
    postgres_pool_size: int = 5
    postgres_max_overflow: int = 0
    postgres_pool_pre_ping: bool = True

    server_host: str = "0.0.0.0" # noqa: S104
    server_port: int = 8000

    mailer_host: str = 'mailer-mailer-1'
    mailer_port: int = 50051

    auth_host: str = 'auth_service'
    auth_port: int = 50051

    opentelemetry_endpoint: str | None = None
    sentry_dsn: str | None = None
    logging_buffer_capacity: int = 0
    swagger_offline_docs: bool = True

    cors_allowed_origins: list[str] = ['http://localhost:8080']
    cors_allowed_methods: list[str] = ['*']
    cors_allowed_headers: list[str] = ['*']
    cors_exposed_headers: list[str] = []

    request_max_body_size: int = 1024 * 1024  # 1MB лимит

    @property
    def db_dsn(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_name}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_name}"
        )
    
    @property
    def db_dsn_parsed(self) -> URL:
        return make_url(self.db_dsn)

    @property
    def api_bootstrapper_config(self) -> LitestarConfig:
        return LitestarConfig(
            service_name=settings.service_name,
            service_version=settings.service_version,
            service_environment=settings.service_environment,
            service_debug=settings.service_debug,
            opentelemetry_endpoint=settings.opentelemetry_endpoint,
            sentry_dsn=settings.sentry_dsn,
            cors_allowed_origins=settings.cors_allowed_origins,
            cors_allowed_methods=settings.cors_allowed_methods,
            cors_allowed_headers=settings.cors_allowed_headers,
            cors_exposed_headers=settings.cors_exposed_headers,
            logging_buffer_capacity=settings.logging_buffer_capacity,
            swagger_offline_docs=settings.swagger_offline_docs,
        )


settings = Settings() #type: ignore