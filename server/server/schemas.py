from datetime import datetime, time

import pydantic
from pydantic import BaseModel, PositiveInt


class Base(BaseModel):
    model_config = pydantic.ConfigDict(from_attributes=True)


class FormatBase(Base):
    name: str
    description: str | None = None


class FormatCreate(FormatBase):
    pass


class Format(FormatBase):
    id: PositiveInt


class RegionBase(Base):
    name: str


class RegionCreate(RegionBase):
    pass


class Region(RegionBase):
    id: PositiveInt


class CategoryBase(Base):
    name: str


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: PositiveInt


class EventTypeBase(Base):
    name: str
    description: str | None = None


class EventTypeCreate(EventTypeBase):
    pass


class EventType(EventTypeBase):
    id: PositiveInt


class EventBase(Base):
    name: str
    description: str | None = None
    date_start: datetime
    date_end: datetime | None = None
    time_start: time | None = None
    time_end: time | None = None
    format_id: int | None = None
    region_id: int | None = None
    category_id: int | None = None
    event_type_id: int | None = None
    price: float | None = None
    source_url: str | None = None
    organizer_name: str | None = None


class EventCreate(EventBase):
    pass


class Event(EventBase):
    id: PositiveInt
    format: Format | None = None
    region: Region | None = None
    category: Category | None = None
    event_type: EventType | None = None


class Events(Base):
    items: list[Event]


# Схемы для поиска
class SearchParams(BaseModel):
    category: str | None = None
    region: str | None = None
    format: str | None = None
    event_type: str | None = None
    name: str | None = None
    date_start: datetime | None = None
    date_end: datetime | None = None
    price_min: float | None = None
    price_max: float | None = None


# Схемы для конфигурации агента
class AgentConfigBase(Base):
    locations: list[str] = []
    event_types: list[str] = []
    sources: list[str] = []
    honorary_participants: list[str] = []
    custom_queries: list[str] = []


class AgentConfigUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    locations: list[str] | None = None
    event_types: list[str] | None = None
    sources: list[str] | None = None
    honorary_participants: list[str] | None = None
    custom_queries: list[str] | None = None


class AgentConfig(AgentConfigBase):
    id: PositiveInt

# Схема для отправки email с мероприятиями
class SendEmailRequest(BaseModel):
    email: str
    event_ids: list[PositiveInt]

class SendLoginRequest(BaseModel):
    email: str
    password: str

class SendTokenRequest(BaseModel):
    refresh: str

