import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { PaginatedResponse } from '../types';

export type AutocompleteEntity =
  | 'clients'
  | 'users'
  | 'services'
  | 'reminders'
  | 'invoices'
  | 'projects'
  | 'permits'
  | 'categories';

const ENTITY_BASE_ROUTES: Record<AutocompleteEntity, string> = {
  clients: API_ROUTES.CLIENTS.BASE,
  users: API_ROUTES.USERS.BASE,
  services: API_ROUTES.SERVICES.BASE,
  reminders: API_ROUTES.REMINDERS.BASE,
  invoices: API_ROUTES.INVOICES.BASE,
  projects: API_ROUTES.PROJECTS.BASE,
  permits: API_ROUTES.PERMITS.BASE,
  categories: API_ROUTES.CATEGORIES.BASE,
};

export interface UseEntityAutocompleteInfiniteQueryParams {
  entity: AutocompleteEntity;
  search?: string;
  pageSize?: number;
  queryParams?: Record<string, any>;
  enabled?: boolean;
}

export function useEntityAutocompleteInfiniteQuery<T = any>({
  entity,
  search = '',
  pageSize = 10,
  queryParams,
  enabled = true,
}: UseEntityAutocompleteInfiniteQueryParams) {
  const { currentUser } = useAuth();

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {};
    if (currentUser?.id) headers['X-User-Id'] = currentUser.id;
    const sid =
      (typeof localStorage !== 'undefined' ? localStorage.getItem('activity_session_id') : null) ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('activity_session_id') : null);
    if (sid) {
      headers['X-Session-Id'] = sid;
    }
    return headers;
  };

  const queryKey = [
    'autocomplete',
    entity,
    search.trim(),
    pageSize,
    queryParams ? JSON.stringify(queryParams) : '',
  ] as const;

  const query = useInfiniteQuery<PaginatedResponse<T>>({
    queryKey,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const baseUrl = ENTITY_BASE_ROUTES[entity];
      const q = new URLSearchParams();
      q.set('page', String(pageParam));
      q.set('limit', String(pageSize));

      if (search && search.trim()) {
        q.set('search', search.trim());
      }

      // Default fields=summary for lightweight models
      if (entity === 'clients' || entity === 'users' || entity === 'projects') {
        q.set('fields', 'summary');
      }

      if (queryParams) {
        Object.entries(queryParams).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '' && val !== 'all') {
            if (Array.isArray(val)) {
              if (val.length > 0) q.set(key, val.join(','));
            } else {
              q.set(key, String(val));
            }
          }
        });
      }

      const res = await apiFetch(`${baseUrl}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch autocomplete options for ${entity}`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          page: Number(pageParam),
          limit: pageSize,
          totalPages: Math.ceil(data.length / pageSize) || 1,
          hasMore: false,
        };
      }
      return data as PaginatedResponse<T>;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled,
    staleTime: 30_000,
  });

  const items = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.items) ?? [];
  }, [query.data]);

  const total = query.data?.pages[0]?.total ?? 0;
  const hasMore = Boolean(query.hasNextPage);

  return {
    ...query,
    items,
    total,
    hasMore,
  };
}
