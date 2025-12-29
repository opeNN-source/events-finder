import { useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import type { Event } from '../utils.ts';
import { Sidebar } from '../components/Sidebar/Sidebar.tsx';
import useMediaQuery from "@mui/material/useMediaQuery";
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEvents } from "../services/api.ts";

export const EventPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const matches = useMediaQuery('(min-width:1024px)');
  const [event, setEvent] = useState<Event | null>(null);
  const { data: eventsData } = useEvents();

  useEffect(() => {
    if (eventsData?.items) {
      const foundEvent = eventsData.items.find((e: Event) => e.id === Number(eventId));
      setEvent(foundEvent || null);
    }
  }, [eventId, eventsData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Бесплатно' : `${price.toLocaleString('ru-RU')} ₽`;
  };

  const handleBack = () => {
    navigate('/events');
  };

  if (!event) {
    return <div>Мероприятие не найдено</div>;
  }

  const isMultiDay = event.date_start !== event.date_end && event.date_end !== null;

  return (
    <div style={matches ? { paddingTop: '25px' } : { paddingTop: '75px' }}>
      <Sidebar/>
      <div style={matches ? { paddingLeft: '260px', paddingRight: '20px' } : { paddingLeft: '10px', paddingRight: '10px' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Назад к списку
        </Button>
        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', marginTop: '16px' }}>
          <h1 style={{ marginBottom: '24px' }}>{event.name}</h1>

          <div style={{ marginBottom: '16px' }}>
            <strong>Описание:</strong>
            <p style={{ marginTop: '8px' }}>{event.description}</p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Дата:</strong> {formatDate(event.date_start)}
            {isMultiDay && ` – ${event.date_end ? formatDate(event.date_end) : ''}`}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Время:</strong> {event.time_start} {event.time_end ? `— ${event.time_end}` : ''}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Место:</strong> {event.region.name}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Формат:</strong> {event.format.name}
            {event.format.description && (
              <span style={{ color: '#666', marginLeft: '8px' }}>({event.format.description})</span>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Категория:</strong> {event.category.name}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Тип мероприятия:</strong> {event.event_type.name}
            {event.event_type.description && (
              <span style={{ color: '#666', marginLeft: '8px' }}>({event.event_type.description})</span>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Стоимость:</strong> {formatPrice(event.price)}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Организатор:</strong> {event.organizer_name}
          </div>

          {event.source_url && (
            <div style={{ marginBottom: '16px' }}>
              <strong>Ссылка на источник:</strong>{' '}
              <a href={event.source_url} target="_blank" rel="noopener noreferrer">
                {event.source_url}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPage;