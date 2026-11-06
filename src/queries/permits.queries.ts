import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { syncWasteCatalog, sortWasteCatalog, upsertCatalogItemInDB, getMemoryCachedCatalog } from '../utils/wasteCatalogStorage';
import { API_ROUTES, TIME_MS } from '../constants';
import { buildPaginationQueryParams, useGenericMutations } from './queryUtils';
import type { Permit, WasteCatalog, PaginatedResponse } from '../types';

/** Lightweight permits query without nested relations (waste catalogs, reminders, etc.) for linking and dropdowns. */
export function usePermitsSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery<Permit[]>({
    queryKey: ['permits', 'summary'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.PERMITS.BASE}?fields=summary`);
      if (!res.ok) throw new Error('Failed to fetch permits summary');
      return res.json();
    },
    staleTime: TIME_MS.ONE_MINUTE,
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

      const res = await apiFetch(`${API_ROUTES.PERMITS.BASE}?${q.toString()}`);
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
    staleTime: TIME_MS.THIRTY_SECONDS,
  });
}

export function useWasteCatalogQuery(options?: { enabled?: boolean }) {
  return useQuery<WasteCatalog[]>({
    queryKey: ['waste-catalog'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      return syncWasteCatalog();
    },
    initialData: () => getMemoryCachedCatalog() ?? undefined,
    staleTime: TIME_MS.ONE_HOUR,
    gcTime: TIME_MS.ONE_DAY,
  });
}

export function useWasteCatalogMutations() {
  const queryClient = useQueryClient();

  const toggleFrequent = useMutation({
    mutationFn: async ({ id, frequent }: { id: string; frequent?: number | boolean | null }) => {
      const res = await apiFetch(API_ROUTES.WASTE_CATALOG.FREQUENT(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
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
    deleteConfirmMessageKey: 'confirmDeletePermit',
  });
}
