import { Sidebar } from '../components/Sidebar/Sidebar.tsx';
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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
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
  type: 'GR' | 'Business';
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
  const [newHonoredMemberType, setNewHonoredMemberType] = useState<'GR' | 'Business'>('Business');
  const [editingHonoredMember, setEditingHonoredMember] = useState<HonoredMember | null>(null);

  const [customQueries, setCustomQueries] = useState<CustomQuery[]>([]);
  const [newCustomQuery, setNewCustomQuery] = useState('');
  const [editingCustomQuery, setEditingCustomQuery] = useState<CustomQuery | null>(null);

  useEffect(() => {
    if (configData) {
      const apiConfig = configData as Config;

      if (apiConfig.locations) {
        setLocations(apiConfig.locations.map(loc => ({ id: uuidv4(), name: loc })));
      }

      if (apiConfig.event_types) {
        setEventTypes(apiConfig.event_types.map(type => ({ id: uuidv4(), name: type })));
      }

      if (apiConfig.sources) {
        setSources(apiConfig.sources.map(url => ({ id: uuidv4(), url: url })));
      }
      if (apiConfig.honorary_participants) {
        const loadedMembers: HonoredMember[] = [];

        if (apiConfig.honorary_participants.GR) {
          apiConfig.honorary_participants.GR.forEach(name => {
            loadedMembers.push({ id: uuidv4(), name, type: 'GR' });
          });
        }

        if (apiConfig.honorary_participants.Business) {
          apiConfig.honorary_participants.Business.forEach(name => {
            loadedMembers.push({ id: uuidv4(), name, type: 'Business' });
          });
        }

        setHonoredMembers(loadedMembers);
      }

      if (apiConfig.custom_queries) {
        setCustomQueries(apiConfig.custom_queries.map(query => ({ id: uuidv4(), query: query })));
      }
    }
  }, [configData]);

  const handleSaveConfig = () => {
    const configToSave: Config = {
      locations: locations.map(loc => loc.name),
      event_types: eventTypes.map(type => type.name),
      sources: sources.map(source => source.url),
      honorary_participants: {
        GR: honoredMembers.filter(m => m.type === 'GR').map(m => m.name),
        Business: honoredMembers.filter(m => m.type === 'Business').map(m => m.name),
      },
      custom_queries: customQueries.map(query => query.query)
    };

    createConfig(configToSave);
    alert('Конфигурация сохранена');
  };

  const addLocation = () => {
    if (newLocation.trim()) {
      const isDuplicate = locations.some(l => l.name.toLowerCase() === newLocation.toLowerCase());
      if (!isDuplicate) {
        setLocations([...locations, { id: uuidv4(), name: newLocation.trim() }]);
        setNewLocation('');
      } else alert('Такая локация уже существует');
    }
  };
  const startEditLocation = (loc: Location) => setEditingLocation(loc);
  const saveLocation = () => {
    if (editingLocation?.name.trim()) {
      const isDuplicate = locations.some(l => l.id !== editingLocation.id && l.name.toLowerCase() === editingLocation.name.toLowerCase());
      if (!isDuplicate) {
        setLocations(locations.map(l => l.id === editingLocation.id ? editingLocation : l));
        setEditingLocation(null);
      } else alert('Такая локация уже существует');
    }
  };
  const cancelEditLocation = () => setEditingLocation(null);
  const deleteLocation = (id: string) => setLocations(locations.filter(l => l.id !== id));

  const addEventType = () => {
    if (newEventType.trim()) {
      const isDuplicate = eventTypes.some(e => e.name.toLowerCase() === newEventType.toLowerCase());
      if (!isDuplicate) {
        setEventTypes([...eventTypes, { id: uuidv4(), name: newEventType.trim() }]);
        setNewEventType('');
      } else alert('Такой тип мероприятия уже существует');
    }
  };
  const startEditEventType = (type: EventType) => setEditingEventType(type);
  const saveEventType = () => {
    if (editingEventType?.name.trim()) {
      const isDuplicate = eventTypes.some(e => e.id !== editingEventType.id && e.name.toLowerCase() === editingEventType.name.toLowerCase());
      if (!isDuplicate) {
        setEventTypes(eventTypes.map(e => e.id === editingEventType.id ? editingEventType : e));
        setEditingEventType(null);
      } else alert('Такой тип мероприятия уже существует');
    }
  };
  const cancelEditEventType = () => setEditingEventType(null);
  const deleteEventType = (id: string) => setEventTypes(eventTypes.filter(e => e.id !== id));

  const addSource = () => {
    if (newSource.trim()) {
      const isDuplicate = sources.some(s => s.url.toLowerCase() === newSource.toLowerCase());
      if (!isDuplicate) {
        setSources([...sources, { id: uuidv4(), url: newSource.trim() }]);
        setNewSource('');
      } else alert('Такой источник уже существует');
    }
  };
  const startEditSource = (source: Source) => setEditingSource(source);
  const saveSource = () => {
    if (editingSource?.url.trim()) {
      const isDuplicate = sources.some(s => s.id !== editingSource.id && s.url.toLowerCase() === editingSource.url.toLowerCase());
      if (!isDuplicate) {
        setSources(sources.map(s => s.id === editingSource.id ? editingSource : s));
        setEditingSource(null);
      } else alert('Такой источник уже существует');
    }
  };
  const cancelEditSource = () => setEditingSource(null);
  const deleteSource = (id: string) => setSources(sources.filter(s => s.id !== id));

  const addHonoredMember = () => {
    if (newHonoredMember.trim()) {
      const isDuplicate = honoredMembers.some(m => m.name.toLowerCase() === newHonoredMember.toLowerCase());

      if (!isDuplicate) {
        setHonoredMembers([
          ...honoredMembers,
          {
            id: uuidv4(),
            name: newHonoredMember.trim(),
            type: newHonoredMemberType
          }
        ]);
        setNewHonoredMember('');
      } else {
        alert('Такой почетный участник уже существует');
      }
    }
  };

  const startEditHonoredMember = (member: HonoredMember) => setEditingHonoredMember(member);

  const saveHonoredMember = () => {
    if (editingHonoredMember && editingHonoredMember.name.trim()) {
      const isDuplicate = honoredMembers.some(m =>
        m.id !== editingHonoredMember.id && m.name.toLowerCase() === editingHonoredMember.name.toLowerCase()
      );

      if (!isDuplicate) {
        setHonoredMembers(honoredMembers.map(m => m.id === editingHonoredMember.id ? editingHonoredMember : m));
        setEditingHonoredMember(null);
      } else {
        alert('Такой почетный участник уже существует');
      }
    }
  };

  const cancelEditHonoredMember = () => setEditingHonoredMember(null);
  const deleteHonoredMember = (id: string) => setHonoredMembers(honoredMembers.filter(m => m.id !== id));

  const addCustomQuery = () => {
    if (newCustomQuery.trim()) {
      const isDuplicate = customQueries.some(q => q.query.toLowerCase() === newCustomQuery.toLowerCase());
      if (!isDuplicate) {
        setCustomQueries([...customQueries, { id: uuidv4(), query: newCustomQuery.trim() }]);
        setNewCustomQuery('');
      } else alert('Такой запрос уже существует');
    }
  };
  const startEditCustomQuery = (query: CustomQuery) => setEditingCustomQuery(query);
  const saveCustomQuery = () => {
    if (editingCustomQuery?.query.trim()) {
      const isDuplicate = customQueries.some(q => q.id !== editingCustomQuery.id && q.query.toLowerCase() === editingCustomQuery.query.toLowerCase());
      if (!isDuplicate) {
        setCustomQueries(customQueries.map(q => q.id === editingCustomQuery.id ? editingCustomQuery : q));
        setEditingCustomQuery(null);
      } else alert('Такой запрос уже существует');
    }
  };
  const cancelEditCustomQuery = () => setEditingCustomQuery(null);
  const deleteCustomQuery = (id: string) => setCustomQueries(customQueries.filter(q => q.id !== id));

  if (configLoading) {
    return (
      <div style={matches ? {paddingTop: '25px'} : {paddingTop: '75px'}}>
        <Sidebar/>
        <div style={matches ? {paddingLeft: '260px', paddingRight: '20px'} : {paddingLeft: '10px', paddingRight: '10px'}}>
          <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>Настройки</Typography>
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
          <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>Настройки</Typography>
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
          <Typography variant="h4">Настройки</Typography>
          <Button variant="contained" color="primary" onClick={handleSaveConfig} sx={{ ml: 2 }}>
            Сохранить конфигурацию
          </Button>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Локации</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Добавьте города для мероприятий</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid>
                <TextField fullWidth label="Название города" placeholder="Нижний Новгород" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addLocation()} />
              </Grid>
              <Grid>
                <Button fullWidth variant="outlined" startIcon={<Add />} onClick={addLocation} sx={{ height: '56px' }}>Добавить</Button>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead><TableRow><TableCell>Город</TableCell><TableCell align="right">Действия</TableCell></TableRow></TableHead>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        {editingLocation?.id === location.id ?
                          <TextField fullWidth size="small" value={editingLocation.name} onChange={(e) => setEditingLocation({...editingLocation, name: e.target.value})} onKeyPress={(e) => e.key === 'Enter' && saveLocation()} /> :
                          location.name}
                      </TableCell>
                      <TableCell align="right">
                        {editingLocation?.id === location.id ?
                          <><IconButton color="success" onClick={saveLocation}><Save /></IconButton><IconButton color="warning" onClick={cancelEditLocation}><Cancel /></IconButton></> :
                          <><IconButton color="primary" onClick={() => startEditLocation(location)}><Edit /></IconButton><IconButton color="error" onClick={() => deleteLocation(location.id)}><Delete /></IconButton></>
                        }
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
            <Typography variant="h6" gutterBottom>Типы мероприятий</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Добавьте интересующие типы мероприятий</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid>
                <TextField fullWidth label="Тип мероприятия" placeholder="IT" value={newEventType} onChange={(e) => setNewEventType(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addEventType()} />
              </Grid>
              <Grid>
                <Button fullWidth variant="outlined" startIcon={<Add />} onClick={addEventType} sx={{ height: '56px' }}>Добавить</Button>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead><TableRow><TableCell>Тип мероприятия</TableCell><TableCell align="right">Действия</TableCell></TableRow></TableHead>
                <TableBody>
                  {eventTypes.map((eventType) => (
                    <TableRow key={eventType.id}>
                      <TableCell>
                        {editingEventType?.id === eventType.id ?
                          <TextField fullWidth size="small" value={editingEventType.name} onChange={(e) => setEditingEventType({...editingEventType, name: e.target.value})} onKeyPress={(e) => e.key === 'Enter' && saveEventType()} /> :
                          eventType.name}
                      </TableCell>
                      <TableCell align="right">
                        {editingEventType?.id === eventType.id ?
                          <><IconButton color="success" onClick={saveEventType}><Save /></IconButton><IconButton color="warning" onClick={cancelEditEventType}><Cancel /></IconButton></> :
                          <><IconButton color="primary" onClick={() => startEditEventType(eventType)}><Edit /></IconButton><IconButton color="error" onClick={() => deleteEventType(eventType.id)}><Delete /></IconButton></>
                        }
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
            <Typography variant="h6" gutterBottom>Источники</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Добавьте источники для парсинга мероприятий</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid>
                <TextField fullWidth label="Адрес сайта" placeholder="https://example.com" value={newSource} onChange={(e) => setNewSource(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSource()} />
              </Grid>
              <Grid>
                <Button fullWidth variant="outlined" startIcon={<Add />} onClick={addSource} sx={{ height: '56px' }}>Добавить</Button>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead><TableRow><TableCell>Адрес</TableCell><TableCell align="right">Действия</TableCell></TableRow></TableHead>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell>
                        {editingSource?.id === source.id ?
                          <TextField fullWidth size="small" value={editingSource.url} onChange={(e) => setEditingSource({...editingSource, url: e.target.value})} onKeyPress={(e) => e.key === 'Enter' && saveSource()} /> :
                          <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'none' }}>{source.url}</a>}
                      </TableCell>
                      <TableCell align="right">
                        {editingSource?.id === source.id ?
                          <><IconButton color="success" onClick={saveSource}><Save /></IconButton><IconButton color="warning" onClick={cancelEditSource}><Cancel /></IconButton></> :
                          <><IconButton color="primary" onClick={() => startEditSource(source)}><Edit /></IconButton><IconButton color="error" onClick={() => deleteSource(source.id)}><Delete /></IconButton></>
                        }
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
            <Typography variant="h6" gutterBottom>Почетные участники</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Добавьте почетных участников для отслеживания (GR или Бизнес)</Typography>

            <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
              <Grid>
                <TextField
                  fullWidth
                  label="Наименование"
                  placeholder="Название компании или организации"
                  value={newHonoredMember}
                  onChange={(e) => setNewHonoredMember(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addHonoredMember()}
                />
              </Grid>
              <Grid>
                <FormControl fullWidth>
                  <InputLabel id="type-select-label">Тип</InputLabel>
                  <Select
                    labelId="type-select-label"
                    value={newHonoredMemberType}
                    label="Тип"
                    onChange={(e) => setNewHonoredMemberType(e.target.value as 'GR' | 'Business')}
                  >
                    <MenuItem value="Business">Бизнес</MenuItem>
                    <MenuItem value="GR">GR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid>
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
                    <TableCell width="20%">Тип</TableCell>
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
                          />
                        ) : (
                          member.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingHonoredMember?.id === member.id ? (
                          <FormControl size="small" fullWidth>
                            <Select
                              value={editingHonoredMember.type}
                              onChange={(e) => setEditingHonoredMember({...editingHonoredMember, type: e.target.value as 'GR' | 'Business'})}
                            >
                              <MenuItem value="Business">Бизнес</MenuItem>
                              <MenuItem value="GR">GR</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          member.type === 'GR' ? 'GR' : 'Бизнес'
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
            <Typography variant="h6" gutterBottom>Пользовательские запросы</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Добавьте пользовательские запросы для поиска</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid>
                <TextField fullWidth label="Запрос" placeholder="бизнес-завтраки в нижнем новгороде в ноябре" value={newCustomQuery} onChange={(e) => setNewCustomQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addCustomQuery()} />
              </Grid>
              <Grid>
                <Button fullWidth variant="outlined" startIcon={<Add />} onClick={addCustomQuery} sx={{ height: '56px' }}>Добавить</Button>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead><TableRow><TableCell>Запрос</TableCell><TableCell align="right">Действия</TableCell></TableRow></TableHead>
                <TableBody>
                  {customQueries.map((query) => (
                    <TableRow key={query.id}>
                      <TableCell>
                        {editingCustomQuery?.id === query.id ?
                          <TextField fullWidth size="small" value={editingCustomQuery.query} onChange={(e) => setEditingCustomQuery({...editingCustomQuery, query: e.target.value})} onKeyPress={(e) => e.key === 'Enter' && saveCustomQuery()} /> :
                          query.query}
                      </TableCell>
                      <TableCell align="right">
                        {editingCustomQuery?.id === query.id ?
                          <><IconButton color="success" onClick={saveCustomQuery}><Save /></IconButton><IconButton color="warning" onClick={cancelEditCustomQuery}><Cancel /></IconButton></> :
                          <><IconButton color="primary" onClick={() => startEditCustomQuery(query)}><Edit /></IconButton><IconButton color="error" onClick={() => deleteCustomQuery(query.id)}><Delete /></IconButton></>
                        }
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