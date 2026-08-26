import { useState, useCallback } from 'react';
import type { Reminder, SaveResult, AppFetchers } from '../types';
import { apiFetch } from '../api';
import { useCrudOperations } from './useCrudOperations';

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

  const handleStatusChangeReminder = useCallback(
    async (id: string, status: string) => {
      const previousReminders = [...reminders];
      setReminders(reminders.map((r) => (r.id === id ? { ...r, status } : r)));

      try {
        const res = await apiFetch(`/api/reminders/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          fetchers.fetchReminders();
          fetchers.fetchStats();
        } else {
          setReminders(previousReminders);
          const err = await res.json();
          alert(err.error || 'Failed to update reminder status');
        }
      } catch (e) {
        setReminders(previousReminders);
        console.error(e);
      }
    },
    [reminders, authHeaders, fetchers]
  );

  return {
    reminders,
    setReminders,
    handleSaveReminder: handleSave,
    handleDeleteReminder: handleDelete,
    handleStatusChangeReminder,
  };
}
