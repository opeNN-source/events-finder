import {Sidebar} from '../components/Sidebar/Sidebar.tsx';
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import Add from '@mui/icons-material/Add';
import Save from '@mui/icons-material/Save';
import Cancel from '@mui/icons-material/Cancel';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useConfig, createConfig } from '../services/api.ts';
import type { Config } from '../utils.ts';

interface Source {
  id: string;
  url: string;
}

interface HonoredMember {
  id: string;
  name: string;
}

interface CustomQuery {
  id: string;
  query: string;
}

interface Location {
  id: string;
  name: string;
}

interface EventType {
  id: string;
  name: string;
}

export const Settings = () => {
  const matches = useMediaQuery('(min-width:1024px)');
  const { data: configData, error: configError, isLoading: configLoading } = useConfig();

  const [locations, setLocations] = useState<Location[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [newEventType, setNewEventType] = useState('');
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);

  const [sources, setSources] = useState<Source[]>([]);
  const [newSource, setNewSource] = useState('');
  const [editingSource, setEditingSource] = useState<Source | null>(null);

  const [honoredMembers, setHonoredMembers] = useState<HonoredMember[]>([]);
  const [newHonoredMember, setNewHonoredMember] = useState('');
  const [editingHonoredMember, setEditingHonoredMember] = useState<HonoredMember | null>(null);

  const [customQueries, setCustomQueries] = useState<CustomQuery[]>([]);
  const [newCustomQuery, setNewCustomQuery] = useState('');
  const [editingCustomQuery, setEditingCustomQuery] = useState<CustomQuery | null>(null);

  useEffect(() => {
    if (configData) {
      const apiConfig = configData as Config;

      if (apiConfig.locations) {
        const locationsData = apiConfig.locations.map(loc => ({
          id: uuidv4(),
          name: loc
        }));
        setLocations(locationsData);
      }

      if (apiConfig.event_types) {
        const eventTypesData = apiConfig.event_types.map(type => ({
          id: uuidv4(),
          name: type
        }));
        setEventTypes(eventTypesData);
      }

      if (apiConfig.sources) {
        const sourcesData = apiConfig.sources.map(url => ({
          id: uuidv4(),
          url: url
        }));
        setSources(sourcesData);
      }

      if (apiConfig.honorary_participants) {
        const honoredMembersData = apiConfig.honorary_participants.map(name => ({
          id: uuidv4(),
          name: name
        }));
        setHonoredMembers(honoredMembersData);
      }

      if (apiConfig.custom_queries) {
        const customQueriesData = apiConfig.custom_queries.map(query => ({
          id: uuidv4(),
          query: query
        }));
        setCustomQueries(customQueriesData);
      }
    }
  }, [configData]);

  const handleSaveConfig = () => {
    const configToSave: Config = {
      locations: locations.map(loc => loc.name),
      event_types: eventTypes.map(type => type.name),
      sources: sources.map(source => source.url),
      honorary_participants: honoredMembers.map(member => member.name),
      custom_queries: customQueries.map(query => query.query)
    };

    createConfig(configToSave);
    alert('Конфигурация сохранена');
  };

  const addLocation = () => {
    if (newLocation.trim()) {
      const isDuplicate = locations.some(location =>
        location.name.toLowerCase() === newLocation.toLowerCase()
      );

      if (!isDuplicate) {
        setLocations([...locations, { id: uuidv4(), name: newLocation.trim() }]);
        setNewLocation('');
      } else {
        alert('Такая локация уже существует');
      }
    }
  };

  const startEditLocation = (location: Location) => {
    setEditingLocation(location);
  };

  const saveLocation = () => {
    if (editingLocation && editingLocation.name.trim()) {
      const isDuplicate = locations.some(location =>
        location.id !== editingLocation.id && location.name.toLowerCase() === editingLocation.name.toLowerCase()
      );

      if (!isDuplicate) {
        setLocations(locations.map(location =>
          location.id === editingLocation.id ? editingLocation : location
        ));
        setEditingLocation(null);
      } else {
        alert('Такая локация уже существует');
      }
    }
  };

  const cancelEditLocation = () => {
    setEditingLocation(null);
  };

  const deleteLocation = (id: string) => {
    setLocations(locations.filter(location => location.id !== id));
  };

  const addEventType = () => {
    if (newEventType.trim()) {
      const isDuplicate = eventTypes.some(eventType =>
        eventType.name.toLowerCase() === newEventType.toLowerCase()
      );

      if (!isDuplicate) {
        setEventTypes([...eventTypes, { id: uuidv4(), name: newEventType.trim() }]);
        setNewEventType('');
      } else {
        alert('Такой тип мероприятия уже существует');
      }
    }
  };

  const startEditEventType = (eventType: EventType) => {
    setEditingEventType(eventType);
  };

  const saveEventType = () => {
    if (editingEventType && editingEventType.name.trim()) {
      const isDuplicate = eventTypes.some(eventType =>
        eventType.id !== editingEventType.id && eventType.name.toLowerCase() === editingEventType.name.toLowerCase()
      );

      if (!isDuplicate) {
        setEventTypes(eventTypes.map(eventType =>
          eventType.id === editingEventType.id ? editingEventType : eventType
        ));
        setEditingEventType(null);
      } else {
        alert('Такой тип мероприятия уже существует');
      }
    }
  };

  const cancelEditEventType = () => {
    setEditingEventType(null);
  };

  const deleteEventType = (id: string) => {
    setEventTypes(eventTypes.filter(eventType => eventType.id !== id));
  };

  const addSource = () => {
    if (newSource.trim()) {
      const isDuplicate = sources.some(source =>
        source.url.toLowerCase() === newSource.toLowerCase()
      );

      if (!isDuplicate) {
        setSources([...sources, { id: uuidv4(), url: newSource.trim() }]);
        setNewSource('');
      } else {
        alert('Такой источник уже существует');
      }
    }
  };

  const startEditSource = (source: Source) => {
    setEditingSource(source);
  };

  const saveSource = () => {
    if (editingSource && editingSource.url.trim()) {
      const isDuplicate = sources.some(source =>
        source.id !== editingSource.id && source.url.toLowerCase() === editingSource.url.toLowerCase()
      );

      if (!isDuplicate) {
        setSources(sources.map(source =>
          source.id === editingSource.id ? editingSource : source
        ));
        setEditingSource(null);
      } else {
        alert('Такой источник уже существует');
      }
    }
  };

  const cancelEditSource = () => {
    setEditingSource(null);
  };

  const deleteSource = (id: string) => {
    setSources(sources.filter(source => source.id !== id));
  };

  const addHonoredMember = () => {
    if (newHonoredMember.trim()) {
      const isDuplicate = honoredMembers.some(member =>
        member.name.toLowerCase() === newHonoredMember.toLowerCase()
      );

      if (!isDuplicate) {
        setHonoredMembers([...honoredMembers, { id: uuidv4(), name: newHonoredMember.trim() }]);
        setNewHonoredMember('');
      } else {
        alert('Такой почетный участник уже существует');
      }
    }
  };

  const startEditHonoredMember = (member: HonoredMember) => {
    setEditingHonoredMember(member);
  };

  const saveHonoredMember = () => {
    if (editingHonoredMember && editingHonoredMember.name.trim()) {
      const isDuplicate = honoredMembers.some(member =>
        member.id !== editingHonoredMember.id && member.name.toLowerCase() === editingHonoredMember.name.toLowerCase()
      );

      if (!isDuplicate) {
        setHonoredMembers(honoredMembers.map(member =>
          member.id === editingHonoredMember.id ? editingHonoredMember : member
        ));
        setEditingHonoredMember(null);
      } else {
        alert('Такой почетный участник уже существует');
      }
    }
  };

  const cancelEditHonoredMember = () => {
    setEditingHonoredMember(null);
  };

  const deleteHonoredMember = (id: string) => {
    setHonoredMembers(honoredMembers.filter(member => member.id !== id));
  };

  const addCustomQuery = () => {
    if (newCustomQuery.trim()) {
      const isDuplicate = customQueries.some(query =>
        query.query.toLowerCase() === newCustomQuery.toLowerCase()
      );

      if (!isDuplicate) {
        setCustomQueries([...customQueries, { id: uuidv4(), query: newCustomQuery.trim() }]);
        setNewCustomQuery('');
      } else {
        alert('Такой запрос уже существует');
      }
    }
  };

  const startEditCustomQuery = (query: CustomQuery) => {
    setEditingCustomQuery(query);
  };

  const saveCustomQuery = () => {
    if (editingCustomQuery && editingCustomQuery.query.trim()) {
      const isDuplicate = customQueries.some(query =>
        query.id !== editingCustomQuery.id && query.query.toLowerCase() === editingCustomQuery.query.toLowerCase()
      );

      if (!isDuplicate) {
        setCustomQueries(customQueries.map(query =>
          query.id === editingCustomQuery.id ? editingCustomQuery : query
        ));
        setEditingCustomQuery(null);
      } else {
        alert('Такой запрос уже существует');
      }
    }
  };

  const cancelEditCustomQuery = () => {
    setEditingCustomQuery(null);
  };

  const deleteCustomQuery = (id: string) => {
    setCustomQueries(customQueries.filter(query => query.id !== id));
  };

  if (configLoading) {
    return (
      <div style={matches ? {paddingTop: '25px'} : {paddingTop: '75px'}}>
        <Sidebar/>
        <div style={matches ? {paddingLeft: '260px', paddingRight: '20px'} : {paddingLeft: '10px', paddingRight: '10px'}}>
          <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
            Настройки
          </Typography>
          <Typography>Загрузка конфигурации...</Typography>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div style={matches ? {paddingTop: '25px'} : {paddingTop: '75px'}}>
        <Sidebar/>
        <div style={matches ? {paddingLeft: '260px', paddingRight: '20px'} : {paddingLeft: '10px', paddingRight: '10px'}}>
          <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
            Настройки
          </Typography>
          <Typography color="error">Ошибка загрузки конфигурации</Typography>
        </div>
      </div>
    );
  }

  return (
    <div style={matches ? {paddingTop: '25px'} : {paddingTop: '75px'}}>
      <Sidebar/>
      <div style={matches ? {paddingLeft: '260px', paddingRight: '20px'} : {paddingLeft: '10px', paddingRight: '10px'}}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            Настройки
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveConfig}
            sx={{ ml: 2 }}
          >
            Сохранить конфигурацию
          </Button>
        </Box>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Локации
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Добавьте города для мероприятий
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid component="div">
                <TextField
                  fullWidth
                  label="Название города"
                  placeholder="Нижний Новгород"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addLocation();
                    }
                  }}
                />
              </Grid>
              <Grid component="div">
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={addLocation}
                  sx={{ height: '56px' }}
                >
                  Добавить
                </Button>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Город</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        {editingLocation?.id === location.id ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={editingLocation.name}
                            onChange={(e) => setEditingLocation({...editingLocation, name: e.target.value})}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                saveLocation();
                              }
                            }}
                          />
                        ) : (
                          location.name
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editingLocation?.id === location.id ? (
                          <>
                            <IconButton color="success" onClick={saveLocation}>
                              <Save />
                            </IconButton>
                            <IconButton color="warning" onClick={cancelEditLocation}>
                              <Cancel />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton color="primary" onClick={() => startEditLocation(location)}>
                              <Edit />
                            </IconButton>
                            <IconButton color="error" onClick={() => deleteLocation(location.id)}>
                              <Delete />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Типы мероприятий
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Добавьте интересующие типы мероприятий
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid component="div">
                <TextField
                  fullWidth
                  label="Тип мероприятия"
                  placeholder="IT"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addEventType();
                    }
                  }}
                />
              </Grid>
              <Grid component="div">
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={addEventType}
                  sx={{ height: '56px' }}
                >
                  Добавить
                </Button>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Тип мероприятия</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eventTypes.map((eventType) => (
                    <TableRow key={eventType.id}>
                      <TableCell>
                        {editingEventType?.id === eventType.id ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={editingEventType.name}
                            onChange={(e) => setEditingEventType({...editingEventType, name: e.target.value})}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                saveEventType();
                              }
                            }}
                          />
                        ) : (
                          eventType.name
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editingEventType?.id === eventType.id ? (
                          <>
                            <IconButton color="success" onClick={saveEventType}>
                              <Save />
                            </IconButton>
                            <IconButton color="warning" onClick={cancelEditEventType}>
                              <Cancel />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton color="primary" onClick={() => startEditEventType(eventType)}>
                              <Edit />
                            </IconButton>
                            <IconButton color="error" onClick={() => deleteEventType(eventType.id)}>
                              <Delete />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Источники
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Добавьте источники для парсинга мероприятий
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid component="div">
                <TextField
                  fullWidth
                  label="Адрес сайта"
                  placeholder="https://example.com"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addSource();
                    }
                  }}
                />
              </Grid>
              <Grid component="div">
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={addSource}
                  sx={{ height: '56px' }}
                >
                  Добавить
                </Button>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Адрес</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell>
                        {editingSource?.id === source.id ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={editingSource.url}
                            onChange={(e) => setEditingSource({...editingSource, url: e.target.value})}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                saveSource();
                              }
                            }}
                          />
                        ) : (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1976d2', textDecoration: 'none' }}
                          >
                            {source.url}
                          </a>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editingSource?.id === source.id ? (
                          <>
                            <IconButton color="success" onClick={saveSource}>
                              <Save />
                            </IconButton>
                            <IconButton color="warning" onClick={cancelEditSource}>
                              <Cancel />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton color="primary" onClick={() => startEditSource(source)}>
                              <Edit />
                            </IconButton>
                            <IconButton color="error" onClick={() => deleteSource(source.id)}>
                              <Delete />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Почетные участники
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Добавьте почетных участников для отслеживания
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid component="div">
                <TextField
                  fullWidth
                  label="Наименование"
                  placeholder="Название компании или организации"
                  value={newHonoredMember}
                  onChange={(e) => setNewHonoredMember(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addHonoredMember();
                    }
                  }}
                />
              </Grid>
              <Grid component="div">
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={addHonoredMember}
                  sx={{ height: '56px' }}
                >
                  Добавить
                </Button>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Наименование</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {honoredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        {editingHonoredMember?.id === member.id ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={editingHonoredMember.name}
                            onChange={(e) => setEditingHonoredMember({...editingHonoredMember, name: e.target.value})}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                saveHonoredMember();
                              }
                            }}
                          />
                        ) : (
                          member.name
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editingHonoredMember?.id === member.id ? (
                          <>
                            <IconButton color="success" onClick={saveHonoredMember}>
                              <Save />
                            </IconButton>
                            <IconButton color="warning" onClick={cancelEditHonoredMember}>
                              <Cancel />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton color="primary" onClick={() => startEditHonoredMember(member)}>
                              <Edit />
                            </IconButton>
                            <IconButton color="error" onClick={() => deleteHonoredMember(member.id)}>
                              <Delete />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Пользовательские запросы
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Добавьте пользовательские запросы для поиска
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid component="div">
                <TextField
                  fullWidth
                  label="Запрос"
                  placeholder="бизнес-завтраки в нижнем новгороде в ноябре"
                  value={newCustomQuery}
                  onChange={(e) => setNewCustomQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomQuery();
                    }
                  }}
                />
              </Grid>
              <Grid component="div">
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={addCustomQuery}
                  sx={{ height: '56px' }}
                >
                  Добавить
                </Button>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Запрос</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customQueries.map((query) => (
                    <TableRow key={query.id}>
                      <TableCell>
                        {editingCustomQuery?.id === query.id ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={editingCustomQuery.query}
                            onChange={(e) => setEditingCustomQuery({...editingCustomQuery, query: e.target.value})}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                saveCustomQuery();
                              }
                            }}
                          />
                        ) : (
                          query.query
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editingCustomQuery?.id === query.id ? (
                          <>
                            <IconButton color="success" onClick={saveCustomQuery}>
                              <Save />
                            </IconButton>
                            <IconButton color="warning" onClick={cancelEditCustomQuery}>
                              <Cancel />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton color="primary" onClick={() => startEditCustomQuery(query)}>
                              <Edit />
                            </IconButton>
                            <IconButton color="error" onClick={() => deleteCustomQuery(query.id)}>
                              <Delete />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Settings;