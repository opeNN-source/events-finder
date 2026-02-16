import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Slider from '@mui/material/Slider';
import type { EventFilters } from '../../utils.ts';
import type { SearchParams } from '../../services/api.ts';

interface FilterProps {
  open: boolean;
  onClose: () => void;
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  viewMode: 'cards' | 'calendar';
  onViewModeChange: (mode: 'cards' | 'calendar') => void;
  onApplyFilters: (searchParams: SearchParams) => void;
  locations: string[];
  formats: string[];
  categories: string[];
}

export const Filter: React.FC<FilterProps> = ({
                                                open,
                                                onClose,
                                                filters,
                                                onFiltersChange,
                                                viewMode,
                                                onViewModeChange,
                                                onApplyFilters,
                                                locations,
                                                formats,
                                                categories
                                              }) => {
  const [tempFilters, setTempFilters] = React.useState<EventFilters>(filters);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 10000]);

  React.useEffect(() => {
    setTempFilters(filters);
    if (filters.priceRange) {
      setPriceRange([filters.priceRange.min || 0, filters.priceRange.max || 10000]);
    }
  }, [filters, open]);

  const handleLocationChange = (location: string) => {
    const currentLocations = tempFilters.location || [];
    const newLocations = currentLocations.includes(location)
      ? currentLocations.filter(l => l !== location)
      : [...currentLocations, location];

    setTempFilters({ ...tempFilters, location: newLocations });
  };

  const handleFormatChange = (format: string) => {
    const currentFormats = tempFilters.format || [];
    const newFormats = currentFormats.includes(format)
      ? currentFormats.filter(f => f !== format)
      : [...currentFormats, format];

    setTempFilters({ ...tempFilters, format: newFormats });
  };

  const handleCategoryChange = (category: string) => {
    const currentCategories = tempFilters.category || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];

    setTempFilters({ ...tempFilters, category: newCategories });
  };

  const handlePriceRangeChange = (_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as [number, number]);
  };

  const handleDateFromChange = (date: string) => {
    setTempFilters({
      ...tempFilters,
      dateRange: {
        start: date,
        end: tempFilters.dateRange?.end || ''
      }
    });
  };

  const handleDateToChange = (date: string) => {
    setTempFilters({
      ...tempFilters,
      dateRange: {
        start: tempFilters.dateRange?.start || '',
        end: date
      }
    });
  };

  const handleViewModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onViewModeChange(event.target.value as 'cards' | 'calendar');
  };

  const handleApplyFilters = () => {
    onFiltersChange({
      ...tempFilters,
      priceRange: {
        min: priceRange[0],
        max: priceRange[1]
      }
    });
    const searchParams: SearchParams = {};

    if (tempFilters.category && tempFilters.category.length > 0) {
      searchParams.category = tempFilters.category;
    }

    if (tempFilters.location && tempFilters.location.length > 0) {
      searchParams.region = tempFilters.location;
    }

    if (tempFilters.format && tempFilters.format.length > 0) {
      searchParams.format = tempFilters.format;
    }

    if (tempFilters.dateRange?.start) {
      searchParams.date_start = `${tempFilters.dateRange.start}T00:00:00Z`;
    }

    if (tempFilters.dateRange?.end) {
      searchParams.date_end = `${tempFilters.dateRange.end}T23:59:59Z`;
    }

    if (priceRange[0] > 0 || priceRange[1] < 10000) {
      searchParams.price_min = priceRange[0];
      searchParams.price_max = priceRange[1];
    }

    onApplyFilters(searchParams);
    onClose();
  };

  const clearAllFilters = () => {
    const clearedFilters: EventFilters = {};
    setTempFilters(clearedFilters);
    setPriceRange([0, 10000]);
    onFiltersChange(clearedFilters);
    onApplyFilters({});
  };

  const selectAllLocations = () => {
    setTempFilters({ ...tempFilters, location: [...locations] });
  };

  const selectAllFormats = () => {
    setTempFilters({ ...tempFilters, format: [...formats] });
  };

  const selectAllCategories = () => {
    setTempFilters({ ...tempFilters, category: [...categories] });
  };

  const formatPrice = (value: number) => {
    return value === 0 ? 'Бесплатно' : `${value.toLocaleString('ru-RU')} ₽`;
  };

  return (
    <Drawer open={open} anchor={"right"} onClose={onClose}>
      <Box sx={{ width: 320 }} role="presentation">
        <Typography style={{ padding: '20px', fontWeight: 'bold', fontSize: '18px' }}>
          Фильтры
        </Typography>

        <Box sx={{ p: 2 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>
              Вид отображения
            </FormLabel>
            <RadioGroup
              value={viewMode}
              onChange={handleViewModeChange}
            >
              <FormControlLabel
                value="cards"
                control={<Radio />}
                label="Списком"
              />
              <FormControlLabel
                value="calendar"
                control={<Radio />}
                label="Календарем"
              />
            </RadioGroup>
          </FormControl>
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Дата проведения
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                С
              </Typography>
              <input
                type="date"
                value={tempFilters.dateRange?.start || ''}
                onChange={(e) => handleDateFromChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                По
              </Typography>
              <input
                type="date"
                value={tempFilters.dateRange?.end || ''}
                onChange={(e) => handleDateToChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Стоимость
          </Typography>
          <Slider
            value={priceRange}
            onChange={handlePriceRangeChange}
            valueLabelDisplay="auto"
            valueLabelFormat={formatPrice}
            min={0}
            max={10000}
            step={100}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="textSecondary">
              {formatPrice(priceRange[0])}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatPrice(priceRange[1])}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Город
            </Typography>
            <Button size="small" onClick={selectAllLocations}>
              Все
            </Button>
          </Box>
          <List dense>
            {locations.map((location) => (
              <ListItem key={location} disablePadding>
                <ListItemButton onClick={() => handleLocationChange(location)}>
                  <Checkbox
                    checked={(tempFilters.location || []).includes(location)}
                    onChange={() => handleLocationChange(location)}
                  />
                  <ListItemText primary={location} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Формат
            </Typography>
            <Button size="small" onClick={selectAllFormats}>
              Все
            </Button>
          </Box>
          <List dense>
            {formats.map((format) => (
              <ListItem key={format} disablePadding>
                <ListItemButton onClick={() => handleFormatChange(format)}>
                  <Checkbox
                    checked={(tempFilters.format || []).includes(format)}
                    onChange={() => handleFormatChange(format)}
                  />
                  <ListItemText primary={format} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Направление
            </Typography>
            <Button size="small" onClick={selectAllCategories}>
              Все
            </Button>
          </Box>
          <List dense>
            {categories.map((category) => (
              <ListItem key={category} disablePadding>
                <ListItemButton onClick={() => handleCategoryChange(category)}>
                  <Checkbox
                    checked={(tempFilters.category || []).includes(category)}
                    onChange={() => handleCategoryChange(category)}
                  />
                  <ListItemText primary={category} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider />

        <Box sx={{ px: 2, pb: 2, pt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={clearAllFilters}
            sx={{ flex: 1 }}
          >
            Сбросить
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleApplyFilters}
            sx={{ flex: 1 }}
          >
            Применить
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}