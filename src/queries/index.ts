import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../api';
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
  ProjectStats,
  SaveResult,
  Role,
  ActivityLog,
  ActivityLogMonthlyStats,
  ActivityAnalytics,
  EntityTimelineResponse,
  VersionDiffResponse,
  RebuiltVersionResponse,
  RestoreVersionResponse,
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

// --- Queries ---

export function useProjectsQuery(searchQuery: string = '', options?: { done?: boolean }) {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Project[]>({
    queryKey: ['projects', currentUser?.id, searchQuery, options?.done],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (options?.done !== undefined) params.set('done', String(options.done));
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}${q}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    }
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
    staleTime: 60_000,
  });
}

export function useClientsQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.CLIENTS.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json();
    }
  });
}

export function useUsersQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.USERS.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });
}

export function useServicesQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.SERVICES.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    }
  });
}

export function useProvidedServicesQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ProvidedService[]>({
    queryKey: ['provided-services'],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.PROVIDED_SERVICES.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch provided services');
      return res.json();
    }
  });
}

export function useCategoriesQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.CATEGORIES.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });
}


export function usePreferencesMutations() {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();

  const updatePreferenceMutation = useMutation({
    mutationKey: ['preferences'],
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
      await queryClient.cancelQueries({ queryKey: ['preferences'] });
      const previousPreferences = queryClient.getQueryData<Record<string, any>>(['preferences']);
      if (previousPreferences) {
        queryClient.setQueryData<Record<string, any>>(['preferences'], {
          ...previousPreferences,
          [key]: value,
        });
      }
      return { previousPreferences };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(['preferences'], context.previousPreferences);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  return { updatePreferenceMutation };
}

export function useRemindersQuery() {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Reminder[]>({
    queryKey: ['reminders', currentUser?.id],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.REMINDERS.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch reminders');
      return res.json();
    }
  });
}

export function useInvoicesQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.INVOICES.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json();
    }
  });
}

export function usePermitsQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Permit[]>({
    queryKey: ['permits'],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.PERMITS.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch permits');
      return res.json();
    }
  });
}

/** Lightweight permits query without nested relations (waste catalogs, reminders, etc.) for linking and dropdowns. */
export function usePermitsSummaryQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Permit[]>({
    queryKey: ['permits', 'summary'],
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.PERMITS.BASE}?fields=summary`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch permits summary');
      return res.json();
    }
  });
}

export function useWasteCatalogQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<WasteCatalog[]>({
    queryKey: ['waste-catalog'],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.WASTE_CATALOG.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch waste catalog');
      return res.json();
    }
  });
}

export function useStatsQuery() {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ProjectStats>({
    queryKey: ['stats', currentUser?.id],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.PROJECTS.STATS, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }
  });
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
export function useActivityMonthlyStatsQuery(filters?: { userId?: string; fromYearMonth?: string; toYearMonth?: string }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ActivityLogMonthlyStats[]>({
    queryKey: ['activity-logs', 'monthly-stats', filters?.userId, filters?.fromYearMonth, filters?.toYearMonth],
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
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
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
      return res.json();
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
    additionalInvalidates: [['stats']],
    errorSaveMessageKey: 'errorSavingProject',
    deleteConfirmMessageKey: 'confirmDeleteProject',
    permissionDeniedMessageKey: 'permissionDeniedOnlyOwnProjects',
  });
  
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const toggleDoneMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['stats'] });
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

  return {
    ...generic,
    toggleDoneMutation,
    updateNotesMutation,
    handleSaveNotes: async (id: string, notes: string | null): Promise<SaveResult> => {
      try {
        const data = await updateNotesMutation.mutateAsync({ id, notes });
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
    additionalInvalidates: [['stats'], ['permits']],
    errorSaveMessageKey: 'errorSavingClient',
    deleteConfirmMessageKey: 'confirmDeleteClient',
    permissionDeniedMessageKey: 'permissionDeniedClients',
  });
}

export function useUsersMutations() {
  const generic = useGenericMutations<User>({
    basePath: API_ROUTES.USERS.BASE,
    queryKeyToInvalidate: ['users'],
    additionalInvalidates: [['stats']],
    errorSaveMessageKey: 'errorSavingUser',
    deleteConfirmMessageKey: 'confirmDeleteUser',
    permissionDeniedMessageKey: 'permissionDeniedUsers',
  });
  
  const actionMutation = useGenericActionMutation();
  
  const handleApproveUser = (userId: string, role: string) => {
    return actionMutation.mutateAsync({
      path: API_ROUTES.USERS.APPROVE(userId),
      body: { role },
      queryKeysToInvalidate: [['users'], ['stats']],
    });
  };
  
  const handleRejectUser = (userId: string) => {
    return actionMutation.mutateAsync({
      path: API_ROUTES.USERS.REJECT(userId),
      queryKeysToInvalidate: [['users'], ['stats']],
    });
  };
  
  const handleForceLogoutUser = (userId: string) => {
    return actionMutation.mutateAsync({
      path: API_ROUTES.USERS.FORCE_LOGOUT(userId),
      queryKeysToInvalidate: [['users'], ['stats']],
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
    additionalInvalidates: [['stats']],
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
    additionalInvalidates: [['clients'], ['stats']],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeletePermit' as any,
  });
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export function useRolesQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Role[]>({
    queryKey: ['roles'],
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

