import React, { createContext, useContext, useEffect, useCallback } from 'react';
import type { AppNotification } from '../types';
import { useAuth } from './AuthContext';
import { useNotificationsQuery, useNotificationsMutations } from '../queries';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setPendingUsersCount } = useAuth();
  const { data, isLoading, refetch } = useNotificationsQuery(Boolean(currentUser));
  const {
    markAsReadMutation,
    markAllAsReadMutation,
    deleteNotificationMutation,
    clearAllNotificationsMutation,
  } = useNotificationsMutations();

  const notifications = currentUser ? (data?.notifications ?? []) : [];
  const unreadCount = currentUser ? (data?.unreadCount ?? 0) : 0;

  useEffect(() => {
    if (currentUser && typeof data?.pendingUsersCount === 'number') {
      setPendingUsersCount?.(data.pendingUsersCount);
    }
  }, [currentUser, data?.pendingUsersCount, setPendingUsersCount]);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    await refetch();
  }, [currentUser, refetch]);

  useEffect(() => {
    if (!currentUser) return;

    const handleCustomRefresh = () => {
      void refetch();
    };

    window.addEventListener('notifications:refresh', handleCustomRefresh);
    return () => {
      window.removeEventListener('notifications:refresh', handleCustomRefresh);
    };
  }, [currentUser, refetch]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!currentUser) return;
      await markAsReadMutation.mutateAsync(id).catch(() => {});
    },
    [currentUser, markAsReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;
    await markAllAsReadMutation.mutateAsync().catch(() => {});
  }, [currentUser, markAllAsReadMutation]);

  const deleteNotification = useCallback(
    async (id: string) => {
      if (!currentUser) return;
      await deleteNotificationMutation.mutateAsync(id).catch(() => {});
    },
    [currentUser, deleteNotificationMutation]
  );

  const clearAllNotifications = useCallback(async () => {
    if (!currentUser) return;
    await clearAllNotificationsMutation.mutateAsync().catch(() => {});
  }, [currentUser, clearAllNotificationsMutation]);

  const value = React.useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
