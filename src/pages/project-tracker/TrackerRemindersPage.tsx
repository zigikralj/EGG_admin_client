import React, { useState } from 'react';
import { Box } from '@mui/material';
import { ReminderPanel } from '../../components/tracker/ReminderPanel';
import {
  useRemindersQuery,
  useProjectsQuery,
  useClientsSummaryQuery,
  useUsersSummaryQuery,
  useRemindersMutations,
  useTablePreferences,
} from '../../queries';
import { useLanguage } from '../../context/LanguageContext';
import { useLoading } from '../../context/LoadingContext';

export interface TrackerRemindersPageProps {}

export const TrackerRemindersPage: React.FC<TrackerRemindersPageProps> = () => {
  const { t } = useLanguage();
  const { withLoading } = useLoading();

  const {
    rowsPerPageOptions,
    onRowsPerPageOptionsChange,
    rowsPerPage,
    onRowsPerPageChange,
    quickFilters,
    onQuickFiltersChange,
  } = useTablePreferences('tracker_reminders');

  const [newReminderTrigger, setNewReminderTrigger] = useState(0);

  const { data: reminders = [], refetch: refetchReminders, isRefetching: isRefetchingReminders } = useRemindersQuery();
  const { data: projects = [] } = useProjectsQuery();
  const { data: clients = [] } = useClientsSummaryQuery();
  const { data: users = [] } = useUsersSummaryQuery();

  const {
    handleSave: onSaveReminder,
    handleDelete: onDeleteReminderMutation,
    handleStatusChangeReminder: onStatusChangeReminder,
  } = useRemindersMutations();

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <ReminderPanel
        isFullHeight
        hideNotch
        projects={projects}
        reminders={reminders}
        clients={clients}
        users={users}
        onSaveReminder={onSaveReminder}
        onDeleteReminder={(id) => onDeleteReminderMutation(id, (_, cb) => cb())}
        onStatusChangeReminder={onStatusChangeReminder}
        openNewReminderTrigger={newReminderTrigger}
        onNewReminderTriggerHandled={() => setNewReminderTrigger(0)}
        myRemindersOnly={Boolean(quickFilters)}
        onMyRemindersOnlyChange={(val) => onQuickFiltersChange(val)}
        rowsPerPageOptions={rowsPerPageOptions}
        onRowsPerPageOptionsChange={onRowsPerPageOptionsChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        onRefresh={() => withLoading(() => refetchReminders(), t('loadingRefreshing') || 'Refreshing data...')}
        isRefreshing={isRefetchingReminders}
      />
    </Box>
  );
};

export default TrackerRemindersPage;
