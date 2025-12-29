from .google_search_api import search
from typing import List
from langchain_core.tools import BaseTool

tools: List[BaseTool] = [search]