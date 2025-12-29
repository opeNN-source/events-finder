import typing
from datetime import datetime

import litestar
from sqlalchemy import and_, orm

from server import models, repositories, schemas


@litestar.get('/search')
async def search_events(
    events_service: repositories.EventsService,
    category: str | None = None,
    region: str | None = None,
    format: str | None = None,
    event_type: str | None = None,
    name: str | None = None,
    date_start: datetime | None = None,
    date_end: datetime | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
) -> schemas.Events:
    """Поиск мероприятий по фильтрам.

    Args:
        category: Название категории (например, "IT", "Бизнес")
        region: Название региона (например, "Москва", "Нижний Новгород")
        format: Название формата (например, "Онлайн", "Офлайн", "Гибрид")
        event_type: Название типа (например, "Конференция", "Митап", "Воркшоп")
        name: Название мероприятия (частичное совпадение, регистронезависимый поиск)
        date_start: Начальная дата фильтра
        date_end: Конечная дата фильтра
        price_min: Минимальная цена
        price_max: Максимальная цена

    Returns:
        Список мероприятий, соответствующих фильтрам
    """
    filters = []

    if category is not None:
        filters.append(models.Event.category.has(models.Category.name == category))

    if region is not None:
        filters.append(models.Event.region.has(models.Region.name == region))

    if format is not None:
        filters.append(models.Event.format.has(models.Format.name == format))

    if event_type is not None:
        filters.append(models.Event.event_type.has(models.EventType.name == event_type))

    if name is not None:
        filters.append(models.Event.name.ilike(f'%{name}%'))

    if date_start is not None:
        filters.append(models.Event.date_start >= date_start)

    if date_end is not None:
        filters.append(models.Event.date_start <= date_end)

    if price_min is not None:
        filters.append(models.Event.price >= price_min)

    if price_max is not None:
        filters.append(models.Event.price <= price_max)

    objects = await events_service.list(
        *filters,
        auto_expunge=True,
        load=[
            orm.selectinload(models.Event.format),
            orm.selectinload(models.Event.region),
            orm.selectinload(models.Event.category),
            orm.selectinload(models.Event.event_type),
        ],
    )

    return schemas.Events(items=objects)  # type: ignore[arg-type]


ROUTER: typing.Final = litestar.Router(
    path='/api',
    route_handlers=[search_events],
)
