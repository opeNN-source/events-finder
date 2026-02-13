from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import env_settings
from sqlalchemy.engine.url import URL, make_url

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore',
    )

    service_name: str = 'Events Ai-agent'
    service_version: str = '1.0.0'
    service_env: str = 'local'
    service_debug: bool = True

    log_msg: str = ""
    log_format: str = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | {message}"
    log_level: str = 'DEBUG'

    postgres_name: str = 'server'
    postgres_user: str = 'server'
    postgres_password: str = 'server'
    postgres_host: str = '0.0.0.0'
    postgres_port: int = 5012
    postgres_pool_size: int = 5
    postgres_max_overflow: int = 0
    postgres_pool_pre_ping: bool = True

    @property
    def db_dsn(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_name}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_name}"
        )

    @property
    def db_dsn_parsed(self) -> URL:
        return make_url(self.db_dsn)

    gigachat_api_key: str = ''
    gigachat_scope: str = 'GIGACHAT_API_PERS'
    gigachat_model: str = 'GigaChat-2'
    gigachat_timeout: int = 60
    prompt_dir: str = 'prompt'

    search_api_key: str = ''
    cse_id: str = ''
    search_url: str = 'https://www.googleapis.com/customsearch/v1'
    search_lang: str = 'lang_ru'
    search_atempts: int = 1
    search_atempts_timeout: int = 5
    search_request_timeout: int = 10


settings = Settings()
