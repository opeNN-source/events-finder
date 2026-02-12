from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import Dict, List, Literal, Tuple
from app.schemas.event import EventSchema

from app.schemas import agent_conf

class UrlSchema(BaseModel):
    urls: list[HttpUrl]
    
    @field_validator("urls")
    @classmethod
    def no_file_links(cls, values: list[HttpUrl]) -> list[HttpUrl]:
        forbidden_ext = (".pdf", ".jpg", ".png", ".zip", ".doc", ".xlsx")
        
        valid_values = []

        for url in values:
            if url.path is not None and url.path.lower().endswith(forbidden_ext):
                continue
            valid_values.append(url)
        
        return valid_values


class PageClassification(BaseModel):
    """Результат классификации страницы."""
    page_type: Literal["event", "aggregator", "other"] = Field(
        description="Тип страницы: 'event' — конкретное мероприятие, 'aggregator' — каталог/список мероприятий со ссылками, 'other' — нерелевантная страница"
    )
    reason: str = Field(description="Краткое обоснование решения")


class AggregatorLinks(BaseModel):
    """Ссылки на мероприятия, извлечённые со страницы-агрегатора."""
    links: List[str] = Field(default=[], description="Список URL-адресов, ведущих на отдельные страницы мероприятий")


class AgentState(BaseModel):
    filter: agent_conf.Filters
    search_requests: List[str]
    urls: List[UrlSchema]
    parsed_events: List[EventSchema]
    visited: set 
    failed_urls: List[str]
    skipped_urls: List[str]
    max_depth: int = 2

