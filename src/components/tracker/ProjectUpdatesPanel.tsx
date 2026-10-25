import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  useTheme,
  LinearProgress,
  Stack,
} from '@mui/material';
import type { Project, ProjectUpdateSummary, User } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useProjectUpdatesQuery, useUsersSummaryQuery, useAuthHeaders } from '../../queries';
import { apiFetch } from '../../api';
import { API_ROUTES } from '../../constants';
import { ProjectNotesPreview } from '../project/ProjectCard';
import {
  UpdateIcon,
  RefreshIcon,
  SearchIcon,
  EditIcon,
  AccessTimeIcon,
  NotificationsActiveIcon,
  ReceiptLongIcon,
  CalendarTodayIcon,
  CheckCircleIcon,
  CompareArrowsIcon,
  ErrorIcon,
} from '../icons';

export interface ProjectUpdatesPanelProps {
  users?: User[];
  onOpenProjectDiff: (project: Project, diffRange: { dateFrom: string; dateTo: string }) => void;
  onEditProject?: (project: Project) => void;
  onViewProject?: (project: Project) => void;
}

type DatePreset = 'yesterday' | 'today' | 'last3days' | 'thisWeek' | 'custom';

// 24-hour clock formatter (DD.MM.YYYY. HH:mm)
export const formatDateTime24h = (isoStr: string) => {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year}. ${hours}:${minutes}`;
  } catch {
    return isoStr;
  }
};

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const clean = d.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${day}.${m}.${y}.`;
  }
  return d;
}

function isLate(deadline: string | null | undefined, done: boolean): boolean {
  if (done || !deadline) return false;
  const clean = deadline.split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3) return false;
  const [y, m, d] = parts;
  const deadlineDate = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return deadlineDate < today;
}

function isNearDeadline(deadline: string | null | undefined, done: boolean, days = 14): boolean {
  if (done || !deadline) return false;
  const clean = deadline.split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3) return false;
  const [y, m, d] = parts;
  const deadlineDate = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

export const ProjectUpdatesPanel: React.FC<ProjectUpdatesPanelProps> = ({
  users: usersProp,
  onOpenProjectDiff,
  onEditProject,
  onViewProject: _onViewProject,
}) => {
  const { t } = useLanguage();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { currentUser, isRestrictedToOwn, canEditProject } = useAuth();
  const isRestricted = isRestrictedToOwn('tracker_updates') || isRestrictedToOwn('tracker_projects') || isRestrictedToOwn('projects');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Helper date calculations
  const calculatePresetRange = (preset: DatePreset): { dateFrom: string; dateTo: string } => {
    const now = new Date();
    const toIso = now.toISOString();

    if (preset === 'today') {
      const startToday = new Date(now);
      startToday.setHours(0, 0, 0, 0);
      return { dateFrom: startToday.toISOString(), dateTo: toIso };
    }

    if (preset === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return { dateFrom: yesterday.toISOString(), dateTo: toIso };
    }

    if (preset === 'last3days') {
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);
      return { dateFrom: threeDaysAgo.toISOString(), dateTo: toIso };
    }

    if (preset === 'thisWeek') {
      const monday = new Date(now);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      return { dateFrom: monday.toISOString(), dateTo: toIso };
    }

    // Default custom fallback to yesterday
    const fallback = new Date(now);
    fallback.setDate(fallback.getDate() - 1);
    fallback.setHours(0, 0, 0, 0);
    return { dateFrom: fallback.toISOString(), dateTo: toIso };
  };

  const [activePreset, setActivePreset] = useState<DatePreset>('yesterday');
  const [range, setRange] = useState<{ dateFrom: string; dateTo: string }>(calculatePresetRange('yesterday'));
  const [customFrom, setCustomFrom] = useState<string>(() => range.dateFrom.slice(0, 16));
  const [customTo, setCustomTo] = useState<string>(() => range.dateTo.slice(0, 16));
  const [search, setSearch] = useState<string>('');
  const [responsibleId, setResponsibleId] = useState<string>(() => (isRestricted && currentUser?.id ? currentUser.id : ''));
  const shouldFetchUsers = !usersProp && !isRestricted && (Boolean(responsibleId) || isUserDropdownOpen);
  const { data: fetchedUsers = [] } = useUsersSummaryQuery({ enabled: shouldFetchUsers });
  const users = usersProp && usersProp.length > 0 ? usersProp : fetchedUsers;

  useEffect(() => {
    if (isRestricted && currentUser?.id && !responsibleId) {
      setResponsibleId(currentUser.id);
    }
  }, [isRestricted, currentUser?.id, responsibleId]);

  // Fetch updates
  const {
    data: updatesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useProjectUpdatesQuery({
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    search: search.trim() || undefined,
    responsibleId: responsibleId || undefined,
    limit: 100,
  });

  const updates = useMemo(() => updatesResponse?.updates || [], [updatesResponse]);

  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();

  const handlePrefetch = useCallback((projectId: string) => {
    if (!projectId || !range.dateFrom) return;

    const q = new URLSearchParams();
    if (range.dateFrom) q.set('dateFrom', range.dateFrom);
    if (range.dateTo) q.set('dateTo', range.dateTo);
    const queryStr = q.toString() ? `?${q.toString()}` : '';

    // Prefetch updates diff
    queryClient.prefetchQuery({
      queryKey: ['projects', 'updates-diff', projectId, range.dateFrom, range.dateTo],
      queryFn: async () => {
        const res = await apiFetch(`${API_ROUTES.PROJECTS.UPDATES_DIFF(projectId)}${queryStr}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to prefetch project updates diff');
        return res.json();
      },
      meta: { silent: true },
      staleTime: 5 * 60_000,
    });

    // Prefetch project details
    queryClient.prefetchQuery({
      queryKey: ['projects', 'details', projectId],
      queryFn: async () => {
        const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}/${projectId}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to prefetch project details');
        return res.json();
      },
      meta: { silent: true },
      staleTime: 5 * 60_000,
    });

    // Prefetch project note
    queryClient.prefetchQuery({
      queryKey: ['projects', 'note', projectId],
      queryFn: async () => {
        const res = await apiFetch(API_ROUTES.PROJECTS.NOTE(projectId), {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to prefetch project note');
        return res.json();
      },
      meta: { silent: true },
      staleTime: 5 * 60_000,
    });
  }, [queryClient, getAuthHeaders, range.dateFrom, range.dateTo]);

  const handlePresetClick = (preset: DatePreset) => {
    setActivePreset(preset);
    if (preset !== 'custom') {
      const newRange = calculatePresetRange(preset);
      setRange(newRange);
      setCustomFrom(newRange.dateFrom.slice(0, 16));
      setCustomTo(newRange.dateTo.slice(0, 16));
    }
  };

  const handleApplyCustomRange = () => {
    if (customFrom && customTo) {
      setRange({
        dateFrom: new Date(customFrom).toISOString(),
        dateTo: new Date(customTo).toISOString(),
      });
    }
  };

  // Convert ProjectUpdateSummary to partial Project for view/diff handlers
  const handleOpenDiff = (updateItem: ProjectUpdateSummary) => {
    const proj: Project = {
      id: updateItem.id,
      name: updateItem.name,
      clientId: updateItem.clientId,
      clientName: updateItem.clientName || '',
      responsible: updateItem.responsible ?? null,
      type: updateItem.type,
      start: updateItem.start ?? null,
      deadline: updateItem.deadline ?? null,
      progress: updateItem.progress,
      done: updateItem.done,
      notesPreview: updateItem.notesPreview,
    };
    onOpenProjectDiff(proj, range);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pb: 4 }}>
      {/* Header and Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? alpha(theme.palette.background.paper, 0.7) : '#ffffff',
          boxShadow: isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
              }}
            >
              <UpdateIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                {t('subTabUpdates')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('projectUpdatesSubtitle')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={t('btnRefresh') || 'Osveži'}>
              <span>
                <IconButton size="small" onClick={() => refetch()} disabled={isFetching} color="primary">
                  <RefreshIcon fontSize="small" sx={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Date Presets Toolbar */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, mr: 0.5, color: 'text.secondary' }}>
            {t('lblTimeSpan')}:
          </Typography>
          <Chip
            size="small"
            label={t('presetYesterdayNow')}
            clickable
            color={activePreset === 'yesterday' ? 'primary' : 'default'}
            variant={activePreset === 'yesterday' ? 'filled' : 'outlined'}
            onClick={() => handlePresetClick('yesterday')}
            sx={{ fontWeight: 600, fontSize: '0.78rem' }}
          />
          <Chip
            size="small"
            label={t('presetToday')}
            clickable
            color={activePreset === 'today' ? 'primary' : 'default'}
            variant={activePreset === 'today' ? 'filled' : 'outlined'}
            onClick={() => handlePresetClick('today')}
            sx={{ fontWeight: 600, fontSize: '0.78rem' }}
          />
          <Chip
            size="small"
            label={t('presetLast3Days')}
            clickable
            color={activePreset === 'last3days' ? 'primary' : 'default'}
            variant={activePreset === 'last3days' ? 'filled' : 'outlined'}
            onClick={() => handlePresetClick('last3days')}
            sx={{ fontWeight: 600, fontSize: '0.78rem' }}
          />
          <Chip
            size="small"
            label={t('presetThisWeek')}
            clickable
            color={activePreset === 'thisWeek' ? 'primary' : 'default'}
            variant={activePreset === 'thisWeek' ? 'filled' : 'outlined'}
            onClick={() => handlePresetClick('thisWeek')}
            sx={{ fontWeight: 600, fontSize: '0.78rem' }}
          />
          <Chip
            size="small"
            label={t('presetCustom')}
            clickable
            color={activePreset === 'custom' ? 'primary' : 'default'}
            variant={activePreset === 'custom' ? 'filled' : 'outlined'}
            onClick={() => handlePresetClick('custom')}
            sx={{ fontWeight: 600, fontSize: '0.78rem' }}
          />
        </Box>

        {/* Custom Range Picker row */}
        {activePreset === 'custom' && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              mb: 2,
              borderRadius: 2,
              bgcolor: isDark ? alpha(theme.palette.background.default, 0.6) : alpha('#f8fafc', 0.9),
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <TextField
              size="small"
              type="datetime-local"
              label={t('lblFromDate')}
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 220 } }}
            />
            <TextField
              size="small"
              type="datetime-local"
              label={t('lblToDate')}
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 220 } }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleApplyCustomRange}
              sx={{ height: 40, px: 2, fontWeight: 600, textTransform: 'none' }}
            >
              {t('btnApply')}
            </Button>
          </Box>
        )}

        {/* Filter and Search Bar */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('searchProjectOrClient')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              },
            }}
            sx={{ minWidth: 260, flexGrow: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }} disabled={isRestricted}>
            <InputLabel>{t('lblResponsiblePerson') || 'Odgovorno lice'}</InputLabel>
            <Select
              value={isRestricted && currentUser?.id ? currentUser.id : responsibleId}
              label={t('lblResponsiblePerson') || 'Odgovorno lice'}
              onChange={(e) => setResponsibleId(e.target.value)}
              onOpen={() => setIsUserDropdownOpen(true)}
              disabled={isRestricted}
            >
              {!isRestricted && <MenuItem value="">{t('allUsers') || 'Svi korisnici'}</MenuItem>}
              {users
                .filter((u) => !isRestricted || u.id === currentUser?.id || (currentUser?.name && u.name === currentUser.name))
                .map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>

        {/* KPI Strip */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('lblTotalUpdatedProjects') || 'Izmenjeno projekata'}:
            </Typography>
            <Chip
              size="small"
              label={updates.length}
              color="primary"
              sx={{ fontWeight: 700, height: 22 }}
            />
          </Box>

          <Box sx={{ ml: 'auto', display: { xs: 'none', md: 'block' } }}>
            <Typography variant="caption" color="text.secondary">
              {formatDateTime24h(range.dateFrom)} — {formatDateTime24h(range.dateTo)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Loading state */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : updates.length === 0 ? (
        /* Empty state */
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: isDark ? alpha(theme.palette.background.paper, 0.4) : '#ffffff',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {t('emptyProjectUpdates')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 2 }}>
            {t('noProjectUpdatesDesc')}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CalendarTodayIcon />}
            onClick={() => handlePresetClick('last3days')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('presetLast3Days')}
          </Button>
        </Paper>
      ) : (
        /* Standard Project Cards Grid */
        <Grid container spacing={2}>
          {updates.map((item) => {
            const hasProgressChange = item.changedFields.includes('progress');
            const hasDeadlineChange = item.changedFields.includes('deadline');
            const hasStatusChange = item.changedFields.includes('done');
            const late = isLate(item.deadline, item.done);
            const nearDeadline = !late && isNearDeadline(item.deadline, item.done);

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                <Card
                  variant="outlined"
                  onMouseEnter={() => handlePrefetch(item.id)}
                  onFocus={() => handlePrefetch(item.id)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2.5,
                    overflow: 'visible',
                    position: 'relative',
                    borderColor: late
                      ? 'error.main'
                      : nearDeadline
                      ? '#ff9800'
                      : 'divider',
                    borderWidth: late || nearDeadline ? 2 : 1,
                    borderStyle: 'solid',
                    bgcolor: late
                      ? 'rgba(211, 47, 47, 0.03)'
                      : nearDeadline
                      ? 'rgba(255, 152, 0, 0.04)'
                      : isDark
                      ? alpha(theme.palette.background.paper, 0.8)
                      : '#ffffff',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      zIndex: 10,
                      borderColor: 'primary.main',
                      boxShadow: isDark
                        ? '0 6px 24px rgba(0, 0, 0, 0.4)'
                        : '0 6px 20px rgba(0, 0, 0, 0.06)',
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2,
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      '&:last-child': { pb: 2 },
                    }}
                  >
                    {/* Top Row: Status / Change flags + Action icons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, minHeight: 28 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {item.done ? (
                          <Chip
                            size="small"
                            label={t('statusCompleted')}
                            color="success"
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                          />
                        ) : late ? (
                          <Chip
                            icon={<ErrorIcon fontSize="small" />}
                            label={t('statOverdueUrgent') || 'Kasni'}
                            color="error"
                            size="small"
                            sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 700 }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label={t('statusInProgress')}
                            color="primary"
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={t('reviewChanges')}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDiff(item)}
                            color="primary"
                            sx={{ p: 0.5 }}
                          >
                            <CompareArrowsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {onEditProject && (
                          (() => {
                            const proj: Project = {
                              id: item.id,
                              name: item.name,
                              clientId: item.clientId,
                              clientName: item.clientName || '',
                              responsible: item.responsible ?? null,
                              type: item.type,
                              start: item.start ?? null,
                              deadline: item.deadline ?? null,
                              progress: item.progress,
                              done: item.done,
                              notesPreview: item.notesPreview,
                            };
                            if (!canEditProject(proj)) return null;
                            return (
                              <Tooltip title={t('btnEdit')}>
                                <IconButton
                                  size="small"
                                  onClick={() => onEditProject(proj)}
                                  color="default"
                                  sx={{ p: 0.5 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            );
                          })()
                        )}
                      </Box>
                    </Box>

                    {/* Client Name */}
                    {(item.clientName || item.client?.name) && (
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'primary.main',
                          fontWeight: 700,
                          fontSize: '1rem',
                          lineHeight: 1.3,
                          mb: 0.25,
                        }}
                      >
                        {item.clientName || item.client?.name}
                      </Typography>
                    )}

                    {/* Project Name */}
                    <Typography
                      variant="h6"
                      onClick={() => handleOpenDiff(item)}
                      sx={{
                        mb: 1,
                        lineHeight: 1.3,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'color 0.15s ease',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      {item.name}
                    </Typography>

                    {/* Service Type and Change Chips */}
                    <Stack direction="row" spacing={0.75} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        label={item.type}
                        size="small"
                        color={item.done ? 'default' : 'primary'}
                        variant={item.done ? 'outlined' : 'filled'}
                        sx={{ height: 22, fontSize: '0.72rem' }}
                      />

                      {hasProgressChange && (
                        <Chip
                          size="small"
                          label={t('pillProgressChanged')}
                          color="info"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                        />
                      )}

                      {hasDeadlineChange && (
                        <Chip
                          size="small"
                          label={t('pillDeadlineChanged')}
                          color="warning"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                        />
                      )}

                      {hasStatusChange && (
                        <Chip
                          size="small"
                          label={t('pillStatusChanged')}
                          color="secondary"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                        />
                      )}

                      {(item.addedRemindersCount > 0 || item.updatedRemindersCount > 0) && (
                        <Chip
                          size="small"
                          icon={<NotificationsActiveIcon sx={{ fontSize: '14px !important' }} />}
                          label={
                            item.addedRemindersCount > 0
                              ? `+${item.addedRemindersCount} podsetnik`
                              : `${item.updatedRemindersCount} izmenjen podsetnik`
                          }
                          color="error"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                        />
                      )}

                      {(item.addedInvoicesCount > 0 || item.updatedInvoicesCount > 0) && (
                        <Chip
                          size="small"
                          icon={<ReceiptLongIcon sx={{ fontSize: '14px !important' }} />}
                          label={
                            item.addedInvoicesCount > 0
                              ? `+${item.addedInvoicesCount} faktura`
                              : `${item.updatedInvoicesCount} izmenjena faktura`
                          }
                          color="info"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                        />
                      )}
                    </Stack>

                    {/* Notes Preview */}
                    {item.notesPreview && item.notesPreview.trim().length > 0 && (
                      <ProjectNotesPreview
                        projectId={item.id}
                        notesPreview={item.notesPreview}
                        onOpenModal={() => handleOpenDiff(item)}
                      />
                    )}

                    {/* Bottom Section: Last edit, Responsible, Progress, Dates & Review button */}
                    <Box sx={{ mt: 'auto', pt: 1 }}>
                      {/* Last Edit Timestamp */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, color: 'text.secondary', fontSize: '0.76rem' }}>
                        <AccessTimeIcon sx={{ fontSize: 15 }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {t('lblLastEdit')}: <strong>{formatDateTime24h(item.lastModifiedAt)}</strong> ({item.lastModifiedBy})
                        </Typography>
                      </Box>

                      {/* Responsible */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.82rem' }}>
                        {t('lblResponsiblePerson') || 'Odgovorno lice'}: <strong>{item.responsible || '—'}</strong>
                      </Typography>

                      {/* Progress Bar */}
                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {t('progress') || 'Progress'}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {item.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={item.progress}
                          color={item.done ? 'info' : late ? 'error' : item.progress > 75 ? 'success' : 'primary'}
                          sx={{ height: 7, borderRadius: 3.5 }}
                        />
                      </Box>

                      {/* Dates */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'text.secondary', mb: 2 }}>
                        <span>{t('start')}: {fmtDate(item.start ?? null)}</span>
                        <span>
                          {t('deadline')}:{' '}
                          <strong
                            style={{
                              color: late ? '#d32f2f' : nearDeadline ? '#ed6c02' : 'inherit',
                              fontWeight: late || nearDeadline ? 800 : 700,
                            }}
                          >
                            {fmtDate(item.deadline ?? null)}
                          </strong>
                        </span>
                      </Box>

                      {/* Review Changes Button */}
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        startIcon={<CompareArrowsIcon />}
                        onClick={() => handleOpenDiff(item)}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          textTransform: 'none',
                          borderRadius: 2,
                          py: 0.8,
                          boxShadow: '0 2px 8px rgba(46, 125, 50, 0.25)',
                        }}
                      >
                        {t('reviewChanges')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default ProjectUpdatesPanel;
