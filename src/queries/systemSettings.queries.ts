import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES, TIME_MS } from '../constants';
import type { AppNotification, Service } from '../types';

export function useSystemSettingsQuery() {
  return useQuery<Record<string, any>>({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.SYSTEM_SETTINGS.BASE);
      if (!res.ok) throw new Error('Failed to fetch system settings');
      return res.json();
    },
    staleTime: TIME_MS.FIVE_MINUTES,
  });
}

export function useWasteDisposalServiceId() {
  const { data: systemSettings = {}, isLoading } = useSystemSettingsQuery();
  const serviceId = (systemSettings['waste_disposal_service_id'] as string | undefined)?.trim() || '';
  const service = (systemSettings['waste_disposal_service'] as Service | undefined) || null;
  return { wasteDisposalServiceId: serviceId, wasteDisposalService: service, isLoading };
}

export function useSystemSettingsMutations() {
  const queryClient = useQueryClient();

  const updateSettingMutation = useMutation({
    mutationKey: ['system-settings'],
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await apiFetch(API_ROUTES.SYSTEM_SETTINGS.BY_KEY(key), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('Failed to update system setting');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['provided-services'] });
    },
  });

  return { updateSettingMutation };
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
  pendingUsersCount?: number;
}

export function useNotificationsQuery(enabled = true) {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    enabled,
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.NOTIFICATIONS.BASE);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      return {
        notifications: data?.notifications || [],
        unreadCount: typeof data?.unreadCount === 'number' ? data.unreadCount : 0,
        pendingUsersCount: typeof data?.pendingUsersCount === 'number' ? data.pendingUsersCount : undefined,
      };
    },
    refetchInterval: () => (typeof document !== 'undefined' && document.hidden ? false : TIME_MS.ONE_MINUTE),
    refetchOnWindowFocus: true,
    staleTime: TIME_MS.FIFTEEN_SECONDS,
  });
}

export function useNotificationsMutations() {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(API_ROUTES.NOTIFICATIONS.READ(id), { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark notification as read');
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const prev = queryClient.getQueryData<NotificationsResponse>(['notifications']);
      if (prev) {
        queryClient.setQueryData<NotificationsResponse>(['notifications'], {
          ...prev,
          notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        });
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['notifications'], ctx.prev);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(API_ROUTES.NOTIFICATIONS.MARK_ALL_READ, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark all notifications as read');
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const prev = queryClient.getQueryData<NotificationsResponse>(['notifications']);
      if (prev) {
        queryClient.setQueryData<NotificationsResponse>(['notifications'], {
          ...prev,
          notifications: prev.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['notifications'], ctx.prev);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(API_ROUTES.NOTIFICATIONS.BY_ID(id), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notification');
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const prev = queryClient.getQueryData<NotificationsResponse>(['notifications']);
      if (prev) {
        const target = prev.notifications.find((n) => n.id === id);
        const wasUnread = Boolean(target && !target.read);
        queryClient.setQueryData<NotificationsResponse>(['notifications'], {
          ...prev,
          notifications: prev.notifications.filter((n) => n.id !== id),
          unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
        });
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['notifications'], ctx.prev);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(API_ROUTES.NOTIFICATIONS.CLEAR_ALL, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear notifications');
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const prev = queryClient.getQueryData<NotificationsResponse>(['notifications']);
      if (prev) {
        queryClient.setQueryData<NotificationsResponse>(['notifications'], {
          ...prev,
          notifications: [],
          unreadCount: 0,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['notifications'], ctx.prev);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    markAsReadMutation,
    markAllAsReadMutation,
    deleteNotificationMutation,
    clearAllNotificationsMutation,
  };
}


