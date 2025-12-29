from pydantic import BaseModel, Field
from typing import Dict, List
from app.domain.event import EventSchema


class AgentState(BaseModel):
    filter: Dict[str, List[str]]
    search_requests: List[str]
    urls: List[tuple]
    site_chunk: List[str]
    parsed_events: List[EventSchema]
    visited: set 
    failed_urls: List[str]
    max_depth: int = 2