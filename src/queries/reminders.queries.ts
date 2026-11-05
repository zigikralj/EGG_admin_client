import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { buildPaginationQueryParams, useGenericMutations, useGenericActionMutation } from './queryUtils';
import type { Reminder, PaginatedResponse } from '../types';

export interface PaginatedRemindersParams {
  page: number; // 0-indexed from MUI
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  clientId?: string;
  projectId?: string;
  permitId?: string;
  responsible?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
}

export function usePaginatedRemindersQuery(params: PaginatedRemindersParams, enabled: boolean = true) {
  const { currentUser } = useAuth();
  const queryKey = [
    'reminders',
    'paginated',
    currentUser?.id,
    params.page,
    params.rowsPerPage,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.status,
    params.clientId,
    params.projectId,
    params.permitId,
    params.responsible,
    params.dateFrom,
    params.dateTo,
    params.dateField,
  ] as const;

  return useQuery<PaginatedResponse<Reminder>>({
    queryKey,
    queryFn: async () => {
      const q = buildPaginationQueryParams(
        {
          page: params.page,
          rowsPerPage: params.rowsPerPage,
          sortColumn: params.sortBy,
          sortDirection: params.sortOrder,
          searchQuery: params.search,
        },
        {
          status: params.status,
          clientId: params.clientId,
          projectId: params.projectId,
          permitId: params.permitId,
          responsible: params.responsible,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          dateField: params.dateField,
        }
      );

      const res = await apiFetch(`${API_ROUTES.REMINDERS.BASE}?${q.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch paginated reminders');
      const data = await res.json();
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          page: params.page + 1,
          limit: params.rowsPerPage,
          totalPages: Math.ceil(data.length / (params.rowsPerPage || 1)) || 1,
          hasMore: false,
        };
      }
      return data;
    },
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 30_000,
  });
}

export function useRemindersMutations() {
  const generic = useGenericMutations<Reminder>({
    basePath: API_ROUTES.REMINDERS.BASE,
    queryKeyToInvalidate: ['reminders'],
    additionalInvalidates: [['projects', 'details'], ['autocomplete', 'reminders']],
    errorSaveMessageKey: 'errorSavingReminder',
    deleteConfirmMessageKey: 'confirmDeleteReminder',
  });

  const actionMutation = useGenericActionMutation();

  const handleStatusChangeReminder = (id: string, newStatus: string) => {
    return actionMutation.mutateAsync({
      path: API_ROUTES.REMINDERS.STATUS(id),
      method: 'PATCH',
      body: { status: newStatus },
      queryKeysToInvalidate: [['reminders'], ['projects', 'details'], ['autocomplete', 'reminders']],
    });
  };

  return {
    ...generic,
    handleStatusChangeReminder,
  };
}
