import React from 'react';
import { useNavigate } from 'react-router';
import styles from './eventcard.module.css';
import type { Event } from '../../utils.ts';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return price === 0 ? 'Бесплатно' : `${price.toLocaleString('ru-RU')} ₽`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isMultiDay = event.date_start !== event.date_end && event.date_end !== null;

  const getPriceClass = (price: number) => {
    return price === 0 ? styles.priceFree : styles.pricePaid;
  };

  const handleCardClick = () => {
    navigate(`/events/${event.id}`);
  };

  return (
    <div
      className={styles.eventcardWrapper}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.cardContent}>
        <div className={styles.header}>
          <h3 className={styles.title}>{event.name}</h3>
          <div className={`${styles.price} ${getPriceClass(event.price)}`}>
            {formatPrice(event.price)}
          </div>
        </div>

        <div className={styles.datetime}>
          <span className={styles.date}>
            {isMultiDay ? (
              `${formatDate(event.date_start)} – ${event.date_end ? formatDate(event.date_end) : ''}`
            ) : (
              formatDate(event.date_start)
            )}
          </span>
          <span className={styles.separator}>•</span>
          <span className={styles.time}>
            {event.time_start} {event.time_end ? `— ${event.time_end}` : ''}
          </span>
        </div>

        <div className={styles.locationFormat}>
          <span className={styles.location}>
            {event.region.name}
          </span>
          <span className={styles.format}>
            {event.format.name}
          </span>
        </div>

        <div className={styles.tags}>
          <span className={styles.categoryTag}>
            {event.category.name}
          </span>
          <span className={styles.typeTag}>
            {event.event_type.name}
          </span>
        </div>

        <div className={styles.description}>
          {event.description}
        </div>
      </div>
    </div>
  );
};

export default EventCard;