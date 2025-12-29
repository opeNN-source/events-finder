from langchain_gigachat.chat_models import GigaChat
from app.setting import settings
from app.core.prompt import prompts, PromptWorker
from typing import List
from langchain_core.tools import BaseTool
from app.logger import logger

gigachat_model = GigaChat(
    credentials=settings.gigachat_api_key,
    model=settings.gigachat_model,
    scope=settings.gigachat_scope,
    timeout=settings.gigachat_timeout,
    verify_ssl_certs=False
)


class LlmService:
    def __init__(self):
        self._llm: GigaChat = gigachat_model
        self.prompt_worker: PromptWorker = prompts


    def bind_tools(self, tools: List[BaseTool]):
        if self._llm:
            self._llm_tools = self._llm.bind_tools(tools=tools)
            logger.debug(f"Добавлено инструментов: {len(tools)}")

llm_service = LlmService()