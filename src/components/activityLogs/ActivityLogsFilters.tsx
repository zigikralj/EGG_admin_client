import React from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { SearchIcon } from '../icons';
import type { TimeRangeFilter } from './types';

export interface ActivityLogsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedUserFilter: string;
  onUserFilterChange: (userId: string) => void;
  timeRangeFilter: TimeRangeFilter;
  onTimeRangeChange: (range: TimeRangeFilter) => void;
  userOptions: { userId: string; userName: string }[];
  t: (key: any) => string;
}

export const ActivityLogsFilters: React.FC<ActivityLogsFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedUserFilter,
  onUserFilterChange,
  timeRangeFilter,
  onTimeRangeChange,
  userOptions,
  t
}) => {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mb: 3 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', width: '100%' }}>
          {/* Search Input */}
          <TextField
            size="small"
            placeholder={t('searchActivities')}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }
            }}
            sx={{ flexGrow: 1 }}
          />

          {/* User Dropdown */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
            <InputLabel id="user-filter-label">{t('colUser')}</InputLabel>
            <Select
              labelId="user-filter-label"
              value={selectedUserFilter}
              label={t('colUser')}
              onChange={e => onUserFilterChange(e.target.value)}
            >
              <MenuItem value="ALL">{t('allUsers')}</MenuItem>
              {userOptions.map(u => (
                <MenuItem key={u.userId} value={u.userId}>
                  {u.userName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Time Period Filter */}
          <ToggleButtonGroup
            size="small"
            value={timeRangeFilter}
            exclusive
            onChange={(_, next) => {
              if (next) onTimeRangeChange(next);
            }}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              display: 'flex',
              flexShrink: 0,
              height: 40,
              alignSelf: { xs: 'stretch', md: 'center' },
              '& .MuiToggleButton-root': {
                px: { xs: 1, sm: 1.5 },
                py: 0,
                textTransform: 'none',
                fontSize: '0.8125rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                lineHeight: '38px',
              }
            }}
          >
            <ToggleButton value="TODAY">{t('filterToday')}</ToggleButton>
            <ToggleButton value="WEEK">{t('filterLast7Days')}</ToggleButton>
            <ToggleButton value="MONTH">{t('filterLast30Days')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </CardContent>
    </Card>
  );
};
