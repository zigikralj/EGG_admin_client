import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';
import { useAuthHeaders, buildPaginationQueryParams, useGenericMutations } from './queryUtils';
import type { Service, Category, PaginatedResponse } from '../types';

export interface PaginatedServicesParams {
  page: number; // 0-indexed from MUI
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  group?: string;
  frequency?: string;
}

export function usePaginatedServicesQuery(params: PaginatedServicesParams, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  const queryKey = [
    'services',
    'paginated',
    params.page,
    params.rowsPerPage,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.group,
    params.frequency,
  ] as const;

  return useQuery<PaginatedResponse<Service>>({
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
          group: params.group,
          frequency: params.frequency,
        }
      );

      const res = await apiFetch(`${API_ROUTES.SERVICES.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch paginated services');
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
  });
}

export function useServiceDetailsQuery(id: string | null | undefined, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Service | null>({
    queryKey: ['services', 'details', id],
    enabled: Boolean(id && enabled),
    queryFn: async () => {
      if (!id) return null;
      const res = await apiFetch(`${API_ROUTES.SERVICES.BASE}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch service details');
      return res.json();
    },
  });
}

export function useCategoriesQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Category[]>({
    queryKey: ['categories'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.CATEGORIES.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });
}

export function useServicesMutations() {
  return useGenericMutations<Service>({
    basePath: API_ROUTES.SERVICES.BASE,
    queryKeyToInvalidate: ['services'],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteService',
  });
}

export function useCategoriesMutations() {
  return useGenericMutations<Category>({
    basePath: API_ROUTES.CATEGORIES.BASE,
    queryKeyToInvalidate: ['categories'],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteCategory' as any,
  });
}
