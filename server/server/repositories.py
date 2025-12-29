from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService

from server import models


class EventsRepository(SQLAlchemyAsyncRepository[models.Event]):
    model_type = models.Event


class EventsService(SQLAlchemyAsyncRepositoryService[models.Event]):
    repository_type = EventsRepository


class FormatsRepository(SQLAlchemyAsyncRepository[models.Format]):
    model_type = models.Format


class FormatsService(SQLAlchemyAsyncRepositoryService[models.Format]):
    repository_type = FormatsRepository


class RegionsRepository(SQLAlchemyAsyncRepository[models.Region]):
    model_type = models.Region


class RegionsService(SQLAlchemyAsyncRepositoryService[models.Region]):
    repository_type = RegionsRepository


class CategoriesRepository(SQLAlchemyAsyncRepository[models.Category]):
    model_type = models.Category


class CategoriesService(SQLAlchemyAsyncRepositoryService[models.Category]):
    repository_type = CategoriesRepository


class EventTypesRepository(SQLAlchemyAsyncRepository[models.EventType]):
    model_type = models.EventType


class EventTypesService(SQLAlchemyAsyncRepositoryService[models.EventType]):
    repository_type = EventTypesRepository


class AgentConfigRepository(SQLAlchemyAsyncRepository[models.AgentConfig]):
    model_type = models.AgentConfig


class AgentConfigService(SQLAlchemyAsyncRepositoryService[models.AgentConfig]):
    repository_type = AgentConfigRepository
