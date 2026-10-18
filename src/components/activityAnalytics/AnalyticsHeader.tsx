import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowBackIcon,
  InsightsIcon,
  RefreshIcon,
} from '../icons';
import type { User } from '../../types';
import { useRoleLabels } from '../../hooks/useRoleLabels';

export type RangePreset = '7d' | '30d' | '90d' | 'custom';

const AVAILABLE_ROLES = ['Administrator', 'Manager', 'User', 'Accountant'];

export interface AnalyticsHeaderProps {
  onBack: () => void;
  preset: RangePreset;
  onPresetChange: (preset: RangePreset) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  selectedRoles: string[];
  onRolesChange: (roles: string[]) => void;
  selectedUserIds: string[];
  onUserIdsChange: (userIds: string[]) => void;
  excludeAdminPages: boolean;
  onExcludeAdminPagesChange: (exclude: boolean) => void;
  onRefresh: () => void;
  isFetching: boolean;
  users?: User[];
  t: (key: any) => string;
  language: string;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  onBack,
  preset,
  onPresetChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  selectedRoles,
  onRolesChange,
  selectedUserIds,
  onUserIdsChange,
  excludeAdminPages,
  onExcludeAdminPagesChange,
  onRefresh,
  isFetching,
  users = [],
  t,
  language: _language,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { getRoleBadgeLabel } = useRoleLabels();

  return (
    <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Top Bar: Back Button, Title, and Refresh */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={onBack}
            startIcon={<ArrowBackIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 600,
              color: 'text.secondary',
              borderColor: 'divider',
            }}
          >
            {t('back')}
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InsightsIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {t('activityAnalytics')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('analyticsHeaderSubtitle')}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Tooltip title={t('refreshData')}>
          <span>
            <IconButton
              onClick={onRefresh}
              disabled={isFetching}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                animation: isFetching ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Filter Strip */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: 2.5,
          bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Preset Selector */}
        <ToggleButtonGroup
          size="small"
          value={preset}
          exclusive
          onChange={(_, val) => {
            if (val) onPresetChange(val);
          }}
          sx={{
            height: 36,
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              px: 1.5,
            },
          }}
        >
          <ToggleButton value="7d">7 {t('daysShort') || 'd'}</ToggleButton>
          <ToggleButton value="30d">30 {t('daysShort') || 'd'}</ToggleButton>
          <ToggleButton value="90d">90 {t('daysShort') || 'd'}</ToggleButton>
          <ToggleButton value="custom">{t('custom')}</ToggleButton>
        </ToggleButtonGroup>

        {/* Custom Date Pickers (if preset === 'custom') */}
        {preset === 'custom' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              type="date"
              size="small"
              label={t('from')}
              value={customStartDate}
              onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 145, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.8rem' } }}
            />
            <Typography variant="body2" color="text.secondary">-</Typography>
            <TextField
              type="date"
              size="small"
              label={t('to')}
              value={customEndDate}
              onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 145, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.8rem' } }}
            />
          </Box>
        )}

        {/* Roles Filter Multi-Select */}
        <FormControl size="small" sx={{ minWidth: 140, maxWidth: 200 }}>
          <InputLabel sx={{ fontSize: '0.8rem' }}>{t('roles')}</InputLabel>
          <Select
            multiple
            value={selectedRoles}
            label={t('roles')}
            onChange={(e) => onRolesChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            renderValue={(selected) =>
              selected.length === 0 ? t('all') : selected.map((r) => getRoleBadgeLabel(r)).join(', ')
            }
            sx={{ height: 36, fontSize: '0.8rem' }}
          >
            {AVAILABLE_ROLES.map((r) => (
              <MenuItem key={r} value={r} sx={{ py: 0.5, fontSize: '0.82rem' }}>
                <Checkbox size="small" checked={selectedRoles.includes(r)} />
                <ListItemText primary={getRoleBadgeLabel(r)} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Users Filter Multi-Select */}
        <FormControl size="small" sx={{ minWidth: 150, maxWidth: 220 }}>
          <InputLabel sx={{ fontSize: '0.8rem' }}>{t('tabUsers')}</InputLabel>
          <Select
            multiple
            value={selectedUserIds}
            label={t('tabUsers')}
            onChange={(e) => onUserIdsChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            renderValue={(selected) => {
              if (selected.length === 0) return t('all');
              if (selected.length === 1) {
                const u = users.find((x) => x.id === selected[0]);
                return u?.name || selected[0];
              }
              return `${selected.length} ${t('selected')}`;
            }}
            sx={{ height: 36, fontSize: '0.8rem' }}
          >
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id} sx={{ py: 0.5, fontSize: '0.82rem' }}>
                <Checkbox size="small" checked={selectedUserIds.includes(u.id)} />
                <ListItemText
                  primary={u.name}
                  secondary={u.role ? getRoleBadgeLabel(u.role) : undefined}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Exclude Admin Pages Toggle */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.2,
            py: 0.35,
            borderRadius: 2,
            border: '1px solid',
            borderColor: excludeAdminPages
              ? (isDark ? alpha('#16a34a', 0.4) : alpha('#16a34a', 0.3))
              : 'divider',
            bgcolor: excludeAdminPages
              ? (isDark ? alpha('#16a34a', 0.1) : alpha('#16a34a', 0.05))
              : 'transparent',
            ml: 'auto',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={excludeAdminPages}
                onChange={(e) => onExcludeAdminPagesChange(e.target.checked)}
                color="success"
                size="small"
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  color: excludeAdminPages ? 'success.main' : 'text.secondary',
                  userSelect: 'none',
                }}
              >
                {t('analyticsExcludeAdminPages')}
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>
      </Box>
    </Box>
  );
};
