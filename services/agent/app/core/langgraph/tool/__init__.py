from .duckduckgo_search import search
from typing import List
from langchain_core.tools import BaseTool

tools: List[BaseTool] = [search]