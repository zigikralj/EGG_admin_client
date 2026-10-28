import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { fetchWithDeltaSync } from '../utils/deltaSync';
import { syncWasteCatalog, sortWasteCatalog, upsertCatalogItemInDB, getMemoryCachedCatalog } from '../utils/wasteCatalogStorage';
import { API_ROUTES } from '../constants';
import { useAuthHeaders, buildPaginationQueryParams, useGenericMutations } from './queryUtils';
import type { Permit, WasteCatalog, PaginatedResponse } from '../types';

export function usePermitsQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const queryKey = ['permits'] as const;

  return useQuery<Permit[]>({
    queryKey,
    enabled: options?.enabled ?? true,
    queryFn: () =>
      fetchWithDeltaSync<Permit>({
        url: API_ROUTES.PERMITS.BASE,
        queryKey,
        queryClient,
        headers: getAuthHeaders(),
      }),
  });
}

/** Lightweight permits query without nested relations (waste catalogs, reminders, etc.) for linking and dropdowns. */
export function usePermitsSummaryQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const queryKey = ['permits', 'summary'] as const;

  return useQuery<Permit[]>({
    queryKey,
    enabled: options?.enabled ?? true,
    queryFn: () =>
      fetchWithDeltaSync<Permit>({
        url: `${API_ROUTES.PERMITS.BASE}?fields=summary`,
        queryKey,
        queryClient,
        headers: getAuthHeaders(),
      }),
  });
}

export interface PaginatedPermitsParams {
  page: number; // 0-indexed from MUI
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  permitType?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
}

export function usePaginatedPermitsQuery(params: PaginatedPermitsParams, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  const queryKey = [
    'permits',
    'paginated',
    params.page,
    params.rowsPerPage,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.status,
    params.permitType,
    params.clientId,
    params.dateFrom,
    params.dateTo,
    params.dateField,
  ] as const;

  return useQuery<PaginatedResponse<Permit>>({
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
          permitType: params.permitType,
          clientId: params.clientId,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          dateField: params.dateField,
        }
      );

      const res = await apiFetch(`${API_ROUTES.PERMITS.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch paginated permits');
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

export function useWasteCatalogQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<WasteCatalog[]>({
    queryKey: ['waste-catalog'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      return syncWasteCatalog(getAuthHeaders());
    },
    initialData: () => getMemoryCachedCatalog() ?? undefined,
    staleTime: 1000 * 60 * 60, // 1 hour stale time since catalog updates rarely
    gcTime: 1000 * 60 * 60 * 24, // 24 hours in memory
  });
}

export function useWasteCatalogMutations() {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();

  const toggleFrequent = useMutation({
    mutationFn: async ({ id, frequent }: { id: string; frequent?: number | boolean | null }) => {
      const res = await apiFetch(API_ROUTES.WASTE_CATALOG.FREQUENT(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ frequent }),
      });
      if (!res.ok) throw new Error('Failed to toggle frequent status');
      const updated: WasteCatalog = await res.json();
      await upsertCatalogItemInDB(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<WasteCatalog[]>(['waste-catalog'], (old) => {
        if (!old) return [updated];
        return sortWasteCatalog(old.map((it) => (it.id === updated.id ? updated : it)));
      });
    },
  });

  return { toggleFrequent };
}

export function usePermitsMutations() {
  return useGenericMutations<Permit>({
    basePath: API_ROUTES.PERMITS.BASE,
    queryKeyToInvalidate: ['permits'],
    additionalInvalidates: [['clients']],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeletePermit' as any,
  });
}
