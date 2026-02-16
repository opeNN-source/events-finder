from langchain_core.tools import BaseTool
from typing import Dict, List, Any
from app.setting import settings
from httpx import AsyncClient, HTTPStatusError, RequestError
from loguru import logger
import asyncio
import json
import ssl
import httpx
import certifi


client = httpx.AsyncClient(
    timeout=10,
    verify=certifi.where()
)

class GoogleSearchApi(BaseTool):
    name: str = "GoogleSearch"
    description: str = "Выполняет поиск в Google по запросу и возвращает результаты"


    #TODO: у
    def _run(self, queries: List[str]) -> List[Dict[str, str]]:
        
        return [{'aboba': 'aasdf'}]

    async def _arun(self, queries: List[str]) -> List[Dict[str, str]]:

        logger.info(f"Запуск GoogleSearchApi tool с queries: {queries}")
        results: List[Dict[str, str]] = []

        for query in queries:
            res = await search_req_retry({
                'q': query,
                'key': settings.search_api_key,
                'cx': settings.cse_id
            })

            if res is None or 'items' not in res:
                continue

            for item in res['items']:
                results.append({
                    'link': item['link'],
                    'description': item['snippet']
                })

        logger.debug('\n' + json.dumps(results, indent=4, ensure_ascii=False))
        return results


async def search_req_retry(params: Dict[str, str]) -> Any:
    for attempt in range(settings.search_atempts):
        logger.debug(f"Попытка подключения к GSA номер {attempt + 1}")
        try:
            res = await client.get(url=settings.search_url, params=params)
            res.raise_for_status()
        except (HTTPStatusError, RequestError) as e:
            logger.error(f"HTTP ошибка: {e}")
        else:
            return res.json()
    return None

    


search = GoogleSearchApi()