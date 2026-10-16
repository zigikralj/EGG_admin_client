import React from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import {
  AccessTimeIcon,
  RefreshIcon,
  DeleteIcon
} from '../icons';

export interface ActivityLogsHeaderProps {
  isLoggingEnabled: boolean;
  retentionDays: number;
  isStatusLoading: boolean;
  isFetching: boolean;
  isPendingToggle: boolean;
  isPendingSettings: boolean;
  onToggleClick: (nextChecked: boolean) => void;
  onRetentionSelect: (value: number | 'custom') => void;
  onClearAllClick: () => void;
  onRefreshClick: () => void;
  language: string;
  t: (key: any) => string;
  isDark: boolean;
}

export const ActivityLogsHeader: React.FC<ActivityLogsHeaderProps> = ({
  isLoggingEnabled,
  retentionDays,
  isStatusLoading,
  isFetching,
  isPendingToggle,
  isPendingSettings,
  onToggleClick,
  onRetentionSelect,
  onClearAllClick,
  onRefreshClick,
  language,
  t,
  isDark
}) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <AccessTimeIcon sx={{ color: 'primary.main', fontSize: 30 }} />
          {t('tabActivityLogs')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {language === 'en'
            ? 'Grouped user sessions and accumulated active usage insights'
            : 'Grupisano po korisnicima i sesijama sa zbirnim prikazom aktivnosti'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Active / Paused Switch */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.4,
            borderRadius: 2,
            border: '1px solid',
            borderColor: isLoggingEnabled
              ? (isDark ? alpha('#16a34a', 0.4) : alpha('#16a34a', 0.3))
              : 'divider',
            bgcolor: isLoggingEnabled
              ? (isDark ? alpha('#16a34a', 0.12) : alpha('#16a34a', 0.06))
              : (isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02)),
            transition: 'all 0.2s ease',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={isLoggingEnabled}
                onChange={(e) => onToggleClick(e.target.checked)}
                color="success"
                size="small"
                disabled={isPendingToggle || isStatusLoading}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  color: isLoggingEnabled ? 'success.main' : 'text.secondary',
                  userSelect: 'none',
                }}
              >
                {isLoggingEnabled ? t('activityLogsStatusActive') : t('activityLogsStatusPaused')}
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>

        {/* Retention Period Setting */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.8,
            px: 1.2,
            py: 0.35,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
            transition: 'all 0.2s ease',
          }}
        >
          <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.82rem',
              color: 'text.secondary',
              fontWeight: 500,
              display: { xs: 'none', sm: 'inline' },
              userSelect: 'none',
            }}
          >
            {t('activityLogsRetention')}:
          </Typography>
          <Select
            size="small"
            variant="standard"
            disableUnderline
            value={[30, 60, 90, 180, 365].includes(retentionDays) ? retentionDays : 'custom'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'custom') {
                onRetentionSelect('custom');
              } else {
                onRetentionSelect(Number(val));
              }
            }}
            disabled={isPendingSettings || isStatusLoading}
            sx={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'text.primary',
              '& .MuiSelect-select': {
                py: 0.2,
                pr: '20px !important',
              },
            }}
          >
            <MenuItem value={30}>{t('retention30Days')}</MenuItem>
            <MenuItem value={60}>{t('retention60Days')}</MenuItem>
            <MenuItem value={90}>{t('retention90Days')}</MenuItem>
            <MenuItem value={180}>{t('retention180Days')}</MenuItem>
            <MenuItem value={365}>{t('retention365Days')}</MenuItem>
            <MenuItem value="custom">
              {![30, 60, 90, 180, 365].includes(retentionDays)
                ? `${retentionDays} ${t('activityLogsRetentionDays')} (${t('retentionCustom')})`
                : t('retentionCustom')}
            </MenuItem>
          </Select>
        </Box>

        <Button
          variant="outlined"
          size="small"
          color="error"
          onClick={onClearAllClick}
          startIcon={<DeleteIcon />}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {language === 'en' ? 'Clear All' : 'Obriši sve'}
        </Button>
        <Tooltip title={language === 'en' ? 'Refresh data' : 'Osveži podatke'}>
          <span>
            <IconButton
              onClick={onRefreshClick}
              disabled={isFetching}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                animation: isFetching ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};
