/*
Этот файл используется для инициализации схемы базы данных для разработки локально.

Примечание: 
- База данных и пользователь создаются автоматически из .env файла
- Этот скрипт только создаёт таблицы и начальные данные
- ТОЛЬКО для разработки
*/

/*
Форматы мероприятий
(онлайн, оффлайн, гибрид и т.д.)
*/
CREATE TABLE IF NOT EXISTS formats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/*
Регионы мероприятий
*/
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/*
Категории мероприятий
(IT, бизнес и т.д.)
*/
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/*
Типы мероприятий
(конференция, митап, воркшоп и т.д.)
*/
CREATE TABLE IF NOT EXISTS event_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/*
Полная информация о мероприятиях
*/
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Дата и время
    date_start TIMESTAMP NOT NULL,
    date_end TIMESTAMP,
    time_start TIME,
    time_end TIME,
    
    -- Местоположение и формат
    format_id INTEGER REFERENCES formats(id) ON DELETE SET NULL,
    region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
    
    -- Категория и тип мероприятия
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    event_type_id INTEGER REFERENCES event_types(id) ON DELETE SET NULL,
    
    -- Цена
    price NUMERIC(15, 6),
    
    -- Ссылка и имя организатора
    source_url TEXT,
    organizer_name VARCHAR(255),
    
    -- Аудит
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_configs ( 
    id BIGSERIAL PRIMARY KEY,

    locations JSON,
    event_types JSON,
    sources JSON,
    honorary_participants JSON,
    custom_queries JSON,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Индексы для таблицы events
CREATE INDEX IF NOT EXISTS idx_events_date_start ON events(date_start);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_region ON events(region_id);
CREATE INDEX IF NOT EXISTS idx_events_format ON events(format_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type_id);

-- Триггер для автоматического обновления временной метки updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Начальные данные для форматов
INSERT INTO formats (name, description) VALUES
    ('Онлайн', 'Мероприятие проводится онлайн'),
    ('Офлайн', 'Мероприятие проводится очно'),
    ('Гибрид', 'Мероприятие проводится в смешанном формате')
ON CONFLICT (name) DO NOTHING;

SELECT * FROM formats;

-- Начальные данные для регионов
INSERT INTO regions (name) VALUES
    ('Москва'),
    ('Санкт-Петербург'),
    ('Нижний Новгород')
ON CONFLICT (name) DO NOTHING;

-- Начальные данные для категорий
INSERT INTO categories (name) VALUES
    ('IT'),
    ('Бизнес')
ON CONFLICT (name) DO NOTHING;

-- Начальные данные для типов мероприятий
INSERT INTO event_types (name, description) VALUES
    ('Конференция', 'Крупное мероприятие с докладами и презентациями'),
    ('Воркшоп', 'Практическое занятие'),
    ('Митап', 'Неформальная встреча'),
    ('Вебинар', 'Онлайн семинар'),
    ('Конкурс', 'Соревновательное мероприятие'),
    ('Форум', 'Обсуждение и обмен опытом'),
    ('Саммит', 'Встреча на высшем уровне'),
    ('Хакатон', 'Мероприятие по интенсивной разработке'),
    ('Фестиваль', 'Праздничное мероприятие')
ON CONFLICT (name) DO NOTHING;



