import {Sidebar} from '../components/Sidebar/Sidebar.tsx';
import EventCard from "../components/EventCard/EventCard.tsx";
import type {Event, EventFilters} from '../utils.ts';
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled, alpha } from '@mui/material/styles';
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import IconButton from '@mui/material/IconButton';
import { Filter } from '../components/Filter/Filter.tsx';
import { useState, useMemo, useEffect } from 'react';
import { Calendar, momentLocalizer, type View, Views } from 'react-big-calendar';
import moment from 'moment';
import {useNavigate} from "react-router";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useEvents, sendEmail, type SearchParams } from "../services/api.ts";
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

moment.locale('ru', {
  months: 'январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь'.split('_'),
  monthsShort: 'янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек'.split('_'),
});

const localizer = momentLocalizer(moment);

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  borderRadius: 8,
  border: '1px solid rgba(0, 0, 0, 0.12)',
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));

const FloatingActionContainer = styled('div')(() => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  backgroundColor: 'white',
  borderRadius: 8,
  padding: '16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  zIndex: 1000,
  border: '1px solid #e0e0e0',
  minWidth: '200px',
}));

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: {
    originalEvent: Event;
  };
}

const ALL_EVENTS_PARAMS = {};

export const EventsList = () => {
  const matches = useMediaQuery('(min-width:1024px)');
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const { data: events, isLoading } = useEvents(searchParams);

  const { data: allEventsData } = useEvents(ALL_EVENTS_PARAMS);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [allFormats, setAllFormats] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  useEffect(() => {
    if (allEventsData?.items) {
      const locationsSet = new Set<string>();
      const formatsSet = new Set<string>();
      const categoriesSet = new Set<string>();

      allEventsData.items.forEach((event: Event) => {
        if (event.region?.name) {
          locationsSet.add(event.region.name);
        }
        if (event.format?.name) {
          formatsSet.add(event.format.name);
        }
        if (event.category?.name) {
          categoriesSet.add(event.category.name);
        }
      });

      setAllLocations(Array.from(locationsSet).sort());
      setAllFormats(Array.from(formatsSet).sort());
      setAllCategories(Array.from(categoriesSet).sort());
    }
  }, [allEventsData]);

  const handleFilterOpen = () => {
    setFilterOpen(true);
  };

  const handleFilterClose = () => {
    setFilterOpen(false);
  };

  const handleFiltersChange = (newFilters: EventFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = (params: SearchParams) => {
    setSearchParams(params);
  };

  const handleViewModeChange = (mode: 'cards' | 'calendar') => {
    setViewMode(mode);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    navigate(`/events/${event.id}`);
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (view: View) => {
    setCalendarView(view);
  };

  const handleEventSelect = (eventId: number) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEvents.length === filteredEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(filteredEvents.map((event: Event) => event.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedEvents.length === 0) {
      return;
    }

    setIsSending(true);
    try {
      await sendEmail(selectedEvents);
      setIsSubmitted(true);
      setShowSuccessAlert(true);
      setTimeout(() => {
        setSelectedEvents([]);
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Ошибка при отправке email:', error);
      setShowErrorAlert(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuccessAlertClose = () => {
    setShowSuccessAlert(false);
  };

  const handleErrorAlertClose = () => {
    setShowErrorAlert(false);
  };

  const handleSearch = () => {
    setSearchParams(prev => ({
      ...prev,
      name: searchQuery.trim() || undefined
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredEvents = useMemo(() => {
    return events?.items || [];
  }, [events]);

  const calendarData: CalendarEvent[] = useMemo(() => {
    return filteredEvents.map((event: Event) => {
      const startDate = new Date(event.date_start);

      let endDate: Date;
      if (event.date_end) {
        endDate = new Date(event.date_end);
      } else {
        endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      }

      const isMultiDay = event.date_start !== event.date_end && event.date_end !== null;

      return {
        id: event.id,
        title: event.name,
        start: startDate,
        end: endDate,
        allDay: isMultiDay,
        resource: {
          originalEvent: event
        }
      };
    });
  }, [filteredEvents]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const category = event.resource?.originalEvent.category.name;
    let backgroundColor = '#3174ad';

    if (category === 'IT') {
      backgroundColor = '#1976d2';
    } else if (category === 'Образование') {
      backgroundColor = '#2e7d32';
    } else if (category === 'Бизнес') {
      backgroundColor = '#ed6c02';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const showFloatingAction = selectedEvents.length > 0 && !isSubmitted;

  if (isLoading) {
    return (
      <div style={matches ? {paddingTop: '25px'} : {paddingTop: '75px'}}>
        <Sidebar/>
        <div style={matches ? {paddingLeft: '260px', height: '100vh', flexDirection: 'column', paddingRight: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center'} : {paddingLeft: '10px', paddingRight: '10px'}}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="textSecondary">
            Загрузка мероприятий...
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div style={matches ? {paddingTop: '75px'} : {paddingTop: '125px'}}>
      <Sidebar/>
      <div style={matches ? {paddingLeft: '260px', paddingRight: '20px', position: 'relative'} : {paddingLeft: '10px', paddingRight: '10px', position: 'relative'}}>
        <div style={{display: 'flex', position: 'fixed', zIndex: 999, backgroundColor: 'white', height: '70px', width: `${matches ? "calc(100vw - 270px)" : "98vw"}`, top: `${matches ? '0px' : '55px'}`, alignItems: 'center', gap: '20px', flexShrink: '0', justifyContent: 'space-between', marginBottom: '20px'}}>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Поиск"
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </Search>
          <IconButton onClick={handleFilterOpen}>
            <FilterAltIcon/>
          </IconButton>
        </div>

        {viewMode === 'cards' && filteredEvents.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
            <Checkbox
              checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0}
              indeterminate={selectedEvents.length > 0 && selectedEvents.length < filteredEvents.length}
              onChange={handleSelectAll}
            />
            <span style={{ color: '#666', fontSize: '14px' }}>
              Выбрать все ({selectedEvents.length}/{filteredEvents.length})
            </span>
          </div>
        )}

        <div style={{ marginBottom: '16px', color: '#666' }}>
          Найдено мероприятий: {filteredEvents.length}
        </div>

        {viewMode === 'cards' ? (
          <div>
            {filteredEvents.map((event: Event) => (
              <div key={event.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <Checkbox
                  checked={selectedEvents.includes(event.id)}
                  onChange={() => handleEventSelect(event.id)}
                  style={{
                    marginTop: '16px',
                    flexShrink: 0
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <div style={{ flex: 1 }}>
                  <EventCard
                    event={event}
                  />
                </div>
              </div>
            ))}
          </div>
        )  : (
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            height: 'calc(100vh - 200px)',
            minHeight: '600px'
          }}>
            <Calendar
              localizer={localizer}
              events={calendarData}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={eventStyleGetter}
              style={{ height: '100%' }}
              date={currentDate}
              view={calendarView}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              step={60}
              messages={{
                next: "Вперед",
                previous: "Назад",
                today: "Сегодня",
                month: "Месяц",
                week: "Неделя",
                day: "День",
                agenda: "Повестка",
                date: "Дата",
                time: "Время",
                event: "Событие",
                noEventsInRange: "Нет событий в этом диапазоне",
                showMore: (total) => `+${total} еще`
              }}
              formats={{
                monthHeaderFormat: 'MMMM YYYY',
                dayHeaderFormat: 'dddd, MMMM DD',
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${moment(start).format('MMMM DD')} - ${moment(end).format('MMMM DD, YYYY')}`,
                agendaHeaderFormat: ({ start, end }) =>
                  `${moment(start).format('MMMM DD')} - ${moment(end).format('MMMM DD, YYYY')}`,
              }}
              components={{
                event: ({ event }) => (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '2px' }}>
                    <Checkbox
                      checked={selectedEvents.includes(event.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleEventSelect(event.id);
                      }}
                      size="small"
                      style={{
                        marginRight: '4px',
                        padding: 0,
                        color: 'white',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>{event.title}</span>
                  </div>
                )
              }}
            />
          </div>
        )}

        {filteredEvents.length === 0 && viewMode === 'cards' && !isLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Мероприятия не найдены. Попробуйте изменить параметры фильтрации.
          </div>
        )}
      </div>

      {showFloatingAction && (
        <FloatingActionContainer>
          {isSubmitted ? (
            <span style={{ color: '#2e7d32', fontWeight: '500' }}>Отправлено ✓</span>
          ) : (
            <>
              <span>Выбрано: {selectedEvents.length}</span>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleSubmit}
                disabled={isSending}
              >
                {isSending ? 'Отправка...' : 'Отправить'}
              </Button>
            </>
          )}
        </FloatingActionContainer>
      )}

      <Filter
        open={filterOpen}
        onClose={handleFilterClose}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onApplyFilters={handleApplyFilters}
        locations={allLocations}
        formats={allFormats}
        categories={allCategories}
      />

      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={3000}
        onClose={handleSuccessAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSuccessAlertClose} severity="success" sx={{ width: '100%' }}>
          Успешно отправлено! Выбрано мероприятий: {selectedEvents.length}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showErrorAlert}
        autoHideDuration={3000}
        onClose={handleErrorAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleErrorAlertClose} severity="error" sx={{ width: '100%' }}>
          Ошибка при отправке. Попробуйте снова.
        </Alert>
      </Snackbar>
    </div>
  )
}

export default EventsList;