from pydantic import BaseModel

class Filters(BaseModel):
    locations: list[str]
    event_types: list[str] | None = []
    sources: list[str] | None = []
    category: list[str] 
    honorary_participants: dict[str, list[str]] | None  = {}
    custom_queries: list[str] | None = []