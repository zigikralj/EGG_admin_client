import { useQuery, useMutation, useInfiniteQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants/apiRoutes';
import { useAuthHeaders } from './queryUtils';
import type { ActivityLog, ActivityLogMonthlyStats, ActivityAnalytics } from '../types';
import type { ActivityLogsSummaryResponse } from '../components/activityLogs/types';

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
