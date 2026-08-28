import { useCallback } from 'react';
import type { SaveResult } from '../types';
import { apiFetch } from '../api';
import { useLanguage } from '../context/LanguageContext';
import type { TranslationKeys } from '../i18n/translations';

interface CrudConfig<T> {
  basePath: string; // e.g., '/api/projects'
  items: T[];       // The current items array (for merging on PUT)
  authHeaders: () => Record<string, string>;
  onSuccess: () => void;
  onDeleteConfirm: (message: string, onConfirm: () => void) => void;
  deleteConfirmMessageKey: keyof TranslationKeys; // e.g., 'confirmDeleteProject'
  errorSaveMessageKey: keyof TranslationKeys; // e.g., 'errorSavingProject'
  permissionDeniedMessageKey?: keyof TranslationKeys; // e.g., 'permissionDeniedOnlyOwnProjects'
}

export function useCrudOperations<T extends { id: string }>(config: CrudConfig<T>) {
  const { t } = useLanguage();
  const { 
    basePath, 
    items, 
    authHeaders, 
    onSuccess, 
    onDeleteConfirm, 
    deleteConfirmMessageKey, 
    errorSaveMessageKey,
    permissionDeniedMessageKey = 'permissionDeniedOnlyOwnProjects'
  } = config;

  const handleDelete = useCallback((id: string) => {
    onDeleteConfirm(t(deleteConfirmMessageKey), async () => {
      try {
        const res = await apiFetch(`${basePath}/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (res.ok) {
          onSuccess();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.error || t(permissionDeniedMessageKey));
        }
      } catch (e) {
        console.error(e);
      }
    });
  }, [basePath, authHeaders, onSuccess, onDeleteConfirm, t, deleteConfirmMessageKey, permissionDeniedMessageKey]);

  const handleSave = useCallback(async (data: Partial<T>): Promise<SaveResult> => {
    try {
      let res;
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };

      if (data.id) {
        const existing = items.find((item) => item.id === data.id);
        const payload = existing ? { ...existing, ...data } : data;
        res = await apiFetch(`${basePath}/${data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiFetch(basePath, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        const savedItem = await res.json().catch(() => ({}));
        onSuccess();
        return { success: true, id: savedItem?.id, data: savedItem };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || err.message || t(errorSaveMessageKey) };
      }
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e?.message || t(errorSaveMessageKey) };
    }
  }, [basePath, items, authHeaders, onSuccess, t, errorSaveMessageKey]);

  return { handleSave, handleDelete };
}
