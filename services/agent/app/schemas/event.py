from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import date, time
from typing import List , Optional

class EventType(BaseModel):
    name: str = Field(
        description="Тип проводимого мероприятия. Примеры: Конференция, Воркшоп, Митап, Вебинар, Конкурс, Форум, Саммит, Хакатон, Фестиваль"
    )

    description: str = Field(
        description="Описание типа ивента"
    )

class Format(BaseModel):
    name: str = Field(
        description="Формат проведения мероприятия. Примеры: Онлайн, Офлайн, Гибрид"
    )

    description: str = Field(
        description="Описание формата ивента"
    )


class EventSchema(BaseModel):
    name: str = Field(
        description="Полное название или заголовок мероприятия."
    )

    description: str = Field(
        description="Подробное описание мероприятия, его цели и программы."
    )

    category: str = Field(
        description = "Категория мероприятия по направлению ИТ, бизнес, образование, профессиональные сообщества ИТ, дизайн, GR"
    )

    event_format: Format

    event_type: EventType
    
    date_start: date = Field(
        description=(
            "Дата начала мероприятия в формате YYYY-MM-DD."\
            "КРИТИЧЕСКИ ВАЖНО: ДЕНЬ НЕ МОЖЕТ БЫТЬ 0 (например, '2025-11-00' — НЕВЕРНО)."\
            "ДЕНЬ ДОЛЖЕН НАЧИНАТЬСЯ С 01. (Например, '2025-11-01' или '2025-11-15' — ВЕРНО)."\
            )
    )

    date_end: date = Field( 
          description=(
            "Дата конца мероприятия в формате YYYY-MM-DD."\
            "КРИТИЧЕСКИ ВАЖНО: ДЕНЬ НЕ МОЖЕТ БЫТЬ 0 (например, '2025-11-00' — НЕВЕРНО)."\
            "ДЕНЬ ДОЛЖЕН НАЧИНАТЬСЯ С 01. (Например, '2025-11-01' или '2025-11-15' — ВЕРНО)."\
            )
    )

    time_start: time = Field(
        default=time(0, 0, 0), 
        description="Время начала мероприятия в формате HH:MM:SS."
    )

    time_end: time = Field(
        default=time(0, 0, 0), 
        description="Время окончания мероприятия в формате HH:MM:SS."
    )

    
    region: str = Field(
        description="Регион в котором проходит мероприятие. Пример: Москва, Санкт-Петербург"
    )
    
    cost: float = Field(
        default=0.0, 
        description="Стоимость участия или билета. Используй 0.0, если мероприятие бесплатное."
    )

    source_url: str = Field(
        description="Исходная ссылка на страницу, откуда была взята информация о мероприятии."
    )
    
    organizer_name: str = Field(
        description="Название компании или имя человека, организующего мероприятие."
    )



class ParsingResult(BaseModel):
    """
    Обязательное описание: Это корневой объект, используемый для структурированного 
    извлечения и хранения всей информации о найденных в интернете IT-мероприятиях.
    """
    events: List[EventSchema] = Field(default=[], description="Список всех найденных уникальных мероприятий, где каждое мероприятие уже содержит вложенные данные о спикерах, компаниях и источнике.")

class EventModel(BaseModel):
    name: str
    descripteion: str

    date_start: date
    date_end: date

    time_start: time
    time_end: time

    format_id: int
    region_id: int
    category_id: int
    event_type_id: int
    
    price: float

    source_url: str
    
    organizer_name: str
