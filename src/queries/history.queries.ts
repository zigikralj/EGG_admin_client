import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants/apiRoutes';
import { useAuthHeaders } from './queryUtils';
import type {
  EntityTimelineResponse,
  VersionDiffResponse,
  RebuiltVersionResponse,
  RestoreVersionResponse,
} from '../types';

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
