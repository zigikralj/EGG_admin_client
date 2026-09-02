import { useState, useCallback } from 'react';
import type { Reminder, AppFetchers } from '../types';
import { useCrudOperations } from './useCrudOperations';
import { useStatusUpdate } from './useStatusUpdate';

/**
 * Manages reminder state and all reminder-related API operations.
 */
export function useReminders(
  authHeaders: () => Record<string, string>,
  fetchers: AppFetchers,
  onDeleteConfirm: (message: string, onConfirm: () => void) => void,
) {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const onSuccess = useCallback(() => {
    fetchers.fetchReminders();
    fetchers.fetchStats();
  }, [fetchers]);

  const { handleSave, handleDelete } = useCrudOperations<Reminder>({
    basePath: '/api/reminders',
    items: reminders,
    authHeaders,
    onSuccess,
    onDeleteConfirm,
    deleteConfirmMessageKey: 'confirmDeleteReminder',
    errorSaveMessageKey: 'errorSavingReminder',
    // Fallback to default permissionDeniedMessageKey for generic error, or we could add 'errorSavingReminder' equivalent
  });

  const updateStatus = useStatusUpdate<Reminder>({
    basePath: '/api/reminders',
    items: reminders,
    setItems: setReminders,
    authHeaders,
    onSuccess,
  });

  const handleStatusChangeReminder = useCallback(
    (id: string, status: string) => updateStatus(id, { status }),
    [updateStatus]
  );

  return {
    reminders,
    setReminders,
    handleSaveReminder: handleSave,
    handleDeleteReminder: handleDelete,
    handleStatusChangeReminder,
  };
}
