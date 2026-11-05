import React, { useState } from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { ReminderPanel } from '../../components/tracker/ReminderPanel';
import { AddIcon } from '../../components/icons';
import {
  useRemindersMutations,
  useTablePreferences,
} from '../../queries';
import { useLanguage } from '../../context/LanguageContext';

export interface TrackerRemindersPageProps {}

export const TrackerRemindersPage: React.FC<TrackerRemindersPageProps> = () => {
  const { t } = useLanguage();

  const {
    rowsPerPageOptions,
    onRowsPerPageOptionsChange,
    rowsPerPage,
    onRowsPerPageChange,
    quickFilters,
    onQuickFiltersChange,
  } = useTablePreferences('tracker_reminders');

  const [newReminderTrigger, setNewReminderTrigger] = useState(0);
  const [remindersTotalCount, setRemindersTotalCount] = useState<number>(0);

  const {
    handleSave: onSaveReminder,
    handleDelete: onDeleteReminderMutation,
    handleStatusChangeReminder: onStatusChangeReminder,
  } = useRemindersMutations();

  return (
    <Box sx={{ width: '100%', py: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('remindersTitle')}
          </Typography>
          <Chip label={remindersTotalCount} size="small" color="primary" sx={{ fontWeight: 700 }} />
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setNewReminderTrigger((prev) => prev + 1)}
          size="small"
          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
        >
          {t('btnNewReminder')}
        </Button>
      </Box>
      <ReminderPanel
        isFullHeight
        hideNotch
        onSaveReminder={onSaveReminder}
        onDeleteReminder={(id) => onDeleteReminderMutation(id, (_, cb) => cb())}
        onStatusChangeReminder={onStatusChangeReminder}
        openNewReminderTrigger={newReminderTrigger}
        onNewReminderTriggerHandled={() => setNewReminderTrigger(0)}
        quickFilters={quickFilters}
        onQuickFiltersChange={onQuickFiltersChange}
        rowsPerPageOptions={rowsPerPageOptions}
        onRowsPerPageOptionsChange={onRowsPerPageOptionsChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        onTotalCountChange={setRemindersTotalCount}
      />
    </Box>
  );
};

export default TrackerRemindersPage;
