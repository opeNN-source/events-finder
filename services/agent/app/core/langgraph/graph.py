from app.service.llm import llm_service
from app.core.langgraph.tool import tools
from app.core.prompt import prompts
from app.logger import logger
from langgraph.graph.state import CompiledStateGraph
from langgraph.graph import StateGraph, END
from app.schemas.graph import AgentState, UrlSchema, PageClassification, AggregatorLinks
from langchain_core.messages import SystemMessage, HumanMessage
from typing import List, cast
import httpx
import certifi
import trafilatura

from langchain_core.runnables import RunnableConfig
from langchain.prompts import ChatPromptTemplate

from app.schemas.event import EventSchema, ParsingResult
from typing import Optional
import urllib.parse
from app.core.langgraph.tool.google_search_api import search
import json


_http_client = httpx.AsyncClient(timeout=15, verify=certifi.where())


class LangGraphAgent:
    def __init__(self, db=None, max_queue=1000, max_new_per_page=50) -> None:
        self.llm_service = llm_service
        llm_service.bind_tools(tools=tools)
        self.tools_by_name = {tool.name: tool for tool in tools}
        self.max_queue = max_queue
        self.max_new_per_page = max_new_per_page
        self.db = db
        self._graph: CompiledStateGraph 
    
    def create_graph(self) -> CompiledStateGraph:
        graph_builder = StateGraph(AgentState)

        graph_builder.add_node("req_search", self._create_search_request)
        graph_builder.add_node("search_api", self._request_search_api)
        graph_builder.add_node("process_page", self._process_page)

        graph_builder.set_entry_point("req_search")
        graph_builder.add_edge('req_search', 'search_api')
        graph_builder.add_edge('search_api', 'process_page')

        graph_builder.add_conditional_edges(
            'process_page',
            self._condition_continue,
            {
                'next': 'process_page',
                'end': END
            }
        )

        graph = graph_builder.compile()
        return graph
    
    def _create_search_request(self, state: AgentState) -> AgentState:
        for domain in state.filter.category:
            for location in state.filter.locations:
                q = f"{domain} мероприятия {location}"
                state.search_requests.append(q)

        logger.info(
            f"список запросов к search {state.search_requests}"
        )

        return state
    
    async def _request_search_api(self, state: AgentState) -> AgentState:
        if not state.search_requests:
            return state

        try: 
            resp = await search._arun(state.search_requests)

            if resp:
                urls = [item['link'] for item in resp if 'link' in item]
                url_schema = UrlSchema(urls=urls)
                state.urls.append(url_schema)

            logger.info(f"Получено {len(resp)} результатов поиска")

        except Exception as exc:
            logger.warning(f"LLM search error: {exc}")
            return state
        
        return state
    
    async def _process_page(self, state: AgentState) -> AgentState:
        """Скачивает, классифицирует и сразу извлекает данные из страницы."""
        if not state.urls:
            return state

        url_schema = state.urls[0]
        if not url_schema.urls:
            state.urls.pop(0)
            return state

        url = str(url_schema.urls.pop(0))
        if not url_schema.urls:
            state.urls.pop(0)

        if url in state.visited:
            return state
        state.visited.add(url)

        if not self._is_relevant(url):
            state.skipped_urls.append(url)
            return state

        try:
            resp = await _http_client.get(url, follow_redirects=True)
            resp.raise_for_status()
            html = resp.text
        except Exception as exc:
            logger.warning(f"не удалось скачать {url}: {exc}")
            state.failed_urls.append(url)
            return state

        text = trafilatura.extract(html) or ""

        if not text or len(text) < 50:
            logger.info(f"пустой контент, пропускаю: {url}")
            state.skipped_urls.append(url)
            return state

        # Классификация
        preview = text[:1500]
        classify_prompt = prompts.get_prompt("classify_page.md")
        llm_classify = self.llm_service._llm.with_structured_output(PageClassification)
        try:
            result = llm_classify.invoke([
                SystemMessage(classify_prompt),
                HumanMessage(f"Текст страницы ({url}):\n\n{preview}")
            ])
            classification = cast(PageClassification, result)
        except Exception as exc:
            logger.warning(f"ошибка классификации {url}: {exc}")
            classification = PageClassification(page_type="event", reason="ошибка классификации, пропускаем в парсинг")

        if classification.page_type == "other":
            logger.info(f"не страница мероприятия: {url} — {classification.reason}")
            state.skipped_urls.append(url)
            return state

        if classification.page_type == "aggregator":
            logger.info(f"страница-агрегатор: {url} — {classification.reason}")
            new_links = self._extract_aggregator_links(html, url)
            if new_links:
                fresh = [l for l in new_links if l not in state.visited]
                if fresh:
                    state.urls.append(UrlSchema(urls=fresh))
                    logger.info(f"извлечено {len(fresh)} ссылок с агрегатора {url}")
            return state

        # event — сразу извлекаем мероприятия
        logger.info(f"страница мероприятия: {url} — {classification.reason}")
        parsed_events = self.extract_event_data(text, url)
        if parsed_events and isinstance(parsed_events, list):
            state.parsed_events.extend(parsed_events)
            logger.info(f"извлечено {len(parsed_events)} мероприятий из {url}")
            if self.db:
                try:
                    await self.db.insert_events(parsed_events)
                    logger.info(f"сохранено {len(parsed_events)} мероприятий в БД из {url}")
                except Exception as exc:
                    logger.warning(f"ошибка сохранения в БД: {exc}")
        else:
            logger.warning(f"LLM не смогла структурировать {url}")

        return state

    def _condition_continue(self, state: AgentState) -> str:
        """Проверяем есть ли ещё URL для обработки."""
        for url_schema in state.urls:
            for u in url_schema.urls:
                if str(u) not in state.visited:
                    return 'next'
        return 'end'

    def extract_event_data(self, text: str, url: str) -> Optional[List[EventSchema]]:
        extract_prompt = prompts.get_prompt("extract_events.md").replace("{source_url}", url)
        llm = self.llm_service._llm.with_structured_output(ParsingResult)

        try:
            result = llm.invoke(
                [
                    SystemMessage(extract_prompt),
                    HumanMessage(f"Текст страницы:\n\n{text}")
                ]
            )
            return cast(ParsingResult, result).events
        except Exception as exc:
            logger.warning(f"Ошибка при структурированном выводе LLM: {exc}")
            return None
    
    def _is_relevant(self, url: str) -> bool:
        bad_ext = (".jpg", ".jpeg", ".png", ".gif", ".pdf", ".zip")
        if url.lower().endswith(bad_ext):
            return False
        return True

    def _extract_aggregator_links(self, html: str, base_url: str) -> List[str]:
        """Извлекает ссылки на мероприятия со страницы-агрегатора."""
        import re

        # Извлекаем <a> теги из HTML
        raw_links = re.findall(r'<a\s[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)
        if not raw_links:
            return []

        # Резолвим относительные URL и убираем дубликаты
        seen = set()
        link_entries = []
        for href, text in raw_links:
            url = urllib.parse.urljoin(base_url, href)
            if url in seen or not url.startswith("http"):
                continue
            seen.add(url)
            clean_text = re.sub(r'\s+', ' ', text.strip())[:100]
            if clean_text:
                link_entries.append(f"{url} | {clean_text}")

        if not link_entries:
            return []

        # Отдаём LLM список ссылок для фильтрации
        extract_prompt = prompts.get_prompt("extract_links.md").replace("{base_url}", base_url)
        llm_links = self.llm_service._llm.with_structured_output(AggregatorLinks)

        links_text = "\n".join(link_entries[:200])
        try:
            result = llm_links.invoke([
                SystemMessage(extract_prompt),
                HumanMessage(f"Ссылки со страницы-агрегатора ({base_url}):\n\n{links_text}")
            ])
            parsed = cast(AggregatorLinks, result)
            return parsed.links[:self.max_new_per_page] if parsed.links else []
        except Exception as exc:
            logger.warning(f"ошибка извлечения ссылок с агрегатора {base_url}: {exc}")
            return []


def create_graph(db=None) -> CompiledStateGraph:
    return LangGraphAgent(db=db).create_graph()

