from langchain_core.tools import BaseTool
from typing import Dict, List, Any
from loguru import logger
from ddgs import DDGS
import asyncio
import json


# Приоритетные сайты — обрабатываются первыми
_PRIORITY_SITES = [
    "https://www.it52.info/events",
]

# Дополнительные шаблоны запросов для улучшения покрытия DDG
_QUERY_STRATEGIES = [
    "{query} 2025 2026",
    "{query} расписание",
    "{query} site:timepad.ru OR site:leader-id.ru OR site:events.yandex.ru",
    "{query} афиша календарь",
]


class DuckDuckGoSearchApi(BaseTool):
    name: str = "DuckDuckGoSearch"
    description: str = "Выполняет поиск в DuckDuckGo по запросу и возвращает результаты"

    def _run(self, queries: List[str]) -> List[Dict[str, str]]:
        return []

    async def _arun(self, queries: List[str]) -> List[Dict[str, str]]:
        logger.info(f"Запуск DuckDuckGoSearch с queries: {queries}")
        results: List[Dict[str, str]] = []
        seen_links: set = set()

        # Сначала добавляем приоритетные сайты
        for url in _PRIORITY_SITES:
            if url not in seen_links:
                seen_links.add(url)
                results.append({"link": url, "description": "приоритетный источник"})

        expanded = []
        for q in queries:
            expanded.append(q)
            for tpl in _QUERY_STRATEGIES:
                expanded.append(tpl.format(query=q))

        ddgs = DDGS()
        for query in expanded:
            try:
                hits = ddgs.text(
                    query,
                    region="ru-ru",
                    max_results=10,
                )
            except Exception as exc:
                logger.warning(f"DDG ошибка для '{query}': {exc}")
                continue

            for item in hits:
                link = item.get("href", "")
                if not link or link in seen_links:
                    continue
                seen_links.add(link)
                results.append({
                    "link": link,
                    "description": item.get("body", ""),
                })

            # Пауза между запросами, чтобы DDG не заблокировал
            await asyncio.sleep(1.0)

        logger.info(f"DDG: получено {len(results)} уникальных результатов")
        logger.debug("\n" + json.dumps(results[:10], indent=4, ensure_ascii=False))
        return results


search = DuckDuckGoSearchApi()
