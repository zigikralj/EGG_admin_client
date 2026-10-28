import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { fetchWithDeltaSync } from '../utils/deltaSync';
import { API_ROUTES } from '../constants';
import { useAuthHeaders, buildPaginationQueryParams, useGenericMutations } from './queryUtils';
import type { ProvidedService, PaginatedResponse } from '../types';

export function useProvidedServicesQuery(
  filtersOrOptions?: { clientId?: string; enabled?: boolean },
  options?: { enabled?: boolean }
) {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const clientId = filtersOrOptions && 'clientId' in filtersOrOptions ? filtersOrOptions.clientId : undefined;
  const isEnabled = options?.enabled ?? (filtersOrOptions && 'enabled' in filtersOrOptions ? filtersOrOptions.enabled : true) ?? true;
  const queryKey = clientId ? (['provided-services', { clientId }] as const) : (['provided-services'] as const);

  return useQuery<ProvidedService[]>({
    queryKey,
    enabled: isEnabled,
    queryFn: async () => {
      if (clientId) {
        const url = `${API_ROUTES.PROVIDED_SERVICES.BASE}?clientId=${encodeURIComponent(clientId)}`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch client provided services');
        const data = await res.json();
        return Array.isArray(data) ? data : data.items || [];
      }
      return fetchWithDeltaSync<ProvidedService>({
        url: API_ROUTES.PROVIDED_SERVICES.BASE,
        queryKey,
        queryClient,
        headers: getAuthHeaders(),
      });
    },
  });
}

export interface PaginatedProvidedServicesParams {
  page: number;
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  serviceId?: string;
  clientId?: string;
  projectId?: string;
  invoiceId?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  isWasteDisposalOnly?: boolean;
  missingInvoice?: boolean;
}

export function usePaginatedProvidedServicesQuery(params: PaginatedProvidedServicesParams, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  const queryKey = [
    'provided-services',
    'paginated',
    params.page,
    params.rowsPerPage,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.status,
    params.serviceId,
    params.clientId,
    params.projectId,
    params.invoiceId,
    params.dateFrom,
    params.dateTo,
    params.dateField,
    params.isWasteDisposalOnly,
    params.missingInvoice,
  ] as const;

  return useQuery<PaginatedResponse<ProvidedService>>({
    queryKey,
    enabled,
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
          status: params.status && params.status !== 'all' ? params.status : undefined,
          serviceId: params.serviceId && params.serviceId !== 'all' ? params.serviceId : undefined,
          clientId: params.clientId && params.clientId !== 'all' ? params.clientId : undefined,
          projectId: params.projectId && params.projectId !== 'all' ? params.projectId : undefined,
          invoiceId: params.invoiceId && params.invoiceId !== 'all' ? params.invoiceId : undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
          dateField: params.dateField || undefined,
          isWasteDisposalOnly: params.isWasteDisposalOnly ? true : undefined,
          missingInvoice: params.missingInvoice ? true : undefined,
        }
      );
      const res = await apiFetch(`${API_ROUTES.PROVIDED_SERVICES.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch paginated provided services');
      const data = await res.json();
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
          hasMore: false,
        };
      }
      return data;
    },
    staleTime: 30000,
  });
}

export function useProvidedServicesMutations() {
  return useGenericMutations<ProvidedService>({
    basePath: API_ROUTES.PROVIDED_SERVICES.BASE,
    queryKeyToInvalidate: ['provided-services'],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteProvidedService' as any,
  });
}
