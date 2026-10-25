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
  useActivityLogToggleMutation,
  useActivityLogUpdateSettingsMutation,
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
  AccumulatedActivity,
  UserActivityGroup,
  UserSummary,
  KpiStats
} from '../../components/activityLogs';

// Re-export types for backward compatibility
export type { AccumulatedActivity, Session, UserActivityGroup, UserSummary, KpiStats };

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

  // Lightweight SQL-aggregated summary (KPIs and user header metrics only)
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
    error: summaryError,
    refetch: refetchSummary,
  } = useActivityLogsSummaryQuery(fromIso);

  // Pre-aggregated monthly overview stats
  const {
    data: monthlyStats = [],
    isLoading: isMonthlyLoading,
    isFetching: isMonthlyFetching,
    refetch: refetchMonthly,
  } = useActivityMonthlyStatsQuery(undefined, { enabled: activeTab === 'monthly' });

  const { data: users = [] } = useUsersSummaryQuery();
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u as any])), [users]);
  const { clearAllMutation, deleteSessionMutation } = useActivityLogsMutations();

  const { hasPermission } = useAuth();
  const { data: statusData, isLoading: isStatusLoading } = useActivityLogStatusQuery();
  const toggleMutation = useActivityLogToggleMutation();
  const updateSettingsMutation = useActivityLogUpdateSettingsMutation();

  const isLoggingEnabled = statusData?.enabled ?? true;
  const retentionDays = statusData?.retentionDays ?? 30;
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [customRetentionOpen, setCustomRetentionOpen] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState<string>('30');

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    type: 'all'
  });

  const handleToggleClick = (nextChecked: boolean) => {
    if (!nextChecked) {
      setConfirmDeactivateOpen(true);
    } else {
      toggleMutation.mutate(true);
    }
  };

  const handleDeactivateConfirm = () => {
    setConfirmDeactivateOpen(false);
    toggleMutation.mutate(false);
  };

  const handleRetentionSelect = (value: number | 'custom') => {
    if (value === 'custom') {
      setCustomDaysInput(String(retentionDays));
      setCustomRetentionOpen(true);
    } else {
      updateSettingsMutation.mutate({ retentionDays: value });
    }
  };

  const handleCustomRetentionSubmit = () => {
    const parsed = parseInt(customDaysInput, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 3650) {
      updateSettingsMutation.mutate({ retentionDays: parsed });
      setCustomRetentionOpen(false);
    }
  };

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
      console.error("Delete failed", err);
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

  if (!hasPermission('activityLogs', 'view')) {
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
          {language === 'en' ? 'Loading activity history...' : 'Učitavanje istorije aktivnosti...'}
        </Typography>
      </Box>
    );
  }

  if (summaryError && activeTab === 'daily') {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{language === 'en' ? 'Error loading activity logs.' : 'Greška pri učitavanju istorije aktivnosti.'}</Typography>
        <Button variant="outlined" onClick={() => refetchSummary()} sx={{ mt: 2 }}>
          {language === 'en' ? 'Try Again' : 'Pokušaj ponovo'}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Title & Refresh Header */}
      <ActivityLogsHeader
        isLoggingEnabled={isLoggingEnabled}
        retentionDays={retentionDays}
        isStatusLoading={isStatusLoading}
        isFetching={activeTab === 'daily' ? isSummaryFetching : isMonthlyFetching}
        isPendingToggle={toggleMutation.isPending}
        isPendingSettings={updateSettingsMutation.isPending}
        onAnalyticsClick={() => navigate(PAGE_ROUTES.ACTIVITY_ANALYTICS)}
        onToggleClick={handleToggleClick}
        onRetentionSelect={handleRetentionSelect}
        onClearAllClick={() => setDeleteDialog({ isOpen: true, type: 'all' })}
        onRefreshClick={handleRefreshClick}
        language={language}
        t={t}
        isDark={isDark}
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
          <Tab value="daily" label={language === 'en' ? 'Daily Activities' : 'Dnevne aktivnosti'} />
          <Tab value="monthly" label={language === 'en' ? 'Monthly Overview' : 'Mesečni pregled'} />
        </Tabs>
      </Box>

      {/* Banner if logging is deactivated */}
      {!isLoggingEnabled && (
        <Alert
          severity="warning"
          variant="outlined"
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
              {language === 'en' ? 'Loading monthly stats...' : 'Učitavanje mesečnih statistika...'}
            </Typography>
          </Box>
        ) : (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{language === 'en' ? 'User' : 'Korisnik'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{language === 'en' ? 'Month' : 'Mesec'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{language === 'en' ? 'Total Time' : 'Ukupno vreme'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{language === 'en' ? 'Sessions' : 'Sesije'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{language === 'en' ? 'Actions' : 'Radnje'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{language === 'en' ? 'Top Modules' : 'Glavni moduli'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {language === 'en' ? 'No monthly statistics recorded yet.' : 'Nema zabeleženih mesečnih statistika.'}
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
                  onDeleteSession={handleDeleteSession}
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
      <ActivityLogsDialogs
        deleteDialog={deleteDialog}
        onCloseDeleteDialog={() => setDeleteDialog({ isOpen: false, type: 'all' })}
        onConfirmDelete={handleDeleteConfirm}
        confirmDeactivateOpen={confirmDeactivateOpen}
        onCloseDeactivateDialog={() => setConfirmDeactivateOpen(false)}
        onConfirmDeactivate={handleDeactivateConfirm}
        customRetentionOpen={customRetentionOpen}
        onCloseCustomRetentionDialog={() => setCustomRetentionOpen(false)}
        onSubmitCustomRetention={handleCustomRetentionSubmit}
        customDaysInput={customDaysInput}
        onCustomDaysInputChange={setCustomDaysInput}
        isCustomRetentionPending={updateSettingsMutation.isPending}
        language={language}
        t={t}
      />
    </Box>
  );
};

export default ActivityLogsPage;
