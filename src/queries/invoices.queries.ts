import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { fetchWithDeltaSync } from '../utils/deltaSync';
import { API_ROUTES } from '../constants';
import { useAuthHeaders, buildPaginationQueryParams, useGenericMutations, useGenericActionMutation } from './queryUtils';
import type { Invoice, PaginatedResponse } from '../types';

export function useInvoicesQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const queryKey = ['invoices'] as const;

  return useQuery<Invoice[]>({
    queryKey,
    enabled: options?.enabled ?? true,
    queryFn: () =>
      fetchWithDeltaSync<Invoice>({
        url: API_ROUTES.INVOICES.BASE,
        queryKey,
        queryClient,
        headers: getAuthHeaders(),
      }),
  });
}

export function useInvoicesSummaryQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Invoice[]>({
    queryKey: ['invoices', 'summary'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.INVOICES.BASE}?fields=summary`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch invoices summary');
      return res.json();
    },
    staleTime: 60_000,
  });
}

export interface PaginatedInvoicesParams {
  page: number; // 0-indexed from MUI
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  clientId?: string;
  projectId?: string;
  currency?: string;
  invoiceType?: string;
  linkedStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
}

export function usePaginatedInvoicesQuery(params: PaginatedInvoicesParams, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  const queryKey = [
    'invoices',
    'paginated',
    params.page,
    params.rowsPerPage,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.status,
    params.clientId,
    params.projectId,
    params.currency,
    params.invoiceType,
    params.linkedStatus,
    params.dateFrom,
    params.dateTo,
    params.dateField,
  ] as const;

  return useQuery<PaginatedResponse<Invoice>>({
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
          currency: params.currency,
          invoiceType: params.invoiceType,
          linkedStatus: params.linkedStatus,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          dateField: params.dateField,
        }
      );

      const res = await apiFetch(`${API_ROUTES.INVOICES.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch paginated invoices');
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

export function useInvoicesMutations() {
  const generic = useGenericMutations<Invoice>({
    basePath: API_ROUTES.INVOICES.BASE,
    queryKeyToInvalidate: ['invoices'],
    additionalInvalidates: [['projects', 'details'], ['autocomplete', 'invoices'], ['provided-services']],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteInvoice' as any,
  });

  const actionMutation = useGenericActionMutation();

  const handleUpdateInvoiceStatus = (id: string, status: string, paymentDate?: string | null) => {
    return actionMutation.mutateAsync({
      path: API_ROUTES.INVOICES.STATUS(id),
      method: 'PATCH',
      body: { status, paymentDate },
      queryKeysToInvalidate: [['invoices'], ['projects', 'details'], ['autocomplete', 'invoices'], ['provided-services']],
    });
  };

  return {
    ...generic,
    handleUpdateInvoiceStatus,
  };
}
