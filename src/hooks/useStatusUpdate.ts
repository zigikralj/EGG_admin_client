import { useCallback } from 'react';
import { apiFetch } from '../api';

interface StatusUpdateConfig<T> {
  basePath: string;
  items: T[];
  setItems: (items: T[]) => void;
  authHeaders: () => Record<string, string>;
  onSuccess: () => void;
}

/**
 * Hook for optimistically updating an item's status via PATCH /api/{resource}/{id}/status
 */
export function useStatusUpdate<T extends { id: string }>(config: StatusUpdateConfig<T>) {
  const { basePath, items, setItems, authHeaders, onSuccess } = config;

  return useCallback(
    async (id: string, updateData: Record<string, any>) => {
      const previous = [...items];
      // Optimistic update
      setItems(items.map(item => (item.id === id ? { ...item, ...updateData } : item)));

      try {
        const res = await apiFetch(`${basePath}/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify(updateData),
        });
        if (res.ok) {
          onSuccess();
        } else {
          // Revert on error
          setItems(previous);
          const err = await res.json().catch(() => ({}));
          alert(err.error || err.message || 'Failed to update status');
        }
      } catch (e) {
        // Revert on exception
        setItems(previous);
        console.error(e);
      }
    },
    [basePath, items, setItems, authHeaders, onSuccess]
  );
}

interface ApiActionConfig {
  authHeaders: () => Record<string, string>;
  onSuccess: () => void;
}

/**
 * Hook for generic API actions (e.g., POST to /approve, /reject) without optimistic updates.
 */
export function useApiAction(config: ApiActionConfig) {
  const { authHeaders, onSuccess } = config;

  return useCallback(
    async (path: string, method: string = 'POST', body?: any) => {
      try {
        const res = await apiFetch(path, {
          method,
          headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...authHeaders(),
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (res.ok) {
          onSuccess();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.error || err.message || 'Action failed.');
        }
      } catch (e) {
        console.error(e);
      }
    },
    [authHeaders, onSuccess]
  );
}
