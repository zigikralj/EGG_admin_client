import { useState, useCallback } from 'react';
import type { Permit, WasteCatalog, AppFetchers } from '../types';
import { useCrudOperations } from './useCrudOperations';
import { apiFetch } from '../api';

/**
 * Manages permit state and all permit-related API operations.
 */
export function usePermits(
  authHeaders: () => Record<string, string>,
  fetchers: AppFetchers,
  onDeleteConfirm: (message: string, onConfirm: () => void) => void,
) {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [wasteCatalog, setWasteCatalog] = useState<WasteCatalog[]>([]);

  const fetchWasteCatalog = useCallback(async (params?: { page?: number; limit?: number; search?: string }) => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search);
      const url = `/api/waste-catalog${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await apiFetch(url, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        setWasteCatalog(items);
        return data;
      }
    } catch (err) {
      console.error('Error fetching waste catalog:', err);
    }
  }, [authHeaders]);

  const onSuccess = useCallback(() => {
    fetchers.fetchPermits();
    fetchers.fetchStats();
  }, [fetchers]);

  const { handleSave, handleDelete } = useCrudOperations<Permit>({
    basePath: '/api/permits',
    items: permits,
    authHeaders,
    onSuccess,
    onDeleteConfirm,
    deleteConfirmMessageKey: 'confirmDeletePermit',
    errorSaveMessageKey: 'errorSavingProject',
    permissionDeniedMessageKey: 'permissionDeniedOnlyOwnProjects',
  });

  return {
    permits,
    setPermits,
    wasteCatalog,
    setWasteCatalog,
    fetchWasteCatalog,
    handleSavePermit: handleSave,
    handleDeletePermit: handleDelete,
  };
}
