import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';
import { useAuthHeaders, buildPaginationQueryParams, useGenericMutations, useGenericActionMutation } from './queryUtils';
import type { User, Role, PaginatedResponse } from '../types';

export function useUsersQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<User[]>({
    queryKey: ['users'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.USERS.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      return Array.isArray(data) ? data : data.items || [];
    },
  });
}

export function useUsersSummaryQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<User[]>({
    queryKey: ['users', 'summary'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.USERS.BASE}?fields=summary`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch users summary');
      return res.json();
    },
    staleTime: 60_000,
  });
}

export interface MentionUserSummary {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string | null;
}

const mentionCache = new Map<string, { data: MentionUserSummary[]; expires: number }>();
const MENTION_CACHE_TTL = 30_000;

export async function fetchMentionUsers(
  query: string = '',
  limit: number = 10,
  signal?: AbortSignal
): Promise<MentionUserSummary[]> {
  const trimmed = query.trim().toLowerCase();
  const cacheKey = `${trimmed}:${limit}`;
  const now = Date.now();
  const cached = mentionCache.get(cacheKey);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  const params = new URLSearchParams({
    fields: 'mention',
    page: '1',
    limit: String(limit),
  });
  if (trimmed) {
    params.set('search', trimmed);
  }

  const headers: Record<string, string> = {};
  const storedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_user') : null;
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.id) headers['X-User-Id'] = parsed.id;
    } catch {}
  }

  try {
    const res = await apiFetch(`${API_ROUTES.USERS.BASE}?${params.toString()}`, {
      headers,
      signal,
    });

    if (!res.ok) return [];
    const data = await res.json();
    const items: MentionUserSummary[] = (Array.isArray(data) ? data : data.items || []).map((u: any) => ({
      id: String(u.id),
      name: u.name,
      role: u.role,
      avatarUrl: u.avatarUrl,
    }));

    mentionCache.set(cacheKey, { data: items, expires: now + MENTION_CACHE_TTL });
    return items;
  } catch {
    return [];
  }
}

export interface PaginatedUsersParams {
  page: number;
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: string;
  status?: string;
}

export function usePaginatedUsersQuery(params: PaginatedUsersParams, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  const queryKey = [
    'users',
    'paginated',
    params.page,
    params.rowsPerPage,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.role,
    params.status,
  ] as const;

  return useQuery<PaginatedResponse<User>>({
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
          role: params.role && params.role !== 'all' ? params.role : undefined,
          status: params.status && params.status !== 'all' ? params.status : undefined,
        }
      );
      const res = await apiFetch(`${API_ROUTES.USERS.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch paginated users');
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

export function useUsersMutations() {
  const generic = useGenericMutations<User>({
    basePath: API_ROUTES.USERS.BASE,
    queryKeyToInvalidate: ['users'],
    errorSaveMessageKey: 'errorSavingUser',
    deleteConfirmMessageKey: 'confirmDeleteUser',
    permissionDeniedMessageKey: 'permissionDeniedUsers',
  });

  const actionMutation = useGenericActionMutation();

  const handleApproveUser = async (userId: string, role: string) => {
    const res = await actionMutation.mutateAsync({
      path: API_ROUTES.USERS.APPROVE(userId),
      body: { role },
      queryKeysToInvalidate: [['users']],
    });
    window.dispatchEvent(new CustomEvent('notifications:refresh'));
    return res;
  };

  const handleRejectUser = async (userId: string) => {
    const res = await actionMutation.mutateAsync({
      path: API_ROUTES.USERS.REJECT(userId),
      queryKeysToInvalidate: [['users']],
    });
    window.dispatchEvent(new CustomEvent('notifications:refresh'));
    return res;
  };

  const handleForceLogoutUser = (userId: string) => {
    return actionMutation.mutateAsync({
      path: API_ROUTES.USERS.FORCE_LOGOUT(userId),
      queryKeysToInvalidate: [['users']],
    });
  };

  return {
    ...generic,
    handleApproveUser,
    handleRejectUser,
    handleForceLogoutUser,
  };
}

export function useRolesQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Role[]>({
    queryKey: ['roles'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.ROLES.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    },
  });
}

export function useRoleMutations() {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Role>) => {
      const res = await apiFetch(API_ROUTES.ROLES.BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to create role');
      }
      return res.json() as Promise<Role>;
    },
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      window.dispatchEvent(new CustomEvent('roles:changed', { detail: role }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ name, data }: { name: string; data: Partial<Role> }) => {
      const res = await apiFetch(API_ROUTES.ROLES.BY_NAME(name), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to update role');
      }
      return res.json() as Promise<Role>;
    },
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      window.dispatchEvent(new CustomEvent('roles:changed', { detail: role }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiFetch(API_ROUTES.ROLES.BY_NAME(name), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to delete role');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      window.dispatchEvent(new CustomEvent('roles:changed'));
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}
