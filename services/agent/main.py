import asyncio

from app.db import Database

from app.setting import settings

from app.schemas.event import EventSchema, Format, EventType
from app.schemas.graph import AgentState
from app.setting import settings
import datetime

from app.core.langgraph.graph import create_graph

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
        parsed_events=[],
        visited=set(),
        failed_urls=[],
        skipped_urls=[],
        max_depth=2
    )

    graph = create_graph(db=db)

    try:
        await graph.ainvoke(state, config={"recursion_limit": 500})
    except Exception as exc:
        print(f"Граф завершён с ошибкой: {exc}")

    await db.dispose


if __name__ == '__main__':
    asyncio.run(main())
