import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';
import { buildPaginationQueryParams, type BasePaginationParams } from './queryUtils';
import type { Contract, ContractTemplate, SaveResult } from '../types';

export interface PaginatedContractsResponse {
  items: Contract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedContractTemplatesResponse {
  items: ContractTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const CONTRACTS_QUERY_KEY = ['contracts'];
export const CONTRACT_TEMPLATES_QUERY_KEY = ['contractTemplates'];

// Query: Paginated Contracts
export function usePaginatedContractsQuery(
  pagination: BasePaginationParams,
  filters?: {
    search?: string;
    status?: string;
    clientId?: string;
    projectId?: string;
    responsibleId?: string;
    dateFrom?: string;
    dateTo?: string;
    dateField?: string;
    sortBy?: string;
    sortOrder?: string;
  },
  options?: { enabled?: boolean }
) {
  const params = buildPaginationQueryParams(pagination);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.clientId && filters.clientId !== 'all') params.append('clientId', filters.clientId);
  if (filters?.projectId && filters.projectId !== 'all') params.append('projectId', filters.projectId);
  if (filters?.responsibleId && filters.responsibleId !== 'all') params.append('responsibleId', filters.responsibleId);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.dateField) params.append('dateField', filters.dateField);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  return useQuery<PaginatedContractsResponse>({
    queryKey: [...CONTRACTS_QUERY_KEY, params.toString()],
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.CONTRACTS.BASE}?${params.toString()}`);
      if (!res.ok) throw new Error('Neuspešno učitavanje ugovora');
      return res.json();
    },
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled !== false,
  });
}

// Query: Single Contract Details
export function useContractDetailsQuery(id: string | null | undefined, options?: { enabled?: boolean }) {
  return useQuery<Contract>({
    queryKey: [...CONTRACTS_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Contract ID is required');
      const res = await apiFetch(API_ROUTES.CONTRACTS.BY_ID(id));
      if (!res.ok) throw new Error('Neuspešno učitavanje detalja ugovora');
      return res.json();
    },
    enabled: Boolean(id) && options?.enabled !== false,
  });
}

// Query: Summary Contracts for quick dropdowns
export function useContractsSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery<Contract[]>({
    queryKey: [...CONTRACTS_QUERY_KEY, 'summary'],
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.CONTRACTS.BASE}?fields=summary`);
      if (!res.ok) throw new Error('Neuspešno učitavanje ugovora');
      return res.json();
    },
    enabled: options?.enabled !== false,
    staleTime: 60 * 1000,
  });
}

// Mutations: Contracts
export function useContractsMutations() {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (contractData: Partial<Contract>): Promise<Contract> => {
      const isEdit = Boolean(contractData.id);
      const url = isEdit
        ? API_ROUTES.CONTRACTS.BY_ID(contractData.id!)
        : API_ROUTES.CONTRACTS.BASE;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Neuspešno čuvanje ugovora');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await apiFetch(API_ROUTES.CONTRACTS.BY_ID(id), {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Neuspešno brisanje ugovora');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const handleSave = async (data: Partial<Contract>): Promise<SaveResult> => {
    try {
      const contract = await saveMutation.mutateAsync(data);
      return { success: true, data: contract, id: contract.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Greška pri čuvanju ugovora' };
    }
  };

  const handleDelete = (id: string, confirmFn?: (msg: string, cb: () => void) => void) => {
    const doDelete = () => deleteMutation.mutate(id);
    if (confirmFn) {
      confirmFn('Da li ste sigurni da želite da obrišete ovaj ugovor?', doDelete);
    } else {
      doDelete();
    }
  };

  return {
    saveMutation,
    deleteMutation,
    handleSave,
    handleDelete,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Query: Paginated Contract Templates
export function usePaginatedContractTemplatesQuery(
  pagination: BasePaginationParams,
  filters?: {
    search?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  },
  options?: { enabled?: boolean }
) {
  const params = buildPaginationQueryParams(pagination);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  return useQuery<PaginatedContractTemplatesResponse>({
    queryKey: [...CONTRACT_TEMPLATES_QUERY_KEY, params.toString()],
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.CONTRACT_TEMPLATES.BASE}?${params.toString()}`);
      if (!res.ok) throw new Error('Neuspešno učitavanje šablona ugovora');
      return res.json();
    },
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled !== false,
  });
}

// Query: Contract Templates Summary (for dropdowns / template picker)
export function useContractTemplatesSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery<ContractTemplate[]>({
    queryKey: [...CONTRACT_TEMPLATES_QUERY_KEY, 'summary'],
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.CONTRACT_TEMPLATES.BASE}`);
      if (!res.ok) throw new Error('Neuspešno učitavanje šablona ugovora');
      return res.json();
    },
    enabled: options?.enabled !== false,
    staleTime: 60 * 1000,
  });
}

// Mutations: Contract Templates
export function useContractTemplatesMutations() {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (templateData: Partial<ContractTemplate>): Promise<ContractTemplate> => {
      const isEdit = Boolean(templateData.id);
      const url = isEdit
        ? API_ROUTES.CONTRACT_TEMPLATES.BY_ID(templateData.id!)
        : API_ROUTES.CONTRACT_TEMPLATES.BASE;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Neuspešno čuvanje šablona');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACT_TEMPLATES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await apiFetch(API_ROUTES.CONTRACT_TEMPLATES.BY_ID(id), {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Neuspešno brisanje šablona');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACT_TEMPLATES_QUERY_KEY });
    },
  });

  const handleSave = async (data: Partial<ContractTemplate>): Promise<SaveResult> => {
    try {
      const tpl = await saveMutation.mutateAsync(data);
      return { success: true, data: tpl, id: tpl.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Greška pri čuvanju šablona' };
    }
  };

  const handleDelete = (id: string, confirmFn?: (msg: string, cb: () => void) => void) => {
    const doDelete = () => deleteMutation.mutate(id);
    if (confirmFn) {
      confirmFn('Da li ste sigurni da želite da obrišete ovaj šablon ugovora?', doDelete);
    } else {
      doDelete();
    }
  };

  return {
    saveMutation,
    deleteMutation,
    handleSave,
    handleDelete,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
