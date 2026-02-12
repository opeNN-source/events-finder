from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import Dict, List
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

class AgentState(BaseModel):
    filter: agent_conf.Filters
    search_requests: List[str]
    urls: List[UrlSchema]
    site_chunk: List[str]
    parsed_events: List[EventSchema]
    visited: set 
    failed_urls: List[str]
    max_depth: int = 2

