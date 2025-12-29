from loguru import logger
from app.setting import settings

logger.remove()

logger.add(
    sink=lambda msg: print(msg, settings.log_level), 
    level=settings.log_level,
    colorize=True,  
    format=settings.log_format
)

