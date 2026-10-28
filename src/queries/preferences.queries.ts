import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useAuthHeaders } from './queryUtils';
import type { SortState } from '../types';

export function usePreferencesQuery() {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Record<string, any>>({
    queryKey: ['preferences', currentUser?.id],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.PREFERENCES.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch preferences');
      const data = await res.json();
      if (currentUser?.id && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(`ekos_user_preferences_${currentUser.id}`, JSON.stringify(data));
        } catch {}
      }
      return data;
    },
    initialData: () => {
      if (currentUser?.id && typeof localStorage !== 'undefined') {
        try {
          const cached = localStorage.getItem(`ekos_user_preferences_${currentUser.id}`);
          if (cached) return JSON.parse(cached);
        } catch {}
      }
      return undefined;
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function usePreferencesMutations() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();

  const updatePreferenceMutation = useMutation({
    mutationKey: ['preferences', currentUser?.id],
    meta: { silent: true },
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await apiFetch(API_ROUTES.PREFERENCES.BY_KEY(key), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('Failed to update preference');
      return res.json();
    },
    onMutate: async ({ key, value }) => {
      const qKey = ['preferences', currentUser?.id];
      await queryClient.cancelQueries({ queryKey: qKey });
      const previousPreferences = queryClient.getQueryData<Record<string, any>>(qKey);
      const updated = {
        ...(previousPreferences || {}),
        [key]: value,
      };
      queryClient.setQueryData<Record<string, any>>(qKey, updated);
      if (currentUser?.id && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(`ekos_user_preferences_${currentUser.id}`, JSON.stringify(updated));
        } catch {}
      }
      return { previousPreferences };
    },
    onError: (_err, _variables, context) => {
      const qKey = ['preferences', currentUser?.id];
      if (context?.previousPreferences) {
        queryClient.setQueryData(qKey, context.previousPreferences);
        if (currentUser?.id && typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(`ekos_user_preferences_${currentUser.id}`, JSON.stringify(context.previousPreferences));
          } catch {}
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences', currentUser?.id] });
    },
  });

  return { updatePreferenceMutation };
}

export function usePreferencesMutation() {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['preferences'],
    meta: { silent: true },
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await apiFetch(API_ROUTES.PREFERENCES.BY_KEY(key), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('Failed to update preference');
      return { key, value };
    },
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['preferences'] });
      const previous = queryClient.getQueryData<Record<string, any>>(['preferences']);
      if (previous) {
        queryClient.setQueryData(['preferences'], { ...previous, [key]: value });
      }
      return { previous };
    },
    onError: (_err, _newPref, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['preferences'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
}

/**
 * Clean helper hook for views to access and mutate their own preferences (column visibility,
 * pagination rows, rows-per-page options, sorting, and quick filters) without prop-drilling from App.tsx.
 */
export function useTablePreferences(tableKey: string) {
  const { data: userPreferences = {} } = usePreferencesQuery();
  const { updatePreferenceMutation } = usePreferencesMutations();

  const updatePreference = useCallback(
    (key: string, value: any) => updatePreferenceMutation.mutate({ key, value }),
    [updatePreferenceMutation]
  );

  return {
    userPreferences,
    updatePreference,
    visibleColumns: userPreferences[`cols_${tableKey}`] as string[] | undefined,
    onVisibleColumnsChange: (cols: string[]) => updatePreference(`cols_${tableKey}`, cols),
    rowsPerPageOptions: userPreferences[`rowsPerPageOptions_${tableKey}`] as number[] | undefined,
    onRowsPerPageOptionsChange: (opts: number[]) => updatePreference(`rowsPerPageOptions_${tableKey}`, opts),
    rowsPerPage: userPreferences[`rowsPerPage_${tableKey}`] as number | undefined,
    onRowsPerPageChange: (rpp: number) => updatePreference(`rowsPerPage_${tableKey}`, rpp),
    sortState: userPreferences[`sort_${tableKey}`] as SortState | undefined,
    onSortChange: (sort: SortState) => updatePreference(`sort_${tableKey}`, sort),
    quickFilters: userPreferences[`quick_filter_${tableKey}`],
    onQuickFiltersChange: (val: any) => updatePreference(`quick_filter_${tableKey}`, val),
  };
}
