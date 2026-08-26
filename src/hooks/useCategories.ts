import { useState, useCallback } from 'react';
import type { Category, AppFetchers } from '../types';
import { useCrudOperations } from './useCrudOperations';

/**
 * Manages category state and all category-related API operations.
 */
export function useCategories(
  authHeaders: () => Record<string, string>,
  fetchers: AppFetchers,
  onDeleteConfirm: (message: string, onConfirm: () => void) => void,
) {
  const [categories, setCategories] = useState<Category[]>([]);

  const onSuccess = useCallback(() => {
    fetchers.fetchCategories();
    fetchers.fetchStats();
  }, [fetchers]);

  const { handleSave, handleDelete } = useCrudOperations<Category>({
    basePath: '/api/categories',
    items: categories,
    authHeaders,
    onSuccess,
    onDeleteConfirm,
    deleteConfirmMessageKey: 'confirmDeleteCategory',
    errorSaveMessageKey: 'errorSavingCategory',
    permissionDeniedMessageKey: 'permissionDeniedCategories',
  });

  return {
    categories,
    setCategories,
    handleSaveCategory: handleSave,
    handleDeleteCategory: handleDelete,
  };
}
