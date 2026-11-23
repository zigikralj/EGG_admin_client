import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { STORAGE_KEYS, TIME_MS } from '../constants';
import { getApiUrl } from '../api';
import { useUsersDirectoryQuery, type DirectoryUser } from '../queries';
import { messagingApi, type MessagingConversationItem, type MessagingMessageItem, type MessagingUnreadSummary } from '../components/messaging/messagingApi';
import { messagingStorage } from '../components/messaging/messagingStorage';
import { useMessagingTitleIndicator } from '../hooks/useMessagingTitleIndicator';
import {
  DEFAULT_NOTIFICATION_PREFS,
  getBrowserNotificationPermission,
  loadNotificationPrefs,
  requestBrowserNotificationPermission,
  saveNotificationPrefs,
  showMessagingBrowserNotification,
  type MessagingNotificationPrefs,
} from '../utils/browserNotifications';

export interface ActiveMessagingWindow {
  conversationId: string;
  minimized: boolean;
  title?: string;
}

export type MessagingDirectoryUser = DirectoryUser;

export interface MessagingContextType {
  onlineUserIds: Set<string>;
  activeWindows: ActiveMessagingWindow[];
  openMessaging: (conversationId: string, options?: { title?: string }) => void;
  openDirectMessagingWithUser: (userId: string, userName?: string) => Promise<void>;
  closeMessaging: (conversationId: string) => void;
  toggleMinimize: (conversationId: string) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  markAsUnread: (conversationId: string) => Promise<void>;
  leaveConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  muteConversation: (conversationId: string, durationMinutes?: number, forever?: boolean) => Promise<void>;
  unmuteConversation: (conversationId: string) => Promise<void>;
  setDnd: (durationMinutes?: number, forever?: boolean, off?: boolean) => Promise<void>;
  dndUntil: string | null;
  isDndActive: boolean;
  totalUnreadCount: number;
  getProjectUnreadCount: (projectId: string) => number;
  getConversationUnreadCount: (conversationId: string) => number;
  allUsers: MessagingDirectoryUser[];
  isNewMessageOpen: boolean;
  isNewMessageMinimized: boolean;
  openNewMessage: () => void;
  closeNewMessage: () => void;
  toggleMinimizeNewMessage: () => void;
  isMainOpen: boolean;
  setIsMainOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openMainMessaging: () => void;
  closeMainMessaging: () => void;
  toggleMainMessaging: () => void;
  notificationPermission: NotificationPermission | 'unsupported';
  notificationPrefs: MessagingNotificationPrefs;
  enableDesktopNotifications: () => Promise<NotificationPermission | 'unsupported'>;
  setDesktopNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setDesktopNotificationsShowPreview: (showPreview: boolean) => void;
  dismissNotificationBanner: () => void;
}

interface SavedMessagingState {
  isMainOpen: boolean;
  windows: ActiveMessagingWindow[];
}

const loadSavedMessagingState = (userId: string): SavedMessagingState => {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.MESSAGING_STATE(userId));
    if (!raw) return { isMainOpen: false, windows: [] };
    const parsed = JSON.parse(raw);

    let rawWindows: any[] = [];
    let isMainOpen = false;

    if (Array.isArray(parsed)) {
      rawWindows = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.windows)) {
        rawWindows = parsed.windows;
      }
      if (typeof parsed.isMainOpen === 'boolean') {
        isMainOpen = parsed.isMainOpen;
      }
    }

    const seen = new Set<string>();
    const valid: ActiveMessagingWindow[] = [];
    for (const item of rawWindows) {
      if (
        item &&
        typeof item.conversationId === 'string' &&
        item.conversationId.trim() &&
        typeof item.minimized === 'boolean' &&
        !seen.has(item.conversationId)
      ) {
        seen.add(item.conversationId);
        valid.push({
          conversationId: item.conversationId,
          minimized: item.minimized,
          title: typeof item.title === 'string' ? item.title : undefined,
        });
      }
    }
    return {
      isMainOpen,
      windows: valid.slice(-3),
    };
  } catch (err) {
    console.error('Failed to load saved messaging state', err);
    return { isMainOpen: false, windows: [] };
  }
};

const saveMessagingStateToStorage = (
  userId: string,
  state: { isMainOpen: boolean; windows: ActiveMessagingWindow[] }
) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.MESSAGING_STATE(userId),
      JSON.stringify({
        isMainOpen: state.isMainOpen,
        windows: state.windows.slice(-3),
      })
    );
  } catch (err) {
    console.error('Failed to save messaging state', err);
  }
};

export const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => getBrowserNotificationPermission());
  const [notificationPrefs, setNotificationPrefs] = useState<MessagingNotificationPrefs>(() => {
    if (currentUser?.id) {
      return loadNotificationPrefs(currentUser.id);
    }
    return { ...DEFAULT_NOTIFICATION_PREFS };
  });

  // Track the userId for which open conversations have been loaded
  const loadedUserIdRef = useRef<string | null>(currentUser?.id || null);

  const [activeWindows, setActiveWindows] = useState<ActiveMessagingWindow[]>(() => {
    if (currentUser?.id) {
      return loadSavedMessagingState(currentUser.id).windows;
    }
    return [];
  });
  const [isMainOpen, setIsMainOpen] = useState<boolean>(() => {
    if (currentUser?.id) {
      return loadSavedMessagingState(currentUser.id).isMainOpen;
    }
    return false;
  });
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [isNewMessageMinimized, setIsNewMessageMinimized] = useState(false);
  const activeWindowsRef = useRef<ActiveMessagingWindow[]>(activeWindows);
  activeWindowsRef.current = activeWindows;
  const eventSourceRef = useRef<EventSource | null>(null);
  const notificationPrefsRef = useRef<MessagingNotificationPrefs>(notificationPrefs);
  notificationPrefsRef.current = notificationPrefs;
  const tRef = useRef(t);
  tRef.current = t;

  // Sync activeWindows, isMainOpen, and notification prefs when user logs in or logs out
  useEffect(() => {
    if (!currentUser?.id) {
      loadedUserIdRef.current = null;
      setActiveWindows([]);
      setIsMainOpen(false);
      setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFS });
      return;
    }

    if (loadedUserIdRef.current !== currentUser.id) {
      loadedUserIdRef.current = currentUser.id;
      const restored = loadSavedMessagingState(currentUser.id);
      setActiveWindows(restored.windows);
      setIsMainOpen(restored.isMainOpen);
      setNotificationPrefs(loadNotificationPrefs(currentUser.id));
      setNotificationPermission(getBrowserNotificationPermission());
    }
  }, [currentUser?.id]);

  // Persist open conversations whenever activeWindows or isMainOpen changes (only if authenticated and loaded)
  useEffect(() => {
    if (currentUser?.id && loadedUserIdRef.current === currentUser.id) {
      saveMessagingStateToStorage(currentUser.id, { isMainOpen, windows: activeWindows });
    }
  }, [activeWindows, isMainOpen, currentUser?.id]);

  // Persist notification prefs whenever they change (only if authenticated and loaded)
  useEffect(() => {
    if (currentUser?.id && loadedUserIdRef.current === currentUser.id) {
      saveNotificationPrefs(currentUser.id, notificationPrefs);
    }
  }, [notificationPrefs, currentUser?.id]);

  // Preload and cache all users for @mention highlights and directory lookups (only when authenticated)
  const { data: allUsers = [] } = useUsersDirectoryQuery({ enabled: Boolean(currentUser) });
  const allUsersRef = useRef(allUsers);
  allUsersRef.current = allUsers;
  const isDndActiveRef = useRef(false);
  const openMessagingRef = useRef<(conversationId: string, options?: { title?: string }) => void>(() => {});

  // Fetch lightweight unread summary (counts only) for badges; real-time updates pushed via SSE
  const { data: unreadSummary } = useQuery<MessagingUnreadSummary>({
    queryKey: ['messaging', 'unread-summary'],
    queryFn: () => messagingApi.getUnreadSummary(),
    enabled: Boolean(currentUser),
    staleTime: TIME_MS.ONE_MINUTE,
    meta: { silent: true },
  });

  // Setup SSE stream when user is logged in with 5-minute inactivity idle sleep
  useEffect(() => {
    if (!currentUser) {
      setOnlineUserIds(new Set());
      setActiveWindows([]);
      setIsNewMessageOpen(false);
      setIsNewMessageMinimized(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      messagingStorage.clearAll().catch(() => {});
      return;
    }

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return;

    let es: EventSource | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let isIdle = false;
    const IDLE_TIMEOUT_MS = TIME_MS.FIVE_MINUTES;

    const connectSSE = () => {
      if (es) return;

      const url = getApiUrl(`/api/messaging/stream?token=${encodeURIComponent(token)}`);
      es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('CONNECTED', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.onlineUserIds) {
            setOnlineUserIds(new Set(data.onlineUserIds));
          }
        } catch {}
      });

      es.addEventListener('USER_PRESENCE', (e: MessageEvent) => {
        try {
          const { userId, status } = JSON.parse(e.data);
          setOnlineUserIds((prev) => {
            const hasUser = prev.has(userId);
            if ((status === 'ONLINE' && hasUser) || (status !== 'ONLINE' && !hasUser)) {
              return prev;
            }
            const next = new Set(prev);
            if (status === 'ONLINE') next.add(userId);
            else next.delete(userId);
            return next;
          });
        } catch {}
      });

      es.addEventListener('MESSAGE_CREATED', (e: MessageEvent) => {
        try {
          const { conversationId, message, conversation } = JSON.parse(e.data);
          const isWindowOpenAndVisible =
            !document.hidden &&
            activeWindowsRef.current.some(
              (w) => w.conversationId === conversationId && !w.minimized
            );
          const isOwnMessage = message.senderId === currentUser.id;
          const shouldBeRead = isOwnMessage || isWindowOpenAndVisible;

          const cachedList = queryClient.getQueryData<MessagingConversationItem[]>([
            'messaging',
            'conversations',
          ]);
          const cachedConv = cachedList?.find((c) => c.id === conversationId);
          const targetConv = cachedConv || conversation;
          const isMuted = Boolean(cachedConv?.muted || conversation?.muted);
          const convParticipants: string[] =
            targetConv?.participantIds ||
            (targetConv?.participants || []).map((cp: any) =>
              typeof cp === 'string' ? cp : cp.userId || cp.user?.id || cp.id
            );
          const isProjectConversation =
            targetConv?.type === 'CONTEXTUAL' || targetConv?.contextType === 'PROJECT';
          const isGroupConversation = targetConv?.type === 'GROUP';
          const isWindowOpen = activeWindowsRef.current.some(
            (w) => w.conversationId === conversationId
          );
          const isConvParticipant =
            (convParticipants.length > 0
              ? convParticipants.includes(currentUser.id)
              : Boolean(cachedConv)) || isWindowOpen;
          const isAllowedForProject = !isProjectConversation || isConvParticipant;

          messagingStorage.upsertMessage(message).catch(() => {});

          queryClient.setQueryData<MessagingMessageItem[]>(
            ['messaging', 'messages', conversationId],
            (old = []) => {
              if (old.some((m) => m.id === message.id)) return old;
              return [...old, message];
            }
          );

          queryClient.setQueryData<MessagingConversationItem[]>(
            ['messaging', 'conversations'],
            (old = []) => {
              const exists = old.some((c) => c.id === conversationId);
              if (!exists && conversation) {
                const pIds =
                  conversation.participantIds ||
                  (conversation.participants || []).map((cp: any) =>
                    typeof cp === 'string' ? cp : cp.userId || cp.user?.id || cp.id
                  );

                // If this is a project conversation, only add it if current user is participant or sender or window is open
                const isProjConv = conversation.type === 'CONTEXTUAL' || conversation.contextType === 'PROJECT';
                const isParticipant = pIds.includes(currentUser.id);
                if (isProjConv && !isParticipant && !isOwnMessage && !isWindowOpenAndVisible) {
                  return old;
                }

                const newConv: MessagingConversationItem = {
                  id: conversation.id,
                  type: conversation.type,
                  title: conversation.title,
                  contextType: conversation.contextType,
                  contextId: conversation.contextId,
                  updatedAt: message.createdAt,
                  lastReadAt: new Date(0).toISOString(),
                  unreadCount: shouldBeRead ? 0 : 1,
                  participantIds: pIds,
                  lastMessage: message,
                };
                return [newConv, ...old];
              }

              return old.map((c) => {
                if (c.id !== conversationId) return c;
                return {
                  ...c,
                  lastMessage: message,
                  updatedAt: message.createdAt,
                  unreadCount: shouldBeRead ? 0 : c.unreadCount + 1,
                };
              });
            }
          );

          if (!isOwnMessage) {
            if (isWindowOpenAndVisible) {
              messagingApi.markAsRead(conversationId).catch(() => {});
            } else {
              queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
            }

            const isBackgrounded = document.hidden || !document.hasFocus();
            if (
              isBackgrounded &&
              !isDndActiveRef.current &&
              !isMuted &&
              isAllowedForProject &&
              notificationPrefsRef.current.enabled
            ) {
              const senderName =
                message.sender?.name ||
                allUsersRef.current.find((u) => u.id === message.senderId)?.name ||
                'User';
              const convTitle =
                targetConv?.title ||
                (isProjectConversation
                  ? tRef.current('messagingProjectDiscussion')
                  : isGroupConversation
                    ? tRef.current('messagingGroupConversation')
                    : senderName);

              showMessagingBrowserNotification({
                conversationId,
                senderName,
                conversationTitle: convTitle,
                isGroup: isGroupConversation,
                isProject: isProjectConversation,
                messageContent: message.content,
                showPreview: notificationPrefsRef.current.showPreview,
                privacyTitle: 'Ekos Green Group',
                privacyBody: tRef.current('messagingNotificationPrivacyBody'),
                onClick: () => openMessagingRef.current(conversationId, { title: convTitle }),
              });
            }
          }
        } catch {}
      });

      es.addEventListener('READ_RECEIPT', (e: MessageEvent) => {
        try {
          const { conversationId, lastReadAt } = JSON.parse(e.data);
          queryClient.setQueryData<MessagingConversationItem[]>(
            ['messaging', 'conversations'],
            (old = []) =>
              old.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0, lastReadAt } : c))
          );
          queryClient.setQueryData<MessagingUnreadSummary>(
            ['messaging', 'unread-summary'],
            (old) => {
              if (!old?.byConversation?.[conversationId]) return old;
              const nextByConv = { ...old.byConversation };
              delete nextByConv[conversationId];
              return { ...old, byConversation: nextByConv };
            }
          );
          queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
        } catch {}
      });

      es.addEventListener('UNREAD_STATUS', (e: MessageEvent) => {
        try {
          const { conversationId, lastReadAt, unreadCount } = JSON.parse(e.data);
          queryClient.setQueryData<MessagingConversationItem[]>(
            ['messaging', 'conversations'],
            (old = []) =>
              old.map((c) => (c.id === conversationId ? { ...c, unreadCount, lastReadAt } : c))
          );
          queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
        } catch {}
      });

      es.addEventListener('MESSAGE_UPDATED', (e: MessageEvent) => {
        try {
          const { conversationId, message } = JSON.parse(e.data);
          messagingStorage.upsertMessage(message).catch(() => {});
          queryClient.setQueryData<MessagingMessageItem[]>(
            ['messaging', 'messages', conversationId],
            (old = []) => old.map((m) => (m.id === message.id ? message : m))
          );
          queryClient.setQueryData<MessagingConversationItem[]>(
            ['messaging', 'conversations'],
            (old = []) =>
              old.map((c) => {
                if (c.id !== conversationId || !c.lastMessage) return c;
                if (
                  c.lastMessage.id === message.id ||
                  (message.seq && c.messageSeq === message.seq)
                ) {
                  return {
                    ...c,
                    lastMessage: {
                      ...c.lastMessage,
                      content: message.content,
                    },
                  };
                }
                return c;
              })
          );
        } catch {}
      });

      es.addEventListener('MESSAGE_DELETED', (e: MessageEvent) => {
        try {
          const { conversationId, messageId, hardDeleted, updatedMessage } = JSON.parse(e.data);
          if (hardDeleted) {
            messagingStorage.removeMessage(messageId).catch(() => {});
          } else if (updatedMessage) {
            messagingStorage.upsertMessage(updatedMessage).catch(() => {});
          }
          queryClient.setQueryData<MessagingMessageItem[]>(
            ['messaging', 'messages', conversationId],
            (old = []) => {
              if (hardDeleted) {
                return old.filter((m) => m.id !== messageId);
              }
              return old.map((m) => (m.id === messageId ? updatedMessage : m));
            }
          );
        } catch {}
      });

      es.addEventListener('NOTIFICATION', () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      });

      es.addEventListener('CONVERSATION_UPDATED', (e: MessageEvent) => {
        try {
          const conversation = JSON.parse(e.data);
          if (conversation?.id) {
            queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
            queryClient.invalidateQueries({ queryKey: ['messaging', 'conversation', conversation.id] });
            if (conversation.title) {
              setActiveWindows((prev) =>
                prev.map((w) =>
                  w.conversationId === conversation.id ? { ...w, title: conversation.title } : w
                )
              );
            }
          }
        } catch {}
      });

      es.addEventListener('REMOVED_FROM_CONVERSATION', (e: MessageEvent) => {
        try {
          const { conversationId } = JSON.parse(e.data);
          if (conversationId) {
            setActiveWindows((prev) => prev.filter((w) => w.conversationId !== conversationId));
            queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
            queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
          }
        } catch {}
      });

      es.addEventListener('CONVERSATION_CLEARED', (e: MessageEvent) => {
        try {
          const { conversationId } = JSON.parse(e.data);
          if (conversationId) {
            messagingStorage.clearConversation(conversationId).catch(() => {});
            queryClient.setQueryData<MessagingMessageItem[]>(
              ['messaging', 'messages', conversationId],
              []
            );
            setActiveWindows((prev) => prev.filter((w) => w.conversationId !== conversationId));
            queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
            queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
          }
        } catch {}
      });

      es.addEventListener('MUTE_UPDATED', (e: MessageEvent) => {
        try {
          const { conversationId, mutedUntil } = JSON.parse(e.data);
          queryClient.setQueryData<MessagingConversationItem[]>(
            ['messaging', 'conversations'],
            (old = []) =>
              old.map((c) =>
                c.id === conversationId
                  ? { ...c, muted: Boolean(mutedUntil), mutedUntil }
                  : c
              )
          );
          queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
        } catch {}
      });

      es.addEventListener('DND_UPDATED', (e: MessageEvent) => {
        try {
          const { dndUntil } = JSON.parse(e.data);
          queryClient.setQueryData<MessagingUnreadSummary>(
            ['messaging', 'unread-summary'],
            (old) => (old ? { ...old, dndUntil } : { totalUnread: 0, byConversation: {}, byProject: {}, dndUntil })
          );
          queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
          queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
        } catch {}
      });
    };

    const disconnectSSE = () => {
      if (es) {
        es.close();
        es = null;
        eventSourceRef.current = null;
      }
    };

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (isIdle) {
        isIdle = false;
        connectSSE();
        // Delta re-sync unread counters & conversations when waking up from idle
        queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
        queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
      }
      idleTimer = setTimeout(() => {
        isIdle = true;
        disconnectSSE();
      }, IDLE_TIMEOUT_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab backgrounded: start idle countdown
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          isIdle = true;
          disconnectSSE();
        }, IDLE_TIMEOUT_MS);
      } else {
        // Tab focused: wake immediately
        resetIdleTimer();
      }
    };

    // Initial connect
    connectSSE();
    resetIdleTimer();

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('mousemove', resetIdleTimer, { passive: true });
    window.addEventListener('keydown', resetIdleTimer, { passive: true });
    window.addEventListener('touchstart', resetIdleTimer, { passive: true });

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
      disconnectSSE();
    };
  }, [currentUser, queryClient]);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      queryClient.setQueryData<MessagingConversationItem[]>(
        ['messaging', 'conversations'],
        (old = []) =>
          old.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
      queryClient.setQueryData<MessagingUnreadSummary>(
        ['messaging', 'unread-summary'],
        (old) => {
          if (!old?.byConversation?.[conversationId]) return old;
          const nextByConv = { ...old.byConversation };
          delete nextByConv[conversationId];
          return { ...old, byConversation: nextByConv };
        }
      );
      await messagingApi.markAsRead(conversationId);
      queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  }, [queryClient]);

  const openMessaging = useCallback((
    conversationId: string,
    options?: { title?: string }
  ) => {
    setActiveWindows((prev) => {
      const existing = prev.find((w) => w.conversationId === conversationId);
      if (existing) {
        return prev.map((w) =>
          w.conversationId === conversationId ? { ...w, minimized: false } : w
        );
      }
      // Max 3 active docked windows side-by-side
      const trimmed = prev.length >= 3 ? prev.slice(1) : prev;
      return [
        ...trimmed,
        {
          conversationId,
          minimized: false,
          title: options?.title,
        },
      ];
    });

    // Only call markAsRead if the conversation actually has unread messages
    const summaryUnread = unreadSummary?.byConversation?.[conversationId] ?? 0;
    const convList = queryClient.getQueryData<MessagingConversationItem[]>(['messaging', 'conversations']);
    const listUnread = convList?.find((c) => c.id === conversationId)?.unreadCount ?? 0;
    if (summaryUnread > 0 || listUnread > 0) {
      markAsRead(conversationId);
    }
  }, [queryClient, unreadSummary, markAsRead]);

  const openDirectMessagingWithUser = useCallback(async (targetUserId: string, targetUserName?: string) => {
    if (!currentUser || targetUserId === currentUser.id) return;
    try {
      const conv = await messagingApi.createConversation({
        type: 'DIRECT',
        participantIds: [targetUserId],
      });
      openMessaging(conv.id, { title: targetUserName || 'Direct Message' });
    } catch (err) {
      console.error('Failed to start conversation with user', err);
    }
  }, [currentUser, openMessaging]);

  const closeMessaging = useCallback((conversationId: string) => {
    setActiveWindows((prev) => prev.filter((w) => w.conversationId !== conversationId));
  }, []);

  const getConversationUnreadCount = useCallback(
    (conversationId: string) => {
      const summaryCount = unreadSummary?.byConversation?.[conversationId] ?? 0;
      const convList = queryClient.getQueryData<MessagingConversationItem[]>(['messaging', 'conversations']);
      const listCount = convList?.find((c) => c.id === conversationId)?.unreadCount ?? 0;
      return Math.max(summaryCount, listCount);
    },
    [unreadSummary, queryClient]
  );

  const toggleMinimize = useCallback((conversationId: string) => {
    const target = activeWindowsRef.current.find((w) => w.conversationId === conversationId);
    const willOpen = Boolean(target?.minimized);

    setActiveWindows((prev) =>
      prev.map((w) =>
        w.conversationId === conversationId ? { ...w, minimized: !w.minimized } : w
      )
    );

    if (willOpen && getConversationUnreadCount(conversationId) > 0) {
      markAsRead(conversationId);
    }
  }, [getConversationUnreadCount, markAsRead]);

  const openNewMessage = useCallback(() => {
    setIsNewMessageOpen(true);
    setIsNewMessageMinimized(false);
  }, []);

  const closeNewMessage = useCallback(() => {
    setIsNewMessageOpen(false);
    setIsNewMessageMinimized(false);
  }, []);

  const toggleMinimizeNewMessage = useCallback(() => {
    setIsNewMessageMinimized((prev) => !prev);
  }, []);

  const openMainMessaging = useCallback(() => {
    setIsMainOpen(true);
  }, []);

  const closeMainMessaging = useCallback(() => {
    setIsMainOpen(false);
  }, []);

  const toggleMainMessaging = useCallback(() => {
    setIsMainOpen((prev) => !prev);
  }, []);

  const markAsUnread = useCallback(async (conversationId: string) => {
    try {
      await messagingApi.markAsUnread(conversationId);
      // Close active window if open so it doesn't immediately auto-read
      setActiveWindows((prev) => prev.filter((w) => w.conversationId !== conversationId));
      queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    } catch (err) {
      console.error('Failed to mark as unread', err);
    }
  }, [queryClient]);

  const totalUnreadCount = unreadSummary?.totalUnread ?? 0;

  useMessagingTitleIndicator({
    unreadCount: totalUnreadCount,
    enabled: Boolean(currentUser),
  });

  const dndUntil = unreadSummary?.dndUntil ?? null;

  const isDndActive = useMemo(() => {
    if (!dndUntil) return false;
    if (dndUntil === 'FOREVER') return true;
    const time = new Date(dndUntil).getTime();
    return !isNaN(time) && time > Date.now();
  }, [dndUntil]);

  isDndActiveRef.current = isDndActive;
  openMessagingRef.current = openMessaging;

  const enableDesktopNotifications = useCallback(async () => {
    const perm = await requestBrowserNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      setNotificationPrefs((prev) => ({
        ...prev,
        enabled: true,
        bannerDismissed: true,
      }));
    }
    return perm;
  }, []);

  const setDesktopNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const currentPerm = getBrowserNotificationPermission();
      setNotificationPermission(currentPerm);
      if (currentPerm === 'default') {
        const perm = await requestBrowserNotificationPermission();
        setNotificationPermission(perm);
        if (perm !== 'granted') return;
      } else if (currentPerm !== 'granted') {
        return;
      }
    }
    setNotificationPrefs((prev) => ({ ...prev, enabled }));
  }, []);

  const setDesktopNotificationsShowPreview = useCallback((showPreview: boolean) => {
    setNotificationPrefs((prev) => ({ ...prev, showPreview }));
  }, []);

  const dismissNotificationBanner = useCallback(() => {
    setNotificationPrefs((prev) => ({ ...prev, bannerDismissed: true }));
  }, []);

  const getProjectUnreadCount = useCallback(
    (projectId: string) => {
      return unreadSummary?.byProject?.[projectId] ?? 0;
    },
    [unreadSummary]
  );

  const leaveConversation = useCallback(
    async (conversationId: string) => {
      if (!currentUser) return;
      try {
        await messagingApi.leaveConversation(conversationId, currentUser.id);
        closeMessaging(conversationId);
        queryClient.setQueryData<MessagingConversationItem[]>(
          ['messaging', 'conversations'],
          (old = []) => old.filter((c) => c.id !== conversationId)
        );
        queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
        queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
      } catch (err) {
        console.error('Failed to leave conversation', err);
        throw err;
      }
    },
    [currentUser, closeMessaging, queryClient]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await messagingApi.deleteConversation(conversationId);
        await messagingStorage.clearConversation(conversationId);
        closeMessaging(conversationId);
        queryClient.setQueryData<MessagingMessageItem[]>(
          ['messaging', 'messages', conversationId],
          []
        );
        queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
        queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
      } catch (err) {
        console.error('Failed to delete/clear conversation', err);
        throw err;
      }
    },
    [closeMessaging, queryClient]
  );

  const muteConversation = useCallback(
    async (conversationId: string, durationMinutes?: number, forever?: boolean) => {
      try {
        const res = await messagingApi.muteConversation(conversationId, { durationMinutes, forever });
        queryClient.setQueryData<MessagingConversationItem[]>(
          ['messaging', 'conversations'],
          (old = []) =>
            old.map((c) =>
              c.id === conversationId
                ? { ...c, muted: true, mutedUntil: res.mutedUntil }
                : c
            )
        );
        queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
      } catch (err) {
        console.error('Failed to mute conversation', err);
        throw err;
      }
    },
    [queryClient]
  );

  const unmuteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await messagingApi.unmuteConversation(conversationId);
        queryClient.setQueryData<MessagingConversationItem[]>(
          ['messaging', 'conversations'],
          (old = []) =>
            old.map((c) =>
              c.id === conversationId
                ? { ...c, muted: false, mutedUntil: null }
                : c
            )
        );
        queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
      } catch (err) {
        console.error('Failed to unmute conversation', err);
        throw err;
      }
    },
    [queryClient]
  );

  const setDnd = useCallback(
    async (durationMinutes?: number, forever?: boolean, off?: boolean) => {
      try {
        const res = await messagingApi.setDnd({ durationMinutes, forever, off });
        queryClient.setQueryData<MessagingUnreadSummary>(
          ['messaging', 'unread-summary'],
          (old) =>
            old
              ? { ...old, dndUntil: res.dndUntil }
              : { totalUnread: 0, byConversation: {}, byProject: {}, dndUntil: res.dndUntil }
        );
        queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-summary'] });
        queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
      } catch (err) {
        console.error('Failed to update DND setting', err);
        throw err;
      }
    },
    [queryClient]
  );

  const contextValue = useMemo<MessagingContextType>(
    () => ({
      onlineUserIds,
      activeWindows,
      openMessaging,
      openDirectMessagingWithUser,
      closeMessaging,
      toggleMinimize,
      markAsRead,
      markAsUnread,
      leaveConversation,
      deleteConversation,
      muteConversation,
      unmuteConversation,
      setDnd,
      dndUntil,
      isDndActive,
      totalUnreadCount,
      getProjectUnreadCount,
      getConversationUnreadCount,
      allUsers,
      isNewMessageOpen,
      isNewMessageMinimized,
      openNewMessage,
      closeNewMessage,
      toggleMinimizeNewMessage,
      isMainOpen,
      setIsMainOpen,
      openMainMessaging,
      closeMainMessaging,
      toggleMainMessaging,
      notificationPermission,
      notificationPrefs,
      enableDesktopNotifications,
      setDesktopNotificationsEnabled,
      setDesktopNotificationsShowPreview,
      dismissNotificationBanner,
    }),
    [
      onlineUserIds,
      activeWindows,
      openMessaging,
      openDirectMessagingWithUser,
      closeMessaging,
      toggleMinimize,
      markAsRead,
      markAsUnread,
      leaveConversation,
      deleteConversation,
      muteConversation,
      unmuteConversation,
      setDnd,
      dndUntil,
      isDndActive,
      totalUnreadCount,
      getProjectUnreadCount,
      getConversationUnreadCount,
      allUsers,
      isNewMessageOpen,
      isNewMessageMinimized,
      openNewMessage,
      closeNewMessage,
      toggleMinimizeNewMessage,
      isMainOpen,
      openMainMessaging,
      closeMainMessaging,
      toggleMainMessaging,
      notificationPermission,
      notificationPrefs,
      enableDesktopNotifications,
      setDesktopNotificationsEnabled,
      setDesktopNotificationsShowPreview,
      dismissNotificationBanner,
    ]
  );

  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
    </MessagingContext.Provider>
  );
};

const defaultMessagingContext: MessagingContextType = {
  onlineUserIds: new Set(),
  activeWindows: [],
  openMessaging: () => {},
  openDirectMessagingWithUser: async () => {},
  closeMessaging: () => {},
  toggleMinimize: () => {},
  markAsRead: async () => {},
  markAsUnread: async () => {},
  leaveConversation: async () => {},
  deleteConversation: async () => {},
  muteConversation: async () => {},
  unmuteConversation: async () => {},
  setDnd: async () => {},
  dndUntil: null,
  isDndActive: false,
  totalUnreadCount: 0,
  getProjectUnreadCount: () => 0,
  getConversationUnreadCount: () => 0,
  allUsers: [],
  isNewMessageOpen: false,
  isNewMessageMinimized: false,
  openNewMessage: () => {},
  closeNewMessage: () => {},
  toggleMinimizeNewMessage: () => {},
  isMainOpen: false,
  setIsMainOpen: () => {},
  openMainMessaging: () => {},
  closeMainMessaging: () => {},
  toggleMainMessaging: () => {},
  notificationPermission: 'unsupported',
  notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
  enableDesktopNotifications: async () => 'unsupported',
  setDesktopNotificationsEnabled: async () => {},
  setDesktopNotificationsShowPreview: () => {},
  dismissNotificationBanner: () => {},
};

export const useMessaging = (): MessagingContextType => {
  const context = useContext(MessagingContext);
  if (!context) {
    return defaultMessagingContext;
  }
  return context;
};

