import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  Button,
  Stack,
  Alert,
  AlertTitle,
  useTheme,
  alpha
} from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  useActivityLogsQuery,
  useUsersQuery,
  useActivityLogsMutations,
  useActivityLogStatusQuery,
  useActivityLogToggleMutation,
  useActivityLogUpdateSettingsMutation,
} from '../../queries';
import {
  useActivityLogsData,
  ActivityLogsHeader,
  ActivityLogsKpiCards,
  ActivityLogsFilters,
  UserActivityCard,
  ActivityLogsDialogs,
  formatDateOnly,
} from '../../components/activityLogs';
import type {
  DeleteDialogState,
  TimeRangeFilter,
  Session,
  AccumulatedActivity,
  UserActivityGroup,
  KpiStats
} from '../../components/activityLogs';

// Re-export types for backward compatibility
export type { AccumulatedActivity, Session, UserActivityGroup, KpiStats };

export const ActivityLogsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Filters & Controls state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [timeRangeFilter, setTimeRangeFilter] = useState<TimeRangeFilter>('ALL');
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fromIso = useMemo(() => {
    if (timeRangeFilter === 'ALL') return undefined;
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

  const { data: logs, isLoading, isFetching, error, refetch } = useActivityLogsQuery(fromIso);
  const { data: users } = useUsersQuery();
  const { clearAllMutation, deleteSessionMutation } = useActivityLogsMutations();

  const { hasPermission } = useAuth();
  const { data: statusData, isLoading: isStatusLoading } = useActivityLogStatusQuery();
  const toggleMutation = useActivityLogToggleMutation();
  const updateSettingsMutation = useActivityLogUpdateSettingsMutation();

  const isLoggingEnabled = statusData?.enabled ?? true;
  const retentionDays = statusData?.retentionDays ?? 90;
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [customRetentionOpen, setCustomRetentionOpen] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState<string>('90');

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

  const toggleUserAccordion = (userId: string, defaultExpanded: boolean = true) => {
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

  // Process data using our custom hook
  const { processedData, filteredUsers, kpiStats } = useActivityLogsData({
    logs,
    users,
    timeRangeFilter,
    selectedUserFilter,
    searchQuery,
    t,
    language
  });

  const userOptions = useMemo(() => {
    return processedData.map(u => ({
      userId: u.userId,
      userName: u.userName
    }));
  }, [processedData]);

  if (!hasPermission('activityLogs', 'view')) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error" variant="h6" sx={{ fontWeight: 600 }}>
          {t('activityLogsAdminOnly')}
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={44} color="primary" />
        <Typography variant="body2" color="text.secondary">
          {language === 'en' ? 'Loading activity history...' : 'Učitavanje istorije aktivnosti...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{language === 'en' ? 'Error loading activity logs.' : 'Greška pri učitavanju istorije aktivnosti.'}</Typography>
        <Button variant="outlined" onClick={() => refetch()} sx={{ mt: 2 }}>
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
        isFetching={isFetching}
        isPendingToggle={toggleMutation.isPending}
        isPendingSettings={updateSettingsMutation.isPending}
        onToggleClick={handleToggleClick}
        onRetentionSelect={handleRetentionSelect}
        onClearAllClick={() => setDeleteDialog({ isOpen: true, type: 'all' })}
        onRefreshClick={() => refetch()}
        language={language}
        t={t}
        isDark={isDark}
      />

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
      {filteredUsers.length === 0 ? (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 5, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {t('noSessionsFound')}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2.5}>
          {filteredUsers.map(userGroup => (
            <UserActivityCard
              key={userGroup.userId}
              userGroup={userGroup}
              isExpanded={expandedUsers[userGroup.userId] ?? true}
              onToggleUser={() => toggleUserAccordion(userGroup.userId)}
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
