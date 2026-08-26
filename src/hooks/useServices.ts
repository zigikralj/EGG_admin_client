import { useState, useCallback } from 'react';
import type { Service, AppFetchers } from '../types';
import { useCrudOperations } from './useCrudOperations';

/**
 * Manages service state and all service-related API operations.
 */
export function useServices(
  authHeaders: () => Record<string, string>,
  fetchers: AppFetchers,
  onDeleteConfirm: (message: string, onConfirm: () => void) => void,
) {
  const [services, setServices] = useState<Service[]>([]);

  const onSuccess = useCallback(() => {
    fetchers.fetchServices();
    fetchers.fetchStats();
  }, [fetchers]);

  const { handleSave, handleDelete } = useCrudOperations<Service>({
    basePath: '/api/services',
    items: services,
    authHeaders,
    onSuccess,
    onDeleteConfirm,
    deleteConfirmMessageKey: 'confirmDeleteService',
    errorSaveMessageKey: 'errorSavingService',
    permissionDeniedMessageKey: 'permissionDeniedServices',
  });

  return {
    services,
    setServices,
    handleSaveService: handleSave,
    handleDeleteService: handleDelete,
  };
}
