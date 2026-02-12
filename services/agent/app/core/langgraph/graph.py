from app.service.llm import llm_service
from app.core.langgraph.tool import tools
from app.logger import logger
from langgraph.graph.state import CompiledStateGraph
from langgraph.graph import StateGraph
from app.schemas.graph import AgentState
from langchain_core.messages import SystemMessage, HumanMessage
from typing import List, cast
import requests

from langchain_core.runnables import RunnableConfig

from langchain.agents import initialize_agent, AgentType
from langchain.prompts import ChatPromptTemplate

from app.schemas.event import EventSchema, ParsingResult
from typing import Optional
import urllib.parse
from app.core.langgraph.tool.google_search_api import search
import json


class LangGraphAgent:
    def __init__(self, max_queue=1000, max_new_per_page=50) -> None:
        self.llm_service = llm_service
        llm_service.bind_tools(tools=tools)
        self.tools_by_name = {tool.name: tool for tool in tools}
        self.max_queue = max_queue
        self.max_new_per_page = max_new_per_page
        self._graph: CompiledStateGraph 
    
    def create_graph(self) -> CompiledStateGraph:
        graph_builder = StateGraph(AgentState)

        graph_builder.add_node("req_search", self._create_search_request)
        graph_builder.add_node("search_api", self._request_search_api)
        graph_builder.add_node("parse_html", self._parse_html)

        graph_builder.set_entry_point("req_search")
        graph_builder.add_edge('req_search', 'search_api')
        # graph_builder.add_edge('search_api', 'parse_html')

        # graph_builder.add_conditional_edges(
        #     'parse_html',
        #     self._condition_parse,
        #     {
        #         'next': 'parse_html',
        #         'end': END
        #     }
        # )

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
        print(state.search_requests)
        # llm_url_schema = self.llm_service._llm.with_structured_output(UrlSchema)

        try: 
            # response = await self.llm_service._llm_tools.ainvoke(
            #     [
            #         SystemMessage(
            #             "Ты AI помощник агента, который использует GoogleSearch** для получения ссылок по запросам. \
            #         Ты должен: \
            #             1. Искать только ссылки, релевантные описанию/фильтрам запроса. \
            #             2. Убирать дубликаты ссылок. \
            #             3. Отдавать результат в виде списка уникальных полных URL без лишнего текста. \
            #             4. Игнорировать нерелевантные сайты и посторонние материалы. \
            #             Формат вывода — только список ссылок, по одной на строку, без дополнительных комментариев."
            #         ),

            #         HumanMessage("Мне нужны ссылки которые ведут на меропирятия. Используй search tool для получения ссылок для парсинга" + ' '.join(state.search_requests))
            #     ]
            # )
            resp = await search._arun(state.search_requests[:1])

            

            logger.info(resp)

        except Exception as exc:
            logger.warning(f"LLM search error: {exc}")
            return state
        
        return state
    
    def _condition_parse(self, state: AgentState) -> str:
        if len(state.urls) == 0:
            return 'end'
        else:
            return 'next'

    def extract_event_data(self, chunks: List[str], url: str) -> Optional[List[EventSchema]]:
        llm = self.llm_service._llm.with_structured_output(ParsingResult)

        try:
            result = llm.invoke(
                [
                    SystemMessage(
                        f"""
    Ты извлекаешь данные о мероприятиях из текста HTML.
    Возвращай строго объект **ParsingResult**, в котором заполняешь мероприятиями поле **events** по схеме **EventSchema**.

    source_url всегда должен быть: {url}

    Если данные отсутствуют — ставь:
    - пустые строки для description, organizer_name и т.п.
    - 0.0 для cost
    - "2000-01-01" для дат
    - "00:00:00" для времени
                        """
                    ),
                    HumanMessage("Вот чанки текста:\n\n" + "\n\n".join(chunks))
                ]
            )
            return cast(ParsingResult, result).events
        except Exception as exc:
            logger.warning(f"Ошибка при структурированном выводе LLM: {exc}")
            return None
    
    def _is_relevant(self, url: str) -> bool:
        # Пример: только страницы мероприятий
        bad_ext = (".jpg", ".jpeg", ".png", ".gif", ".pdf", ".zip")
        if url.lower().endswith(bad_ext):
            return False
        return True

    def _parse_html(self, state: AgentState) -> AgentState:
        if not state.urls:
            return state

        # достаем url + depth
        url, depth = state.urls.pop(0)

        if url in state.visited:
            return state
        state.visited.add(url)

        logger.info(f"обрабатываю: {url} | глубина {depth}")

        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            html = resp.text
        except Exception as exc:
            logger.warning(f"невозможно скачать {url}: {exc}")
            state.failed_urls.append(url)
            return state

        soup = BeautifulSoup(html, "html.parser")

        text = soup.get_text(" ", strip=True)
        chunk_size = 2000
        chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
        state.site_chunk = chunks

        logger.info(
            "нарезал html на чанки",
            {"url": url, "chunks": len(chunks)}
        )

        parsed_event = self.extract_event_data(chunks, url)
        if parsed_event and isinstance(parsed_event, list):
            state.parsed_events.extend(parsed_event)
        else:
            logger.warning(f"LLM не смогла структурировать {url}")

        # Лимит глубины
        if depth >= state.max_depth:
            logger.info(f"достигнут лимит глубины на {url}, ссылки дальше не собираю")
            return state

        # Рекурсивный обход
        new_links = []
        for tag in soup.find_all("a"):
            href = tag.get("href")
            if not href or not isinstance(href, str):
                continue

            full = urllib.parse.urljoin(url, href)

            if self._is_relevant(full) and full not in state.visited:
                new_links.append(full)

        if new_links:
            logger.info(f"нашел {len(new_links)} новых ссылок на {url}")
            next_depth = depth + 1
            for link in new_links:
                state.urls.append((link, next_depth))

        return state



graph = LangGraphAgent().create_graph()

