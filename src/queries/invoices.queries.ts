import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES, TIME_MS } from '../constants';
import { buildPaginationQueryParams, useGenericMutations, useGenericActionMutation } from './queryUtils';
import type { Invoice, PaginatedResponse } from '../types';

export function useInvoicesSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery<Invoice[]>({
    queryKey: ['invoices', 'summary'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.INVOICES.BASE}?fields=summary`);
      if (!res.ok) throw new Error('Failed to fetch invoices summary');
      return res.json();
    },
    staleTime: TIME_MS.ONE_MINUTE,
  });
}

export function useInvoiceDetailsQuery(id: string | null | undefined, enabled: boolean = true) {
  return useQuery<Invoice | null>({
    queryKey: ['invoices', 'details', id],
    enabled: Boolean(id && enabled),
    queryFn: async () => {
      if (!id) return null;
      const res = await apiFetch(`${API_ROUTES.INVOICES.BASE}/${id}`);
      if (!res.ok) throw new Error('Failed to fetch invoice details');
      return res.json();
    },
    staleTime: TIME_MS.ONE_MINUTE,
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

      const res = await apiFetch(`${API_ROUTES.INVOICES.BASE}?${q.toString()}`);
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
    staleTime: TIME_MS.THIRTY_SECONDS,
  });
}

export function useInvoicesMutations() {
  const generic = useGenericMutations<Invoice>({
    basePath: API_ROUTES.INVOICES.BASE,
    queryKeyToInvalidate: ['invoices'],
    additionalInvalidates: [['projects', 'details'], ['autocomplete', 'invoices'], ['provided-services']],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteInvoice',
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
