import { useState, useCallback } from 'react';
import type { ProvidedService, AppFetchers } from '../types';
import { useCrudOperations } from './useCrudOperations';

/**
 * Manages provided service state and all provided-service-related API operations.
 */
export function useProvidedServices(
  authHeaders: () => Record<string, string>,
  fetchers: AppFetchers,
  onDeleteConfirm: (message: string, onConfirm: () => void) => void,
) {
  const [providedServices, setProvidedServices] = useState<ProvidedService[]>([]);

  const onSuccess = useCallback(() => {
    fetchers.fetchProvidedServices();
    fetchers.fetchStats();
  }, [fetchers]);

  const { handleSave, handleDelete } = useCrudOperations<ProvidedService>({
    basePath: '/api/provided-services',
    items: providedServices,
    authHeaders,
    onSuccess,
    onDeleteConfirm,
    deleteConfirmMessageKey: 'confirmDeleteProvidedService',
    errorSaveMessageKey: 'errorSavingProject',
    permissionDeniedMessageKey: 'permissionDeniedProvidedServices',
  });

  return {
    providedServices,
    setProvidedServices,
    handleSaveProvidedService: handleSave,
    handleDeleteProvidedService: handleDelete,
  };
}
