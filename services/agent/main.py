import asyncio

from app.db import Database

from app.setting import settings

from app.schemas.event import EventSchema, Format, EventType
from app.schemas.graph import AgentState
from app.setting import settings
import datetime

from app.core.langgraph.graph import graph

async def main(): 
    print(settings.db_dsn)

    db = Database()
    await db.initialize()

    filters = await db.get_filters()

    print(filters)

    print(settings)

    state = AgentState(
        filter=filters,
        search_requests=[],
        urls=[],       
        site_chunk=[],
        parsed_events=[],
        visited=set(),
        failed_urls=[],
        max_depth=2
    )
    

    state = await graph.ainvoke(state)

    # await db.insert_events([
    #     EventSchema(
    #         name="asdfujhasdf",
    #         description="ssadfsad",
    #         category='IT',
    #         event_format=Format(name='Онлайн', description='sadfgasfg'),
    #         event_type=EventType(name='Конференция', description='aboab'),
    #         date_start=datetime.date(2026, 11, 30),
    #         date_end=datetime.date(2026, 12, 30),
    #         time_start=datetime.time(12, 30),
    #         time_end=datetime.time(14, 30),
    #         region='Москва',
    #         cost=0.0,
    #         source_url='aboba',
    #         organizer_name='triboba',

    #     )
    # ])

    await db.dispose()


if __name__ == '__main__':
    asyncio.run(main()) 
