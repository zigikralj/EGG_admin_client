import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { TranslationKeys } from '../i18n/translations';
import type { SaveResult } from '../types';

export function useAuthHeaders() {
  const { currentUser } = useAuth();
  return () => {
    const headers: Record<string, string> = {};
    if (currentUser?.id) headers['X-User-Id'] = currentUser.id;

    const sid =
      (typeof localStorage !== 'undefined' ? localStorage.getItem('activity_session_id') : null) ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('activity_session_id') : null);
    if (sid) {
      headers['X-Session-Id'] = sid;
    }

    return headers;
  };
}

// --- Pagination Helpers ---

export interface BasePaginationParams {
  page: number; // 0-indexed from MUI
  rowsPerPage: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
}

export function buildPaginationQueryParams(
  params: BasePaginationParams,
  extraFilters: Record<string, any> = {}
): URLSearchParams {
  const q = new URLSearchParams();
  q.set('page', String(params.page + 1)); // Convert 0-indexed to 1-indexed for backend
  q.set('limit', String(params.rowsPerPage));
  if (params.sortColumn) q.set('sortBy', params.sortColumn);
  if (params.sortDirection) q.set('sortOrder', params.sortDirection);
  if (params.searchQuery?.trim()) q.set('search', params.searchQuery.trim());

  Object.entries(extraFilters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      if (Array.isArray(val)) {
        if (val.length > 0) q.set(key, val.join(','));
      } else {
        q.set(key, String(val));
      }
    }
  });

  return q;
}

// --- Generic Mutations ---

export interface MutationConfig {
  basePath: string;
  queryKeyToInvalidate: string[];
  errorSaveMessageKey: keyof TranslationKeys;
  deleteConfirmMessageKey?: keyof TranslationKeys;
  permissionDeniedMessageKey?: keyof TranslationKeys;
  additionalInvalidates?: string[][]; // keys to invalidate additionally (like stats)
}

export function useGenericMutations<T extends { id?: string }>(config: MutationConfig) {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: config.queryKeyToInvalidate });
    if (config.additionalInvalidates) {
      config.additionalInvalidates.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    }
    queryClient.invalidateQueries({ queryKey: ['history'] });
    queryClient.invalidateQueries({ queryKey: ['history-diff'] });
    queryClient.invalidateQueries({ queryKey: ['history-version'] });
  };

  const saveMutationFn = async (data: Partial<T>) => {
    const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    let res;
    if (data.id) {
      res = await apiFetch(`${config.basePath}/${data.id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
    } else {
      res = await apiFetch(config.basePath, { method: 'POST', headers, body: JSON.stringify(data) });
    }

    if (res.ok) {
      const savedItem = await res.json().catch(() => ({}));
      return { success: true, id: savedItem?.id, data: savedItem };
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || t(config.errorSaveMessageKey));
    }
  };

  const saveMutation = useMutation<SaveResult, Error, Partial<T>>({
    mutationFn: saveMutationFn,
    onSuccess: () => {
      invalidate();
    },
  });

  const silentSaveMutation = useMutation<SaveResult, Error, Partial<T>>({
    mutationFn: saveMutationFn,
    meta: { silent: true },
    onSuccess: () => {
      invalidate();
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await apiFetch(`${config.basePath}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t(config.permissionDeniedMessageKey || 'permissionDeniedOnlyOwnProjects'));
      }
    },
    onSuccess: () => {
      invalidate();
    },
  });

  return {
    saveMutation,
    silentSaveMutation,
    deleteMutation,
    handleSave: async (data: Partial<T>, options?: { silent?: boolean }): Promise<SaveResult> => {
      try {
        if (options?.silent) {
          return await silentSaveMutation.mutateAsync(data);
        }
        return await saveMutation.mutateAsync(data);
      } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
      }
    },
    handleSilentSave: async (data: Partial<T>): Promise<SaveResult> => {
      try {
        return await silentSaveMutation.mutateAsync(data);
      } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
      }
    },
    handleDelete: async (id: string, onDeleteConfirm: (msg: string, cb: () => void) => void) => {
      if (config.deleteConfirmMessageKey) {
        onDeleteConfirm(t(config.deleteConfirmMessageKey), async () => {
          try {
            await deleteMutation.mutateAsync(id);
          } catch (e: any) {
            alert(e.message);
          }
        });
      } else {
        try {
          await deleteMutation.mutateAsync(id);
        } catch (e: any) {
          alert(e.message);
        }
      }
    },
  };
}

export function useGenericActionMutation() {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      path,
      method = 'POST',
      body,
      queryKeysToInvalidate,
    }: {
      path: string;
      method?: string;
      body?: any;
      queryKeysToInvalidate: string[][];
    }) => {
      const res = await apiFetch(path, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Action failed');
      }
      return { queryKeysToInvalidate };
    },
    onSuccess: (data) => {
      data.queryKeysToInvalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['history-diff'] });
      queryClient.invalidateQueries({ queryKey: ['history-version'] });
    },
  });
}
