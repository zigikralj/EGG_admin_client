import React from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useLanguage } from '../context/LanguageContext';
import { CalendarTodayIcon, CloseIcon } from './icons';

export interface DateFieldOption {
  value: string;
  label: string;
}

export interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (range: { startDate: string; endDate: string }) => void;
  dateField?: string;
  dateFieldOptions?: DateFieldOption[];
  onDateFieldChange?: (field: string) => void;
  compact?: boolean;
}

/**
 * Returns { startDate: 'YYYY-MM-01', endDate: 'YYYY-MM-LastDay' } for the current month in local time.
 */
export function getThisMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 to 11
  const monthStr = String(month + 1).padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onDateChange,
  dateField,
  dateFieldOptions,
  onDateFieldChange,
}) => {
  const { t } = useLanguage();
  const thisMonth = getThisMonthRange();
  const isThisMonthActive = startDate === thisMonth.startDate && endDate === thisMonth.endDate;
  const hasActiveDateRange = Boolean(startDate || endDate);

  const handleThisMonthClick = () => {
    if (isThisMonthActive) {
      onDateChange({ startDate: '', endDate: '' });
    } else {
      onDateChange(getThisMonthRange());
    }
  };

  const handleClear = () => {
    onDateChange({ startDate: '', endDate: '' });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {/* Date Field Selector (if multiple date fields supported) */}
      {dateFieldOptions && dateFieldOptions.length > 0 && onDateFieldChange && (
        <FormControl fullWidth size="small">
          <InputLabel sx={{ fontSize: '0.8rem' }}>{t('lblDateField')}</InputLabel>
          <Select
            value={dateField || dateFieldOptions[0].value}
            label={t('lblDateField')}
            onChange={(e) => onDateFieldChange(e.target.value)}
            sx={{ fontSize: '0.8rem', height: 36 }}
          >
            {dateFieldOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.8rem' }}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Quick Filter Button & Clear Button */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <Button
          size="small"
          variant={isThisMonthActive ? 'contained' : 'outlined'}
          color={isThisMonthActive ? 'primary' : 'inherit'}
          onClick={handleThisMonthClick}
          startIcon={<CalendarTodayIcon sx={{ fontSize: '13px !important' }} />}
          sx={{
            fontSize: '0.75rem',
            py: 0.35,
            px: 1.25,
            textTransform: 'none',
            borderRadius: 1.5,
            fontWeight: 600,
            lineHeight: 1.4,
            borderColor: isThisMonthActive ? 'primary.main' : 'divider',
          }}
        >
          {t('lblThisMonth')}
        </Button>

        {hasActiveDateRange && (
          <Button
            size="small"
            color="error"
            onClick={handleClear}
            startIcon={<CloseIcon sx={{ fontSize: '13px !important' }} />}
            sx={{
              fontSize: '0.7rem',
              py: 0.2,
              px: 0.75,
              textTransform: 'none',
            }}
          >
            {t('btnClearDate')}
          </Button>
        )}
      </Box>

      {/* From and To Date Inputs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <TextField
          size="small"
          type="date"
          label={t('lblFromDate')}
          value={startDate}
          onChange={(e) => onDateChange({ startDate: e.target.value, endDate })}
          slotProps={{
            inputLabel: { shrink: true, sx: { fontSize: '0.8rem' } },
            htmlInput: { sx: { fontSize: '0.75rem', p: '6px 8px' } },
          }}
        />
        <TextField
          size="small"
          type="date"
          label={t('lblToDate')}
          value={endDate}
          onChange={(e) => onDateChange({ startDate, endDate: e.target.value })}
          slotProps={{
            inputLabel: { shrink: true, sx: { fontSize: '0.8rem' } },
            htmlInput: { sx: { fontSize: '0.75rem', p: '6px 8px' } },
          }}
        />
      </Box>
    </Box>
  );
};
