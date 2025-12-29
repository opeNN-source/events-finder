import typing
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import litestar
from litestar import status_codes
from sqlalchemy import orm

from server import models, repositories, schemas


# Локальное хранилище конфигурации агента
_agent_config: schemas.AgentConfigBase | None = None


@litestar.get('/agent/config')
async def get_agent_config() -> schemas.AgentConfigBase | None:
    """Получить текущую конфигурацию агента.
    
    Если конфигурация не существует, возвращается None.

    Returns:
        Конфигурация агента или None
    """
    return _agent_config

@litestar.post('/agent/config')
async def save_agent_config(
    data: schemas.AgentConfigBase,
) -> schemas.AgentConfigBase:
    """Сохранить конфигурацию агента.
    
    Конфигурация сохраняется локально в памяти.

    Args:
        data: Полная конфигурация агента

    Returns:
        Сохраненная конфигурация агента
    """
    global _agent_config
    _agent_config = data
    return _agent_config


ROUTER: typing.Final = litestar.Router(
    path='/api',
    route_handlers=[
        get_agent_config,
        save_agent_config,
    ],
)
