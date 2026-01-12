import typing

import litestar

from server import repositories, schemas


@litestar.get('/agent/config')
async def get_agent_config(
    agent_config_service: repositories.AgentConfigService,
) -> schemas.AgentConfig | None:
    """Получить текущую конфигурацию агента.
    
    Если конфигурация не существует, возвращается None.

    Returns:
        Конфигурация агента или None
    """
    configs = await agent_config_service.list(auto_expunge=True)
    
    if not configs:
        return None
    
    return schemas.AgentConfig.model_validate(configs[0])

@litestar.post('/agent/config')
async def save_agent_config(
    agent_config_service: repositories.AgentConfigService,
    data: schemas.AgentConfigBase,
) -> schemas.AgentConfig:
    """Сохранить конфигурацию агента.
    
    Если конфигурация не существует, создается новая.
    Если существует, обновляется текущая.

    Args:
        data: Полная конфигурация агента

    Returns:
        Сохраненная конфигурация агента
    """
    configs = await agent_config_service.list(auto_expunge=True)

    config_data = data.model_dump()

    if not configs:
        config = await agent_config_service.create(
            config_data,
            auto_commit=True,
            auto_expunge=True,
        )
    else:
        config = await agent_config_service.update(
            item_id=configs[0].id,
            data=config_data,
            auto_commit=True,
            auto_expunge=True,
        )
    
    return schemas.AgentConfig.model_validate(config)



ROUTER: typing.Final = litestar.Router(
    path='/api',
    route_handlers=[
        get_agent_config,
        save_agent_config,
    ],
)
