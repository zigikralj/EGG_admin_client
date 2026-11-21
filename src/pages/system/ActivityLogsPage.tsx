import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  Button,
  Stack,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  useActivityLogsSummaryQuery,
  useActivityMonthlyStatsQuery,
  useUsersSummaryQuery,
  useActivityLogsMutations,
  useActivityLogStatusQuery,
} from '../../queries';
import { flushActivityTracker } from '../../hooks/useActivityTracker';
import { PAGE_ROUTES } from '../../constants';
import {
  ActivityLogsHeader,
  ActivityLogsKpiCards,
  ActivityLogsFilters,
  UserActivityCard,
  ActivityLogsDialogs,
  formatDateOnly,
  formatDuration,
} from '../../components/activityLogs';
import type {
  DeleteDialogState,
  TimeRangeFilter,
  Session,
  KpiStats,
} from '../../components/activityLogs';

export const ActivityLogsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Tabs state: Daily feed vs Monthly Rollup Overview
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');

  // Filters & Controls state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [timeRangeFilter, setTimeRangeFilter] = useState<TimeRangeFilter>('TODAY');
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fromIso = useMemo(() => {
    const cutoff = new Date();
    if (timeRangeFilter === 'TODAY') {
      cutoff.setHours(0, 0, 0, 0);
    } else if (timeRangeFilter === 'WEEK') {
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (timeRangeFilter === 'MONTH') {
      cutoff.setDate(cutoff.getDate() - 30);
    }
    return cutoff.toISOString();
  }, [timeRangeFilter]);

  const { hasPermission } = useAuth();
  const canViewLogs = hasPermission('activityLogs', 'view');
  const canDeleteLogs = hasPermission('activityLogs', 'delete');
  const canConfigureLogs = hasPermission('activityLogs', 'configure');
  const canViewAnalytics = hasPermission('activityAnalytics', 'view');

  // Lightweight SQL-aggregated summary (KPIs and user header metrics only)
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
    error: summaryError,
    refetch: refetchSummary,
  } = useActivityLogsSummaryQuery(fromIso, { enabled: canViewLogs });

  // Pre-aggregated monthly overview stats
  const {
    data: monthlyStats = [],
    isLoading: isMonthlyLoading,
    isFetching: isMonthlyFetching,
    refetch: refetchMonthly,
  } = useActivityMonthlyStatsQuery(undefined, { enabled: canViewLogs && activeTab === 'monthly' });

  const { data: users = [] } = useUsersSummaryQuery({ enabled: canViewLogs && activeTab === 'daily' });
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u as any])), [users]);
  const { clearAllMutation, deleteSessionMutation } = useActivityLogsMutations();

  const { data: statusData } = useActivityLogStatusQuery();
  const isLoggingEnabled = statusData?.enabled ?? true;

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    type: 'all'
  });

  React.useEffect(() => {
    void flushActivityTracker(true);
  }, []);

  const handleRefreshClick = async () => {
    await flushActivityTracker(true);
    if (activeTab === 'daily') {
      await queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    } else {
      await refetchMonthly();
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.type === 'all') {
        await clearAllMutation.mutateAsync();
      } else if (deleteDialog.type === 'session') {
        if (deleteDialog.ids && deleteDialog.ids.length > 0) {
          await deleteSessionMutation.mutateAsync({ ids: deleteDialog.ids });
        } else if (deleteDialog.id) {
          await deleteSessionMutation.mutateAsync({ sessionId: deleteDialog.id });
        }
      }
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleteDialog({ isOpen: false, type: 'all' });
    }
  };

  const handleDeleteSession = (session: Session) => {
    setDeleteDialog({
      isOpen: true,
      type: 'session',
      id: session.sessionId,
      ids: session.logs.map(l => l.id),
      label: `${t('sessionNumber')} ${formatDateOnly(session.startTime, language)} (${session.userName || session.userId})`
    });
  };

  const toggleUserAccordion = (userId: string, defaultExpanded: boolean = false) => {
    setExpandedUsers(prev => {
      const current = prev[userId] !== undefined ? prev[userId] : defaultExpanded;
      return {
        ...prev,
        [userId]: !current
      };
    });
  };

  const toggleSessionAccordion = (sessionId: string, defaultExpanded: boolean = false) => {
    setExpandedSessions(prev => {
      const current = prev[sessionId] !== undefined ? prev[sessionId] : defaultExpanded;
      return {
        ...prev,
        [sessionId]: !current
      };
    });
  };

  const toggleRowDetail = (rowKey: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };

  const kpiStats: KpiStats = useMemo(() => {
    return summaryData?.kpiStats ?? {
      totalUsers: 0,
      activeToday: 0,
      totalSessions: 0,
      totalTrackedSeconds: 0,
      topModule: null,
      topModulePercent: 0,
    };
  }, [summaryData?.kpiStats]);

  const userSummaries = useMemo(
    () => summaryData?.userSummaries ?? [],
    [summaryData?.userSummaries]
  );

  const userOptions = useMemo(() => {
    return userSummaries.map(u => ({
      userId: u.userId,
      userName: u.userName,
    }));
  }, [userSummaries]);

  const filteredSummaries = useMemo(() => {
    let result = userSummaries;
    if (selectedUserFilter !== 'ALL') {
      result = result.filter(u => u.userId === selectedUserFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(u => {
        const matched = userMap.get(u.userId);
        return (
          u.userName.toLowerCase().includes(q) ||
          (matched?.email && matched.email.toLowerCase().includes(q))
        );
      });
    }
    return result;
  }, [userSummaries, selectedUserFilter, searchQuery, userMap]);

  if (!canViewLogs) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error" variant="h6" sx={{ fontWeight: 600 }}>
          {t('activityLogsAdminOnly')}
        </Typography>
      </Box>
    );
  }

  if (isSummaryLoading && activeTab === 'daily') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={44} color="primary" />
        <Typography variant="body2" color="text.secondary">
          {t('loadingActivityHistory')}
        </Typography>
      </Box>
    );
  }

  if (summaryError && activeTab === 'daily') {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{t('errorLoadingActivityLogs')}</Typography>
        <Button variant="outlined" onClick={() => refetchSummary()} sx={{ mt: 2 }}>
          {t('btnTryAgain')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Title & Refresh Header */}
      <ActivityLogsHeader
        isFetching={activeTab === 'daily' ? isSummaryFetching : isMonthlyFetching}
        onAnalyticsClick={canViewAnalytics ? () => navigate(PAGE_ROUTES.ACTIVITY_ANALYTICS) : undefined}
        onClearAllClick={canDeleteLogs ? () => setDeleteDialog({ isOpen: true, type: 'all' }) : undefined}
        onRefreshClick={handleRefreshClick}
        language={language}
        t={t}
      />

      {/* View Mode Tabs: Daily Activity Feed vs Monthly Overview */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
            },
          }}
        >
          <Tab value="daily" label={t('tabDailyActivities')} />
          <Tab value="monthly" label={t('tabMonthlyOverview')} />
        </Tabs>
      </Box>

      {/* Banner if logging is deactivated */}
      {!isLoggingEnabled && (
        <Alert
          severity="warning"
          variant="outlined"
          action={
            canConfigureLogs ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate(PAGE_ROUTES.SYSTEM_SETTINGS)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {t('goToSystemSettings')}
              </Button>
            ) : undefined
          }
          sx={{
            mb: 3,
            borderRadius: 2.5,
            bgcolor: isDark ? alpha('#f59e0b', 0.08) : alpha('#fef3c7', 0.45),
            borderColor: isDark ? alpha('#f59e0b', 0.3) : alpha('#f59e0b', 0.4),
          }}
        >
          <AlertTitle sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {t('activityLogsStatusPaused')}
          </AlertTitle>
          {t('activityLogsDeactivatedBanner')}
        </Alert>
      )}

      {activeTab === 'monthly' ? (
        /* Monthly Rollup View */
        isMonthlyLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 250, gap: 2 }}>
            <CircularProgress size={36} color="primary" />
            <Typography variant="body2" color="text.secondary">
              {t('loadingMonthlyStats')}
            </Typography>
          </Box>
        ) : (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colUser')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colMonth')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colTotalTime')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colSessions')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colActions')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colTopModules')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {t('noMonthlyStatsYet')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthlyStats.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{item.userName}</TableCell>
                        <TableCell>{item.yearMonth}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{formatDuration(item.totalDurationSeconds)}</TableCell>
                        <TableCell>{item.sessionCount}</TableCell>
                        <TableCell>{item.actionCount}</TableCell>
                        <TableCell>
                          {item.moduleBreakdown && typeof item.moduleBreakdown === 'object' ? (
                            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                              {Object.entries(item.moduleBreakdown)
                                .sort((a, b) => (b[1] as number) - (a[1] as number))
                                .slice(0, 3)
                                .map(([path, seconds]) => (
                                  <Chip
                                    key={path}
                                    size="small"
                                    label={`${path.split('/').pop()}: ${formatDuration(seconds as number)}`}
                                    variant="outlined"
                                    sx={{ fontSize: '0.72rem' }}
                                  />
                                ))}
                            </Box>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )
      ) : (
        /* Daily Activities View */
        <>
          {/* KPI Cards */}
          <ActivityLogsKpiCards
            kpiStats={kpiStats}
            language={language}
            t={t}
            isDark={isDark}
          />

          {/* Filter and Search Bar */}
          <ActivityLogsFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedUserFilter={selectedUserFilter}
            onUserFilterChange={setSelectedUserFilter}
            timeRangeFilter={timeRangeFilter}
            onTimeRangeChange={setTimeRangeFilter}
            userOptions={userOptions}
            t={t}
          />

          {/* Grouped User List */}
          {filteredSummaries.length === 0 ? (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 5, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {t('noSessionsFound')}
              </Typography>
            </Card>
          ) : (
            <Stack spacing={2.5}>
              {filteredSummaries.map(summary => (
                <UserActivityCard
                  key={summary.userId}
                  userSummary={summary}
                  user={userMap.get(summary.userId)}
                  fromIso={fromIso}
                  isExpanded={expandedUsers[summary.userId] ?? false}
                  onToggleUser={() => toggleUserAccordion(summary.userId)}
                  expandedSessions={expandedSessions}
                  onToggleSession={toggleSessionAccordion}
                  expandedRows={expandedRows}
                  onToggleRowDetail={toggleRowDetail}
                  onDeleteSession={canDeleteLogs ? handleDeleteSession : undefined}
                  isDark={isDark}
                  language={language}
                  t={t}
                />
              ))}
            </Stack>
          )}
        </>
      )}

      {/* Dialogs */}
      {canDeleteLogs && (
        <ActivityLogsDialogs
          deleteDialog={deleteDialog}
          onCloseDeleteDialog={() => setDeleteDialog({ isOpen: false, type: 'all' })}
          onConfirmDelete={handleDeleteConfirm}
          language={language}
          t={t}
        />
      )}
    </Box>
  );
};

export default ActivityLogsPage;
