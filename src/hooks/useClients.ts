import { useState, useCallback } from 'react';
import type { Client, SaveResult, AppFetchers } from '../types';
import { useCrudOperations } from './useCrudOperations';

/**
 * Manages client state and all client-related API operations.
 */
export function useClients(
  authHeaders: () => Record<string, string>,
  fetchers: AppFetchers,
  onDeleteConfirm: (message: string, onConfirm: () => void) => void,
) {
  const [clients, setClients] = useState<Client[]>([]);

  const onSuccess = useCallback(() => {
    fetchers.fetchClients();
    fetchers.fetchStats();
  }, [fetchers]);

  const { handleSave, handleDelete } = useCrudOperations<Client>({
    basePath: '/api/clients',
    items: clients,
    authHeaders,
    onSuccess,
    onDeleteConfirm,
    deleteConfirmMessageKey: 'confirmDeleteClient',
    errorSaveMessageKey: 'errorSavingClient',
    permissionDeniedMessageKey: 'permissionDeniedClients',
  });

  return {
    clients,
    setClients,
    handleSaveClient: handleSave,
    handleDeleteClient: handleDelete,
  };
}
