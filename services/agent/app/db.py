import logging
import typing

from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncEngine, create_async_engine, AsyncSession
from sqlalchemy import select, func

import app.repository as repo
from app.setting import settings
import app.model as model
from app.schemas.agent_conf import Filters
from app.schemas.event import EventSchema, EventModel

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, ):
        self._dsn = settings.db_dsn
        self._engine: AsyncEngine | None = None
        self._session_factory: async_sessionmaker | None = None

    async def initialize(self) -> None:
        """Вызывается один раз при старте приложения"""
        if self._engine is not None:
            return

        self._engine = create_async_engine(
            self._dsn,
        )

        self._session_factory = async_sessionmaker(
            self._engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )

    async def dispose(self) -> None:
        """Вызывается при остановке приложения"""
        if self._engine is not None:
            await self._engine.dispose()
            self._engine = None
            self._session_factory = None

    
    async def _session(self) -> typing.AsyncGenerator[AsyncSession, None]:
        """Используется как зависимость или в async with"""
        if self._session_factory is None:
            raise RuntimeError("Database not initialized")

        async with self._session_factory() as session:
            yield session

    async def _get_session(self) -> AsyncSession:
        """Если нужен просто объект сессии без async with"""
        if self._session_factory is None:
            raise RuntimeError("Database not initialized")
        return self._session_factory()
    
    async def get_filters(self) -> Filters:
        async with await self._get_session() as session:
            config_repo = repo.AgentConfigRepository(session=session)
            category_repo = repo.CategoriesRepository(session=session)
            region_repo = repo.RegionsRepository(session=session)

            configs = await config_repo.list(auto_expunge=True)
            categories = await category_repo.list(auto_expunge=True)

            category_names = [category.name for category in categories]

            if not configs:
                regions = await region_repo.list(auto_expunge=True)
                return Filters(
                    locations=[region.name for region in regions],
                    category=category_names,
                )

            config = configs[0]

            if not config.locations:
                regions = await region_repo.list(auto_expunge=True)
                locations = [region.name for region in regions]
            else:
                locations = config.locations

            return Filters(
                locations=locations,
                event_types=config.event_types,
                sources=config.sources,
                honorary_participants=config.honorary_participants,
                custom_queries=config.custom_queries,
                category=category_names,
            )


    async def insert_events(self, events: list[EventSchema]):
        async with await self._get_session() as session:
            event_service = repo.EventsService(session=session)
            category_repo = repo.CategoriesRepository(session=session)
            format_repo = repo.FormatsRepository(session=session)
            event_type_repo = repo.EventTypesRepository(session=session)
            region_repo = repo.RegionsRepository(session=session)

            for e in events:
                category = await category_repo.get_one_or_none(
                    func.lower(model.Category.name) == e.category.lower(),
        
                    auto_expunge=True,
                )

                if category is None:
                    logger.warning(f"категория не найдена: '{e.category}', пропуск: {e.name}")
                    continue

                format = await format_repo.get_one_or_none(
                    func.lower(model.Format.name) == e.event_format.name.lower(),

                    auto_expunge=True,
                )

                if format is None:
                    logger.warning(f"формат не найден: '{e.event_format.name}', пропуск: {e.name}")
                    continue

                event_type = await event_type_repo.get_one_or_none(
                    func.lower(model.EventType.name) == e.event_type.name.lower(),

                    auto_expunge=True
                )

                if event_type is None:
                    logger.warning(f"тип события не найден: '{e.event_type.name}', пропуск: {e.name}")
                    continue

                region = await region_repo.get_one_or_none(
                    func.lower(model.Region.name) == e.region.lower(),
                    auto_expunge=True,
                )

                if region is None:
                    logger.warning(f"регион не найден: '{e.region}', пропуск: {e.name}")
                    continue

                e_model = EventModel(
                    name=e.name,
                    descripteion=e.description,
                    date_start=e.date_start,
                    date_end=e.date_end,
                    time_start=e.time_start,
                    time_end=e.time_end,
                    format_id=format.id,
                    category_id=category.id,
                    event_type_id=event_type.id,
                    region_id=region.id,
                    price=e.cost,
                    source_url=e.source_url,
                    organizer_name=e.organizer_name,
                )
                
                date = e_model.model_dump()

                created_event = await event_service.create(
                    date, 
                    auto_commit=True,
                    auto_expunge=True,
                )

            return 
                    

    