import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AppNotification } from '../types';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';
import { useAuth } from './AuthContext';

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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await apiFetch(API_ROUTES.NOTIFICATIONS.BASE, {
        headers: {
          'X-User-Id': currentUser.id,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
        if (typeof data.pendingUsersCount === 'number') {
          setPendingUsersCount?.(data.pendingUsersCount);
        }
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [currentUser, setPendingUsersCount]);

  // Initial fetch when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser, fetchNotifications]);

  // Polling with Page Visibility API
  useEffect(() => {
    if (!currentUser) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(() => {
        if (!document.hidden) {
          fetchNotifications();
        }
      }, 60000); // 60 seconds (optimized from 25s for egress bandwidth)
    };

    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchNotifications();
        startPolling();
      }
    };

    const handleCustomRefresh = () => {
      fetchNotifications();
    };

    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('notifications:refresh', handleCustomRefresh);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('notifications:refresh', handleCustomRefresh);
    };
  }, [currentUser, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    if (!currentUser) return;
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiFetch(API_ROUTES.NOTIFICATIONS.READ(id), {
        method: 'PATCH',
        headers: { 'X-User-Id': currentUser.id },
      });
    } catch (e) {
      console.error('Error marking notification as read:', e);
      fetchNotifications();
    }
  }, [currentUser, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await apiFetch(API_ROUTES.NOTIFICATIONS.MARK_ALL_READ, {
        method: 'PATCH',
        headers: { 'X-User-Id': currentUser.id },
      });
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
      fetchNotifications();
    }
  }, [currentUser, fetchNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!currentUser) return;
    const target = notifications.find((n) => n.id === id);
    const wasUnread = target && !target.read;

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await apiFetch(API_ROUTES.NOTIFICATIONS.BY_ID(id), {
        method: 'DELETE',
        headers: { 'X-User-Id': currentUser.id },
      });
    } catch (e) {
      console.error('Error deleting notification:', e);
      fetchNotifications();
    }
  }, [currentUser, notifications, fetchNotifications]);

  const clearAllNotifications = useCallback(async () => {
    if (!currentUser) return;
    setNotifications([]);
    setUnreadCount(0);

    try {
      await apiFetch(API_ROUTES.NOTIFICATIONS.CLEAR_ALL, {
        method: 'DELETE',
        headers: { 'X-User-Id': currentUser.id },
      });
    } catch (e) {
      console.error('Error clearing notifications:', e);
      fetchNotifications();
    }
  }, [currentUser, fetchNotifications]);

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
