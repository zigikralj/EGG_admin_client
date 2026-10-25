import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { fetchWithDeltaSync } from '../utils/deltaSync';
import { syncWasteCatalog, sortWasteCatalog, upsertCatalogItemInDB, getMemoryCachedCatalog } from '../utils/wasteCatalogStorage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ROUTES } from '../constants';
import type { TranslationKeys } from '../i18n/translations';
import type {
  Project,
  Client,
  User,
  Service,
  ProvidedService,
  Category,
  Reminder,
  Invoice,
  Permit,
  WasteCatalog,
  SaveResult,
  Role,
  ActivityLog,
  ActivityLogMonthlyStats,
  ActivityAnalytics,
  EntityTimelineResponse,
  VersionDiffResponse,
  RebuiltVersionResponse,
  RestoreVersionResponse,
  ProjectUpdateSummary,
  ProjectUpdatesDiffResult,
  PaginatedResponse,
} from '../types';
import type { ActivityLogsSummaryResponse } from '../components/activityLogs/types';

export function useAuthHeaders() {
  const { currentUser } = useAuth();
  return () => {
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
}

// --- Pagination Helpers ---

export interface BasePaginationParams {
  page: number; // 0-indexed from MUI
  rowsPerPage: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
}

export function buildPaginationQueryParams(
  params: BasePaginationParams,
  extraFilters: Record<string, any> = {}
): URLSearchParams {
  const q = new URLSearchParams();
  q.set('page', String(params.page + 1)); // Convert 0-indexed to 1-indexed for backend
  q.set('limit', String(params.rowsPerPage));
  if (params.sortColumn) q.set('sortBy', params.sortColumn);
  if (params.sortDirection) q.set('sortOrder', params.sortDirection);
  if (params.searchQuery?.trim()) q.set('search', params.searchQuery.trim());

  Object.entries(extraFilters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      if (Array.isArray(val)) {
        if (val.length > 0) q.set(key, val.join(','));
      } else {
        q.set(key, String(val));
      }
    }
  });

  return q;
}

// --- Queries ---

export function useProjectsQuery(searchQuery: string = '', options?: { done?: boolean; enabled?: boolean }) {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const queryKey = ['projects', currentUser?.id, searchQuery, options?.done] as const;

  return useQuery<Project[]>({
    queryKey,
    enabled: options?.enabled ?? true,
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (options?.done !== undefined) params.set('done', String(options.done));
      const q = params.toString() ? `?${params.toString()}` : '';
      return fetchWithDeltaSync<Project>({
        url: `${API_ROUTES.PROJECTS.BASE}${q}`,
        queryKey,
        queryClient,
        headers: getAuthHeaders(),
      });
    },
  });
}

export interface PaginatedProjectsParams {
  page: number; // 0-indexed from MUI
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  type?: string;
  clientId?: string;
  responsible?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  done?: boolean;
}

export function usePaginatedProjectsQuery(params: PaginatedProjectsParams, enabled: boolean = true) {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  const queryKey = [
    'projects',
    'paginated',
    currentUser?.id,
    params.page,
    params.rowsPerPage,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.status,
    params.type,
    params.clientId,
    params.responsible,
    params.dateFrom,
    params.dateTo,
    params.dateField,
    params.done,
  ] as const;

  return useQuery<PaginatedResponse<Project>>({
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
          type: params.type,
          clientId: params.clientId,
          responsible: params.responsible,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          dateField: params.dateField,
          done: params.done,
        }
      );

      const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch paginated projects');
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

export interface InfiniteProjectsParams {
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  type?: string;
  clientId?: string;
  responsible?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  done?: boolean;
}

export function useInfiniteProjectsQuery(params: InfiniteProjectsParams = {}, enabled: boolean = true) {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  const limit = params.limit || 12;
  const queryKey = [
    'projects',
    'infinite',
    currentUser?.id,
    limit,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.status,
    params.type,
    params.clientId,
    params.responsible,
    params.dateFrom,
    params.dateTo,
    params.dateField,
    params.done,
  ] as const;

  return useInfiniteQuery<PaginatedResponse<Project>>({
    queryKey,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const q = new URLSearchParams();
      q.set('page', String(pageParam));
      q.set('limit', String(limit));
      if (params.sortBy) q.set('sortBy', params.sortBy);
      if (params.sortOrder) q.set('sortOrder', params.sortOrder);
      if (params.search?.trim()) q.set('search', params.search.trim());
      if (params.status && params.status !== 'all') q.set('status', params.status);
      if (params.type && params.type !== 'all') q.set('type', params.type);
      if (params.clientId && params.clientId !== 'all') q.set('clientId', params.clientId);
      if (params.responsible && params.responsible !== 'all') q.set('responsible', params.responsible);
      if (params.dateFrom) q.set('dateFrom', params.dateFrom);
      if (params.dateTo) q.set('dateTo', params.dateTo);
      if (params.dateField) q.set('dateField', params.dateField);
      if (params.done !== undefined) q.set('done', String(params.done));

      const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      if (Array.isArray(data)) {
        const pageNum = typeof pageParam === 'number' ? pageParam : 1;
        return {
          items: data,
          total: data.length,
          page: pageNum,
          limit,
          totalPages: Math.ceil(data.length / limit) || 1,
          hasMore: false,
        };
      }
      return data;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled,
    staleTime: 30_000,
  });
}


/**
 * Fetches full project details by ID, including complete rich-text HTML notes.
 * Used on-demand for modals, popovers, and expanded project cards.
 */
export function useProjectDetailsQuery(id: string | undefined, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Project>({
    queryKey: ['projects', 'details', id],
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch project details');
      return res.json();
    },
    enabled: Boolean(id) && enabled,
    meta: { silent: true },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

export interface ProjectNoteData {
  id: string | null;
  projectId: string;
  content: string;
  version: number;
  updatedAt: string | null;
}

export function useProjectNoteQuery(projectId: string | undefined, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  return useQuery<ProjectNoteData>({
    queryKey: ['projects', 'note', projectId],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.PROJECTS.NOTE(projectId!), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch project note');
      return res.json();
    },
    initialData: () => {
      if (!projectId) return undefined;
      const cached = queryClient.getQueryData<Project>(['projects', 'details', projectId]);
      if (cached && cached.notes !== undefined && cached.notes !== null) {
        return {
          id: (cached as any).note?.id || null,
          projectId,
          content: cached.notes,
          version: (cached as any).note?.version || 1,
          updatedAt: (cached as any).note?.updatedAt || null,
        };
      }
      return undefined;
    },
    enabled: Boolean(projectId) && enabled,
    meta: { silent: true },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

export interface ProjectUpdatesResponse {
  total: number;
  dateFrom: string;
  dateTo: string;
  limit: number;
  offset: number;
  updates: ProjectUpdateSummary[];
}

export function useProjectUpdatesQuery(params: {
  dateFrom?: string;
  dateTo?: string;
  responsibleId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ProjectUpdatesResponse>({
    queryKey: ['projects', 'updates', params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.dateFrom) q.set('dateFrom', params.dateFrom);
      if (params.dateTo) q.set('dateTo', params.dateTo);
      if (params.responsibleId) q.set('responsibleId', params.responsibleId);
      if (params.search) q.set('search', params.search);
      if (params.limit !== undefined) q.set('limit', String(params.limit));
      if (params.offset !== undefined) q.set('offset', String(params.offset));

      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await apiFetch(`${API_ROUTES.PROJECTS.UPDATES}${queryStr}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch project updates');
      return res.json();
    },
    enabled,
    meta: { silent: true },
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useProjectUpdatesDiffQuery(
  projectId: string | undefined,
  dateFrom: string | undefined,
  dateTo: string | undefined,
  enabled: boolean = true
) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ProjectUpdatesDiffResult>({
    queryKey: ['projects', 'updates-diff', projectId, dateFrom, dateTo],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (dateFrom) q.set('dateFrom', dateFrom);
      if (dateTo) q.set('dateTo', dateTo);

      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await apiFetch(`${API_ROUTES.PROJECTS.UPDATES_DIFF(projectId!)}${queryStr}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch project updates diff');
      return res.json();
    },
    enabled: Boolean(projectId && dateFrom) && enabled,
    meta: { silent: true },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

export function useClientsQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const queryKey = ['clients'] as const;

  return useQuery<Client[]>({
    queryKey,
    enabled: options?.enabled ?? true,
    queryFn: () =>
      fetchWithDeltaSync<Client>({
        url: API_ROUTES.CLIENTS.BASE,
        queryKey,
        queryClient,
        headers: getAuthHeaders(),
      }),
  });
}

export function useClientsSummaryQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Array<{ id: string; name: string; city?: string }>>({
    queryKey: ['clients', 'summary'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.CLIENTS.BASE}?fields=summary`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch clients summary');
      return res.json();
    },
    staleTime: 60_000,
  });
}

export interface PaginatedClientsParams {
  page: number; // 0-indexed from MUI
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  city?: string;
  hasPermit?: string;
}

export function usePaginatedClientsQuery(params: PaginatedClientsParams, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  const queryKey = [
    'clients',
    'paginated',
    params.page,
    params.rowsPerPage,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.city,
    params.hasPermit,
  ] as const;

  return useQuery<PaginatedResponse<Client>>({
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
          city: params.city,
          hasPermit: params.hasPermit,
        }
      );

      const res = await apiFetch(`${API_ROUTES.CLIENTS.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch paginated clients');
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

export function useUsersQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<User[]>({
    queryKey: ['users'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.USERS.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
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
          page: 1,
          limit: data.length,
          totalPages: 1,
          hasMore: false,
        };
      }
      return data;
    },
    enabled,
    staleTime: 30000,
  });
}

export function useServicesQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Service[]>({
    queryKey: ['services'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.SERVICES.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    }
  });
}

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
  ] as const;

  return useQuery<PaginatedResponse<ProvidedService>>({
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
          status: params.status && params.status !== 'all' ? params.status : undefined,
          serviceId: params.serviceId && params.serviceId !== 'all' ? params.serviceId : undefined,
          clientId: params.clientId && params.clientId !== 'all' ? params.clientId : undefined,
          projectId: params.projectId && params.projectId !== 'all' ? params.projectId : undefined,
          invoiceId: params.invoiceId && params.invoiceId !== 'all' ? params.invoiceId : undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
          dateField: params.dateField || undefined,
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
    enabled,
    staleTime: 30000,
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
    }
  });
}


export function usePreferencesMutations() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();

  const updatePreferenceMutation = useMutation({
    mutationKey: ['preferences', currentUser?.id],
    meta: { silent: true },
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await apiFetch(API_ROUTES.PREFERENCES.BY_KEY(key), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('Failed to update preference');
      return res.json();
    },
    onMutate: async ({ key, value }) => {
      const qKey = ['preferences', currentUser?.id];
      await queryClient.cancelQueries({ queryKey: qKey });
      const previousPreferences = queryClient.getQueryData<Record<string, any>>(qKey);
      const updated = {
        ...(previousPreferences || {}),
        [key]: value,
      };
      queryClient.setQueryData<Record<string, any>>(qKey, updated);
      if (currentUser?.id && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(`ekos_user_preferences_${currentUser.id}`, JSON.stringify(updated));
        } catch {}
      }
      return { previousPreferences };
    },
    onError: (_err, _variables, context) => {
      const qKey = ['preferences', currentUser?.id];
      if (context?.previousPreferences) {
        queryClient.setQueryData(qKey, context.previousPreferences);
        if (currentUser?.id && typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(`ekos_user_preferences_${currentUser.id}`, JSON.stringify(context.previousPreferences));
          } catch {}
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences', currentUser?.id] });
    },
  });

  return { updatePreferenceMutation };
}

export function useRemindersQuery(options?: { enabled?: boolean }) {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const queryKey = ['reminders', currentUser?.id] as const;

  return useQuery<Reminder[]>({
    queryKey,
    enabled: options?.enabled ?? true,
    queryFn: () =>
      fetchWithDeltaSync<Reminder>({
        url: API_ROUTES.REMINDERS.BASE,
        queryKey,
        queryClient,
        headers: getAuthHeaders(),
      }),
  });
}

export interface PaginatedRemindersParams {
  page: number; // 0-indexed from MUI
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  clientId?: string;
  projectId?: string;
  permitId?: string;
  responsible?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
}

export function usePaginatedRemindersQuery(params: PaginatedRemindersParams, enabled: boolean = true) {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  const queryKey = [
    'reminders',
    'paginated',
    currentUser?.id,
    params.page,
    params.rowsPerPage,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.status,
    params.clientId,
    params.projectId,
    params.permitId,
    params.responsible,
    params.dateFrom,
    params.dateTo,
    params.dateField,
  ] as const;

  return useQuery<PaginatedResponse<Reminder>>({
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
          permitId: params.permitId,
          responsible: params.responsible,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          dateField: params.dateField,
        }
      );

      const res = await apiFetch(`${API_ROUTES.REMINDERS.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch paginated reminders');
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

/**
 * Activity log list WITHOUT the heavy `details` column (diffs are lazy-loaded per row).
 * @param from ISO timestamp — only logs at/after this time are fetched (server-side filter).
 */
export function useActivityLogsQuery(from?: string) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ActivityLog[]>({
    queryKey: ['activity-logs', from ?? 'all'],
    queryFn: async () => {
      const params = new URLSearchParams({ includeDetails: 'false' });
      if (from) params.set('from', from);
      const res = await apiFetch(`${API_ROUTES.ACTIVITY_LOGS.BASE}?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      return res.json();
    },
    staleTime: 600_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}

/**
 * Postgres-aggregated summary query for KPI stats and per-user summaries.
 * Zero raw logs transferred.
 */
export function useActivityLogsSummaryQuery(from?: string) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ActivityLogsSummaryResponse>({
    queryKey: ['activity-logs', 'summary', from ?? 'all'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch(`${API_ROUTES.ACTIVITY_LOGS.SUMMARY}${q}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch activity logs summary');
      return res.json();
    },
    staleTime: 600_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}

/**
 * Infinite query for fetching an individual user's activity logs on demand.
 * Uses cursor pagination (before, beforeId) with 50 logs per page.
 */
export function useUserActivityLogsQuery(userId: string | undefined, from?: string, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  return useInfiniteQuery<ActivityLog[], Error, { pages: ActivityLog[][]; pageParams: Array<{ before?: string; beforeId?: string } | undefined> }, [string, string, string | undefined, string | undefined], { before?: string; beforeId?: string } | undefined>({
    queryKey: ['activity-logs', 'user', userId, from],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        userId: userId!,
        limit: '50',
        includeDetails: 'false',
      });
      if (from) params.set('from', from);
      if (pageParam?.before) params.set('before', pageParam.before);
      if (pageParam?.beforeId) params.set('beforeId', pageParam.beforeId);

      const res = await apiFetch(`${API_ROUTES.ACTIVITY_LOGS.BASE}?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch user activity logs');
      return res.json();
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < 50) return undefined;
      const last = lastPage[lastPage.length - 1];
      return { before: last.timestamp, beforeId: last.id };
    },
    enabled: Boolean(userId) && enabled,
    staleTime: 600_000,
    refetchOnWindowFocus: false,
    maxPages: 10,
  });
}

/**
 * Historical pre-aggregated monthly stats query.
 */
export function useActivityMonthlyStatsQuery(
  filters?: { userId?: string; fromYearMonth?: string; toYearMonth?: string },
  options?: { enabled?: boolean }
) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ActivityLogMonthlyStats[]>({
    queryKey: ['activity-logs', 'monthly-stats', filters?.userId, filters?.fromYearMonth, filters?.toYearMonth],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.userId) params.set('userId', filters.userId);
      if (filters?.fromYearMonth) params.set('fromYearMonth', filters.fromYearMonth);
      if (filters?.toYearMonth) params.set('toYearMonth', filters.toYearMonth);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch(`${API_ROUTES.ACTIVITY_LOGS.MONTHLY_STATS}${q}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch activity monthly stats');
      return res.json();
    },
    staleTime: 600_000,
    refetchOnWindowFocus: false,
  });
}

/** Lazy-loads a single activity log including its `details` (diff) when a row is expanded. */
export function useActivityLogDetailsQuery(id: string | undefined, enabled: boolean) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ActivityLog>({
    queryKey: ['activity-log-details', id],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.ACTIVITY_LOGS.BY_ID(id!), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch activity log details');
      return res.json();
    },
    enabled: enabled && !!id,
    staleTime: Infinity, // logs are immutable
    gcTime: 10 * 60_000,
  });
}

export interface ActivityAnalyticsParams {
  from: string;
  to: string;
  granularity?: 'day' | 'week' | 'month';
  tz?: string;
  userIds?: string[];
  roles?: string[];
  excludeAdminPages?: boolean;
  compare?: boolean;
}

export function useActivityAnalyticsQuery(params: ActivityAnalyticsParams) {
  const browserTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  const effectiveParams = { tz: browserTz, ...params };
  const getAuthHeaders = useAuthHeaders();

  return useQuery<ActivityAnalytics>({
    queryKey: ['activity-logs', 'analytics', effectiveParams],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('from', effectiveParams.from);
      searchParams.set('to', effectiveParams.to);
      if (effectiveParams.granularity) searchParams.set('granularity', effectiveParams.granularity);
      if (effectiveParams.tz) searchParams.set('tz', effectiveParams.tz);
      if (effectiveParams.userIds?.length) searchParams.set('userIds', effectiveParams.userIds.join(','));
      if (effectiveParams.roles?.length) searchParams.set('roles', effectiveParams.roles.join(','));
      if (effectiveParams.excludeAdminPages !== undefined) {
        searchParams.set('excludeAdminPages', String(effectiveParams.excludeAdminPages));
      }
      if (effectiveParams.compare !== undefined) {
        searchParams.set('compare', String(effectiveParams.compare));
      }
      const res = await apiFetch(`${API_ROUTES.ACTIVITY_LOGS.ANALYTICS}?${searchParams.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch activity analytics');
      return res.json();
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useActivityLogsMutations() {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(API_ROUTES.ACTIVITY_LOGS.CLEAR_ALL, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to clear all activity logs');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (payload: { sessionId?: string, ids?: string[] }) => {
      if (payload.ids && payload.ids.length > 0) {
        const res = await apiFetch(API_ROUTES.ACTIVITY_LOGS.BULK_DELETE, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ids: payload.ids })
        });
        if (!res.ok) throw new Error('Failed to bulk delete activity logs');
        return res.json();
      } else if (payload.sessionId) {
        const res = await apiFetch(API_ROUTES.ACTIVITY_LOGS.SESSION(payload.sessionId), {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete session activity logs');
        return res.json();
      }
      throw new Error('No ids or sessionId provided');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });

  const deleteIndividualMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(API_ROUTES.ACTIVITY_LOGS.BY_ID(id), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete activity log');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });

  return { clearAllMutation, deleteSessionMutation, deleteIndividualMutation };
}

export interface ActivityLogStatus {
  enabled: boolean;
  retentionDays: number;
}

/** Fetches whether activity logging is enabled globally and the retention policy (days). */
export function useActivityLogStatusQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ActivityLogStatus>({
    queryKey: ['activity-logs-status'],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.ACTIVITY_LOGS.STATUS, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch activity log status');
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/** Updates activity log settings (enabled and/or retentionDays) globally (Administrator only). */
export function useActivityLogUpdateSettingsMutation() {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();

  return useMutation({
    mutationFn: async (settings: { enabled?: boolean; retentionDays?: number }) => {
      const res = await apiFetch(API_ROUTES.ACTIVITY_LOGS.STATUS, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update activity log settings');
      }
      return res.json() as Promise<ActivityLogStatus>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['activity-logs-status'], data);
      queryClient.invalidateQueries({ queryKey: ['activity-logs-status'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      if (typeof window !== 'undefined' && typeof data.enabled === 'boolean') {
        window.dispatchEvent(new CustomEvent('activity-logging:changed', { detail: data.enabled }));
      }
    },
  });
}

/** Toggles whether activity logging is enabled globally (Administrator only). */
export function useActivityLogToggleMutation() {
  const updateMutation = useActivityLogUpdateSettingsMutation();
  return {
    ...updateMutation,
    mutate: (enabled: boolean) => updateMutation.mutate({ enabled }),
    mutateAsync: (enabled: boolean) => updateMutation.mutateAsync({ enabled }),
  };
}

export function usePreferencesQuery() {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Record<string, any>>({
    queryKey: ['preferences', currentUser?.id],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.PREFERENCES.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch preferences');
      const data = await res.json();
      if (currentUser?.id && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(`ekos_user_preferences_${currentUser.id}`, JSON.stringify(data));
        } catch {}
      }
      return data;
    },
    initialData: () => {
      if (currentUser?.id && typeof localStorage !== 'undefined') {
        try {
          const cached = localStorage.getItem(`ekos_user_preferences_${currentUser.id}`);
          if (cached) return JSON.parse(cached);
        } catch {}
      }
      return undefined;
    },
    // Don't refetch preferences often as it interrupts UI state
    staleTime: 60 * 60 * 1000,
  });
}

// --- Generic Mutations ---

interface MutationConfig {
  basePath: string;
  queryKeyToInvalidate: string[];
  errorSaveMessageKey: keyof TranslationKeys;
  deleteConfirmMessageKey?: keyof TranslationKeys;
  permissionDeniedMessageKey?: keyof TranslationKeys;
  additionalInvalidates?: string[][]; // keys to invalidate additionally (like stats)
}

export function useGenericMutations<T extends { id?: string }>(config: MutationConfig) {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: config.queryKeyToInvalidate });
    if (config.additionalInvalidates) {
      config.additionalInvalidates.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
    }
    queryClient.invalidateQueries({ queryKey: ['history'] });
    queryClient.invalidateQueries({ queryKey: ['history-diff'] });
    queryClient.invalidateQueries({ queryKey: ['history-version'] });
  };

  const saveMutationFn = async (data: Partial<T>) => {
    const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    let res;
    if (data.id) {
      res = await apiFetch(`${config.basePath}/${data.id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
    } else {
      res = await apiFetch(config.basePath, { method: 'POST', headers, body: JSON.stringify(data) });
    }
    
    if (res.ok) {
      const savedItem = await res.json().catch(() => ({}));
      return { success: true, id: savedItem?.id, data: savedItem };
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || t(config.errorSaveMessageKey));
    }
  };

  const saveMutation = useMutation<SaveResult, Error, Partial<T>>({
    mutationFn: saveMutationFn,
    onSuccess: () => {
      invalidate();
    },
  });

  const silentSaveMutation = useMutation<SaveResult, Error, Partial<T>>({
    mutationFn: saveMutationFn,
    meta: { silent: true },
    onSuccess: () => {
      invalidate();
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await apiFetch(`${config.basePath}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t(config.permissionDeniedMessageKey || 'permissionDeniedOnlyOwnProjects'));
      }
    },
    onSuccess: () => {
      invalidate();
    }
  });

  return {
    saveMutation,
    silentSaveMutation,
    deleteMutation,
    handleSave: async (data: Partial<T>, options?: { silent?: boolean }): Promise<SaveResult> => {
      try {
        if (options?.silent) {
          return await silentSaveMutation.mutateAsync(data);
        }
        return await saveMutation.mutateAsync(data);
      } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
      }
    },
    handleSilentSave: async (data: Partial<T>): Promise<SaveResult> => {
      try {
        return await silentSaveMutation.mutateAsync(data);
      } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
      }
    },
    handleDelete: async (id: string, onDeleteConfirm: (msg: string, cb: () => void) => void) => {
       if (config.deleteConfirmMessageKey) {
          onDeleteConfirm(t(config.deleteConfirmMessageKey), async () => {
              try {
                  await deleteMutation.mutateAsync(id);
              } catch (e: any) {
                  alert(e.message);
              }
          });
       } else {
           try {
              await deleteMutation.mutateAsync(id);
          } catch (e: any) {
              alert(e.message);
          }
       }
    }
  };
}

// --- Specific Hooks ---

export function usePreferencesMutation() {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['preferences'],
    meta: { silent: true },
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await apiFetch(API_ROUTES.PREFERENCES.BY_KEY(key), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('Failed to update preference');
      return { key, value };
    },
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['preferences'] });
      const previous = queryClient.getQueryData<Record<string, any>>(['preferences']);
      if (previous) {
        queryClient.setQueryData(['preferences'], { ...previous, [key]: value });
      }
      return { previous };
    },
    onError: (_err, _newPref, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['preferences'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
}

export function useGenericActionMutation() {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ path, method = 'POST', body, queryKeysToInvalidate }: { path: string, method?: string, body?: any, queryKeysToInvalidate: string[][] }) => {
      const res = await apiFetch(path, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
         const err = await res.json().catch(() => ({}));
         throw new Error(err.error || err.message || 'Action failed');
      }
      return { queryKeysToInvalidate };
    },
    onSuccess: (data) => {
      data.queryKeysToInvalidate.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['history-diff'] });
      queryClient.invalidateQueries({ queryKey: ['history-version'] });
    }
  });
}

export function useProjectsMutations() {
  const generic = useGenericMutations<Project>({
    basePath: API_ROUTES.PROJECTS.BASE,
    queryKeyToInvalidate: ['projects'],
    errorSaveMessageKey: 'errorSavingProject',
    deleteConfirmMessageKey: 'confirmDeleteProject',
    permissionDeniedMessageKey: 'permissionDeniedOnlyOwnProjects',
  });
  
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const toggleDoneMutation = useMutation({
    meta: { silent: true },
    mutationFn: async ({ id, isCompleting: _ }: { id: string, isCompleting: boolean }) => {
      const res = await apiFetch(API_ROUTES.PROJECTS.TOGGLE_DONE(id), {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t('permissionDeniedOnlyOwnProjects'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['history-diff'] });
      queryClient.invalidateQueries({ queryKey: ['history-version'] });
    }
  });

  const updateNotesMutation = useMutation({
    meta: { silent: true },
    mutationFn: async ({ id, notes }: { id: string; notes: string | null }) => {
      const res = await apiFetch(API_ROUTES.PROJECTS.UPDATE_NOTES(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t('errorSavingProject'));
      }
      return await res.json();
    },
    onSuccess: (data: { id: string; notes: string | null; notesPreview: string | null }) => {
      // Direct optimistic cache update to avoid refetching entire project list from Neon
      queryClient.setQueryData(['projects', 'details', data.id], (old: any) => {
        if (!old) return old;
        return { ...old, notes: data.notes, notesPreview: data.notesPreview };
      });

      queryClient.setQueriesData({ queryKey: ['projects'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((p: any) =>
            p.id === data.id ? { ...p, notesPreview: data.notesPreview } : p
          );
        }
        return old;
      });

      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['history-diff'] });
      queryClient.invalidateQueries({ queryKey: ['history-version'] });
    },
  });

  const updateNoteMutation = useMutation({
    meta: { silent: true },
    mutationFn: async ({ id, content, reason }: { id: string; content: string; reason?: string }) => {
      const res = await apiFetch(API_ROUTES.PROJECTS.NOTE(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ content, reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t('errorSavingProject'));
      }
      return await res.json();
    },
    onSuccess: (data: { id: string; content: string; notesPreview: string | null; version: number }) => {
      queryClient.setQueryData(['projects', 'note', data.id], data);

      queryClient.setQueryData(['projects', 'details', data.id], (old: any) => {
        if (!old) return old;
        return { ...old, notes: data.content, notesPreview: data.notesPreview };
      });

      queryClient.setQueriesData({ queryKey: ['projects'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((p: any) =>
            p.id === data.id ? { ...p, notesPreview: data.notesPreview } : p
          );
        }
        return old;
      });

      queryClient.invalidateQueries({ queryKey: ['projects', 'note', 'revisions', data.id] });
    },
  });

  return {
    ...generic,
    toggleDoneMutation,
    updateNotesMutation,
    updateNoteMutation,
    handleSaveNotes: async (id: string, notes: string | null): Promise<SaveResult> => {
      try {
        const data = await updateNotesMutation.mutateAsync({ id, notes });
        return { success: true, id: data.id, data };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    handleSaveNote: async (id: string, content: string, reason?: string): Promise<SaveResult> => {
      try {
        const data = await updateNoteMutation.mutateAsync({ id, content, reason });
        return { success: true, id: data.id, data };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  };
}

export function useClientsMutations() {
  return useGenericMutations<Client>({
    basePath: API_ROUTES.CLIENTS.BASE,
    queryKeyToInvalidate: ['clients'],
    additionalInvalidates: [['permits']],
    errorSaveMessageKey: 'errorSavingClient',
    deleteConfirmMessageKey: 'confirmDeleteClient',
    permissionDeniedMessageKey: 'permissionDeniedClients',
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

export function useServicesMutations() {
  return useGenericMutations<Service>({
    basePath: API_ROUTES.SERVICES.BASE,
    queryKeyToInvalidate: ['services'],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteService',
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

export function useCategoriesMutations() {
  return useGenericMutations<Category>({
    basePath: API_ROUTES.CATEGORIES.BASE,
    queryKeyToInvalidate: ['categories'],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteCategory' as any,
  });
}

export function useRemindersMutations() {
  const generic = useGenericMutations<Reminder>({
    basePath: API_ROUTES.REMINDERS.BASE,
    queryKeyToInvalidate: ['reminders'],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteReminder' as any,
  });
  
  const actionMutation = useGenericActionMutation();
  
  const handleStatusChangeReminder = (id: string, newStatus: string) => {
     return actionMutation.mutateAsync({
        path: API_ROUTES.REMINDERS.STATUS(id),
        method: 'PATCH',
        body: { status: newStatus },
        queryKeysToInvalidate: [['reminders']],
     });
  };
  
  return {
    ...generic,
    handleStatusChangeReminder,
  };
}

export function useInvoicesMutations() {
  const generic = useGenericMutations<Invoice>({
    basePath: API_ROUTES.INVOICES.BASE,
    queryKeyToInvalidate: ['invoices'],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteInvoice' as any,
  });
  
  const actionMutation = useGenericActionMutation();
  
  const handleUpdateInvoiceStatus = (id: string, status: string, paymentDate?: string | null) => {
     return actionMutation.mutateAsync({
        path: API_ROUTES.INVOICES.STATUS(id),
        method: 'PATCH',
        body: { status, paymentDate },
        queryKeysToInvalidate: [['invoices']],
     });
  };
  
  return {
    ...generic,
    handleUpdateInvoiceStatus,
  };
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

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

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

// --- History & Versioning Queries & Mutations ---

export function useEntityTimelineQuery(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  options?: { limit?: number; offset?: number; includeChildren?: boolean; enabled?: boolean }
) {
  const getAuthHeaders = useAuthHeaders();
  const enabled = Boolean(entityType && entityId && (options?.enabled ?? true));
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const includeChildren = Boolean(options?.includeChildren);

  return useQuery<EntityTimelineResponse>({
    queryKey: ['history', entityType, entityId, limit, offset, includeChildren],
    queryFn: async () => {
      const q = `?limit=${limit}&offset=${offset}&includeChildren=${includeChildren}`;
      const url = `${API_ROUTES.HISTORY.TIMELINE(entityType!, entityId!)}${q}`;
      const res = await apiFetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch entity timeline');
      }
      return res.json();
    },
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useVersionDiffQuery(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  vFrom: number | null | undefined,
  vTo: number | null | undefined,
  enabled: boolean = true
) {
  const getAuthHeaders = useAuthHeaders();
  const canFetch = Boolean(
    entityType &&
    entityId &&
    typeof vFrom === 'number' &&
    typeof vTo === 'number' &&
    vFrom >= 1 &&
    vTo >= 1 &&
    enabled
  );

  return useQuery<VersionDiffResponse>({
    queryKey: ['history-diff', entityType, entityId, vFrom, vTo],
    queryFn: async () => {
      const url = API_ROUTES.HISTORY.DIFF(entityType!, entityId!, vFrom!, vTo!);
      const res = await apiFetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch version diff');
      }
      return res.json();
    },
    enabled: canFetch,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useDateRangeDiffQuery(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  dateFrom: string | null | undefined,
  dateTo: string | null | undefined,
  enabled: boolean = true
) {
  const getAuthHeaders = useAuthHeaders();
  const canFetch = Boolean(
    entityType &&
    entityId &&
    (dateFrom || dateTo) &&
    enabled
  );

  return useQuery<VersionDiffResponse & { dateFrom?: string; dateTo?: string }>({
    queryKey: ['history-diff-date', entityType, entityId, dateFrom, dateTo],
    queryFn: async () => {
      const url = API_ROUTES.HISTORY.DIFF_BY_DATE(entityType!, entityId!, dateFrom || undefined, dateTo || undefined);
      const res = await apiFetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch date diff');
      }
      return res.json();
    },
    enabled: canFetch,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useRebuiltVersionQuery(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  version: number | null | undefined,
  enabled: boolean = true
) {
  const getAuthHeaders = useAuthHeaders();
  const canFetch = Boolean(
    entityType &&
    entityId &&
    typeof version === 'number' &&
    version >= 1 &&
    enabled
  );

  return useQuery<RebuiltVersionResponse>({
    queryKey: ['history-version', entityType, entityId, version],
    queryFn: async () => {
      const url = API_ROUTES.HISTORY.VERSION(entityType!, entityId!, version!);
      const res = await apiFetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch version data');
      }
      return res.json();
    },
    enabled: canFetch,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useRestoreVersionMutation() {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();

  return useMutation<
    RestoreVersionResponse,
    Error,
    { entityType: string; entityId: string; version: number }
  >({
    mutationFn: async ({ entityType, entityId, version }) => {
      const url = API_ROUTES.HISTORY.RESTORE(entityType, entityId, version);
      const res = await apiFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to restore version');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['history', variables.entityType, variables.entityId] });
      const lower = variables.entityType.toLowerCase();
      queryClient.invalidateQueries({ queryKey: [lower + 's'] });
      queryClient.invalidateQueries({ queryKey: [lower] });
      if (lower === 'project') {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      } else if (lower === 'client') {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      } else if (lower === 'invoice') {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      } else if (lower === 'permit') {
        queryClient.invalidateQueries({ queryKey: ['permits'] });
      } else if (lower === 'service') {
        queryClient.invalidateQueries({ queryKey: ['services'] });
      } else if (lower === 'reminder') {
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
      } else if (lower === 'providedservice') {
        queryClient.invalidateQueries({ queryKey: ['providedServices'] });
      }
    },
  });
}

