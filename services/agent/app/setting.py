from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import env_settings

class Settings(BaseSettings):
    service_name: str = 'Events Ai-agent'
    service_version: str = '1.0.0'
    service_env: str = 'local'
    service_debug: bool = True

    log_msg: str = ""
    log_format: str = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | {message}"
    log_level: str = 'DEBUG'

    grpc_host: str = 'localhost'
    grpc_port: int = 50051
    grpc_max_workers: int = 10
    grpc_use_tls: bool = False
    grpc_tls_cert_file: str = ''
    grpc_tls_key_file: str = ''
    grpc_keepalive_time_ms: int = 10000   # проверка живости соединений каждые 10 секунд
    grpc_keepalive_timeout_ms: int = 5000 # таймаут ответа на keepalive
    grpc_max_message_length: int = 4 * 1024 * 1024  # 4MB

    gigachat_api_key: str = ''
    gigachat_scope: str = 'GIGACHAT_API_PERS'
    gigachat_model: str = 'GigaChat-2'
    gigachat_timeout: int = 10 
    prompt_dir: str = 'prompt'

    search_api_key: str = ''
    cse_id: str = ''
    search_url: str = 'https://www.googleapis.com/customsearch/v1'
    search_lang: str = 'lang_ru'
    search_atempts: int = 4
    search_atempts_timeout: int = 5
    search_request_timeout: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

settings = Settings()
print(settings)
