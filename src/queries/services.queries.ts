import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';
import { isWasteDisposalService } from '../utils/serviceUtils';
import { useAuthHeaders, useGenericMutations } from './queryUtils';
import type { Service, Category } from '../types';

export function useServicesQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Service[]>({
    queryKey: ['services'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.SERVICES.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    },
  });
}

export function useWasteDisposalServiceQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Service | null>({
    queryKey: ['services', 'waste-disposal-default'],
    enabled: options?.enabled ?? true,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const searchTerms = ['odlaganje otpada', 'waste disposal', 'odlaganje', 'zbrinjavanje'];
      for (const term of searchTerms) {
        try {
          const res = await apiFetch(`${API_ROUTES.SERVICES.BASE}?search=${encodeURIComponent(term)}&limit=5`, {
            headers: getAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json();
            const items: Service[] = Array.isArray(data) ? data : data.items || [];
            const match = items.find((s) => isWasteDisposalService(s));
            if (match) return match;
          }
        } catch {
          // Continue to next search term
        }
      }
      return null;
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
