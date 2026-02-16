from app.setting import settings 
from typing import Dict, List
import os
from loguru import logger 
from pathlib import Path


def load_file(file: str, promtp_dir: str) -> str:
    file_path = os.path.join(promtp_dir, file)

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except (FileNotFoundError, PermissionError, UnicodeDecodeError, Exception) as e:
        logger.error(f"Не удалось прочитать файл {file_path}: {e}")
        return ""


class PromptWorker:
    def __init__(self):
        self.prompt_dir = settings.prompt_dir
        self.prompts: Dict[str, str] = {}
        self.files: List[str] 
        self.load_prompts()

    def _load_file_name(self):
        prompt_dir = Path(self.prompt_dir)

        try:
            self.files = [
                    f.name                                          
                    for f in prompt_dir.iterdir()                   
                    if f.is_file() and f.suffix == ".md"            
            ]       
        except (PermissionError, OSError) as e:
            logger.error(f"Не удалось прочитать папку с промптами {prompt_dir}: {e}")
        
        logger.info(f"Найдено {len(self.files)} .md-файлов в {self.prompt_dir}") 

    def load_prompts(self):
        self._load_file_name()

        self.prompts.clear()

        for filename in self.files:
            content = load_file(filename, self.prompt_dir)
            if content == "":
                continue 

            self.prompts[filename] = content
            logger.debug(f"Загружен промпт: {filename}") 

        logger.info(f"Успешно загружено {len(self.prompts)} промптов")  
                    

    def reload_by_name(self, name: str) -> bool:
        content = load_file(name, self.prompt_dir)

        if content == "":
            if name in self.prompts:
                logger.info(f"Промпт {name} удалён")
                self.prompts.pop(name, None)
            return False

        self.prompts[name] = content
        logger.info(f"Перезагружен промпт: {name}")
        return True 

    def get_prompt(self, name: str) -> str:
        if name not in self.prompts:
            if self.reload_by_name(name):
                logger.info(f"Промпт {name} подгружен во время выполнения")
            else:
                raise KeyError(f"Промпт {name} не найден и не удалось его загрузить")

        return self.prompts[name]
    
    def list_prompts(self):
        return sorted(self.prompts.keys())


prompts = PromptWorker()
logger.info(f"PromptWorker инициализирован. Папка: {prompts.prompt_dir}")
logger.info(f"Загружено промптов: {len(prompts.prompts)} → {prompts.list_prompts()}")
