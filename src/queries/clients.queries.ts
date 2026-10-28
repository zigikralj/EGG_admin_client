import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { fetchWithDeltaSync } from '../utils/deltaSync';
import { API_ROUTES } from '../constants';
import { useAuthHeaders, buildPaginationQueryParams, useGenericMutations } from './queryUtils';
import type { Client, PaginatedResponse } from '../types';

export function useClientsQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const queryKey = ['clients'] as const;

  return useQuery<Client[]>({
    queryKey,
    enabled: options?.enabled ?? true,
    queryFn: () =>
      fetchWithDeltaSync<Client>({
        url: API_ROUTES.CLIENTS.BASE,
        queryKey,
        queryClient,
        headers: getAuthHeaders(),
      }),
  });
}

export function useClientsSummaryQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Array<{ id: string; name: string; city?: string }>>({
    queryKey: ['clients', 'summary'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.CLIENTS.BASE}?fields=summary`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch clients summary');
      return res.json();
    },
    staleTime: 60_000,
  });
}

export interface PaginatedClientsParams {
  page: number; // 0-indexed from MUI
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  city?: string;
  hasPermit?: string;
}

export function usePaginatedClientsQuery(params: PaginatedClientsParams, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  const queryKey = [
    'clients',
    'paginated',
    params.page,
    params.rowsPerPage,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.city,
    params.hasPermit,
  ] as const;

  return useQuery<PaginatedResponse<Client>>({
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
          city: params.city,
          hasPermit: params.hasPermit,
        }
      );

      const res = await apiFetch(`${API_ROUTES.CLIENTS.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch paginated clients');
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
    enabled,
    staleTime: 30_000,
  });
}

export function useClientsMutations() {
  return useGenericMutations<Client>({
    basePath: API_ROUTES.CLIENTS.BASE,
    queryKeyToInvalidate: ['clients'],
    additionalInvalidates: [['permits']],
    errorSaveMessageKey: 'errorSavingClient',
    deleteConfirmMessageKey: 'confirmDeleteClient',
    permissionDeniedMessageKey: 'permissionDeniedClients',
  });
}
