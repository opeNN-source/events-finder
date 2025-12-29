export interface Format {
  id: number;
  name: string;
  description: string;
}

export interface Region {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface EventType {
  id: number;
  name: string;
  description: string;
}

export interface Event {
  id: number;
  name: string;
  description: string;
  date_start: string;
  date_end: string | null;
  time_start: string;
  time_end: string | null;
  format_id: number;
  region_id: number;
  category_id: number;
  event_type_id: number;
  price: number;
  source_url: string;
  organizer_name: string;
  format: Format;
  region: Region;
  category: Category;
  event_type: EventType;
}

export interface EventFilters {
  location?: string[];
  format?: string[];
  category?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: string;
    end: string;
  };
}


export interface Config {
  locations: string[];
  event_types: string[];
  sources: string[];
  honorary_participants: string[];
  custom_queries: string[];
}