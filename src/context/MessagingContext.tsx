import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { STORAGE_KEYS, TIME_MS } from '../constants';
import { getApiUrl } from '../api';
import { useUsersDirectoryQuery, type DirectoryUser } from '../queries';
import { chatApi, type ChatConversationItem, type ChatMessageItem, type ChatUnreadSummary } from '../components/messaging/messagingApi';
import { chatStorage } from '../components/messaging/messagingStorage';

export interface ActiveChatWindow {
  conversationId: string;
  minimized: boolean;
  title?: string;
}

export type ChatDirectoryUser = DirectoryUser;

interface ChatContextType {
  onlineUserIds: Set<string>;
  activeWindows: ActiveChatWindow[];
  openChat: (conversationId: string, options?: { title?: string }) => void;
  openMessaging: (conversationId: string, options?: { title?: string }) => void;
  openDirectChatWithUser: (userId: string, userName?: string) => Promise<void>;
  openDirectMessagingWithUser: (userId: string, userName?: string) => Promise<void>;
  closeChat: (conversationId: string) => void;
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
  allUsers: ChatDirectoryUser[];
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
}

interface SavedMessagingState {
  isMainOpen: boolean;
  windows: ActiveChatWindow[];
}

const loadSavedMessagingState = (userId: string): SavedMessagingState => {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.MESSAGING_STATE(userId)) ||
      localStorage.getItem(`ekos_open_chats_${userId}`);
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
    const valid: ActiveChatWindow[] = [];
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
  state: { isMainOpen: boolean; windows: ActiveChatWindow[] }
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

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Track the userId for which open chats have been loaded
  const loadedUserIdRef = useRef<string | null>(currentUser?.id || null);

  const [activeWindows, setActiveWindows] = useState<ActiveChatWindow[]>(() => {
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
  const activeWindowsRef = useRef<ActiveChatWindow[]>(activeWindows);
  activeWindowsRef.current = activeWindows;
  const eventSourceRef = useRef<EventSource | null>(null);

  // Sync activeWindows and isMainOpen when user logs in or logs out
  useEffect(() => {
    if (!currentUser?.id) {
      loadedUserIdRef.current = null;
      setActiveWindows([]);
      setIsMainOpen(false);
      return;
    }

    if (loadedUserIdRef.current !== currentUser.id) {
      loadedUserIdRef.current = currentUser.id;
      const restored = loadSavedMessagingState(currentUser.id);
      setActiveWindows(restored.windows);
      setIsMainOpen(restored.isMainOpen);
    }
  }, [currentUser?.id]);

  // Persist open chats whenever activeWindows or isMainOpen changes (only if authenticated and loaded)
  useEffect(() => {
    if (currentUser?.id && loadedUserIdRef.current === currentUser.id) {
      saveMessagingStateToStorage(currentUser.id, { isMainOpen, windows: activeWindows });
    }
  }, [activeWindows, isMainOpen, currentUser?.id]);

  // Preload and cache all users for @mention highlights and directory lookups (only when authenticated)
  const { data: allUsers = [] } = useUsersDirectoryQuery({ enabled: Boolean(currentUser) });

  // Fetch lightweight unread summary (counts only) for badges; real-time updates pushed via SSE
  const { data: unreadSummary } = useQuery<ChatUnreadSummary>({
    queryKey: ['chat', 'unread-summary'],
    queryFn: () => chatApi.getUnreadSummary(),
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
      chatStorage.clearAll().catch(() => {});
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

      const url = getApiUrl(`/api/chat/stream?token=${encodeURIComponent(token)}`);
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
          const isWindowOpenAndVisible = activeWindowsRef.current.some(
            (w) => w.conversationId === conversationId && !w.minimized
          );
          const isOwnMessage = message.senderId === currentUser.id;
          const shouldBeRead = isOwnMessage || isWindowOpenAndVisible;

          chatStorage.upsertMessage(message).catch(() => {});

          queryClient.setQueryData<ChatMessageItem[]>(
            ['chat', 'messages', conversationId],
            (old = []) => {
              if (old.some((m) => m.id === message.id)) return old;
              return [...old, message];
            }
          );

          queryClient.setQueryData<ChatConversationItem[]>(
            ['chat', 'conversations'],
            (old = []) => {
              const exists = old.some((c) => c.id === conversationId);
              if (!exists && conversation) {
                const pIds =
                  conversation.participantIds ||
                  (conversation.participants || []).map((cp: any) =>
                    typeof cp === 'string' ? cp : cp.userId || cp.user?.id || cp.id
                  );

                // If this is a project chat, only add it if current user is participant or sender or window is open
                const isProjectChat = conversation.type === 'CONTEXTUAL' || conversation.contextType === 'PROJECT';
                const isParticipant = pIds.includes(currentUser.id);
                if (isProjectChat && !isParticipant && !isOwnMessage && !isWindowOpenAndVisible) {
                  return old;
                }

                const newConv: ChatConversationItem = {
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
              chatApi.markAsRead(conversationId).catch(() => {});
            } else {
              queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
            }
          }
        } catch {}
      });

      es.addEventListener('READ_RECEIPT', (e: MessageEvent) => {
        try {
          const { conversationId, lastReadAt } = JSON.parse(e.data);
          queryClient.setQueryData<ChatConversationItem[]>(
            ['chat', 'conversations'],
            (old = []) =>
              old.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0, lastReadAt } : c))
          );
          queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
        } catch {}
      });

      es.addEventListener('UNREAD_STATUS', (e: MessageEvent) => {
        try {
          const { conversationId, lastReadAt, unreadCount } = JSON.parse(e.data);
          queryClient.setQueryData<ChatConversationItem[]>(
            ['chat', 'conversations'],
            (old = []) =>
              old.map((c) => (c.id === conversationId ? { ...c, unreadCount, lastReadAt } : c))
          );
          queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
        } catch {}
      });

      es.addEventListener('MESSAGE_UPDATED', (e: MessageEvent) => {
        try {
          const { conversationId, message } = JSON.parse(e.data);
          chatStorage.upsertMessage(message).catch(() => {});
          queryClient.setQueryData<ChatMessageItem[]>(
            ['chat', 'messages', conversationId],
            (old = []) => old.map((m) => (m.id === message.id ? message : m))
          );
          queryClient.setQueryData<ChatConversationItem[]>(
            ['chat', 'conversations'],
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
            chatStorage.removeMessage(messageId).catch(() => {});
          } else if (updatedMessage) {
            chatStorage.upsertMessage(updatedMessage).catch(() => {});
          }
          queryClient.setQueryData<ChatMessageItem[]>(
            ['chat', 'messages', conversationId],
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
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversation', conversation.id] });
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
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
          }
        } catch {}
      });

      es.addEventListener('CONVERSATION_CLEARED', (e: MessageEvent) => {
        try {
          const { conversationId } = JSON.parse(e.data);
          if (conversationId) {
            chatStorage.clearConversation(conversationId).catch(() => {});
            queryClient.setQueryData<ChatMessageItem[]>(
              ['chat', 'messages', conversationId],
              []
            );
            setActiveWindows((prev) => prev.filter((w) => w.conversationId !== conversationId));
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
          }
        } catch {}
      });

      es.addEventListener('MUTE_UPDATED', (e: MessageEvent) => {
        try {
          const { conversationId, mutedUntil } = JSON.parse(e.data);
          queryClient.setQueryData<ChatConversationItem[]>(
            ['chat', 'conversations'],
            (old = []) =>
              old.map((c) =>
                c.id === conversationId
                  ? { ...c, muted: Boolean(mutedUntil), mutedUntil }
                  : c
              )
          );
          queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
        } catch {}
      });

      es.addEventListener('DND_UPDATED', (e: MessageEvent) => {
        try {
          const { dndUntil } = JSON.parse(e.data);
          queryClient.setQueryData<ChatUnreadSummary>(
            ['chat', 'unread-summary'],
            (old) => (old ? { ...old, dndUntil } : { totalUnread: 0, byConversation: {}, byProject: {}, dndUntil })
          );
          queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
          queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
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
        queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
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
      queryClient.setQueryData<ChatConversationItem[]>(
        ['chat', 'conversations'],
        (old = []) =>
          old.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
      await chatApi.markAsRead(conversationId);
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  }, [queryClient]);

  const openChat = useCallback((
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
    const convList = queryClient.getQueryData<ChatConversationItem[]>(['chat', 'conversations']);
    const listUnread = convList?.find((c) => c.id === conversationId)?.unreadCount ?? 0;
    if (summaryUnread > 0 || listUnread > 0) {
      markAsRead(conversationId);
    }
  }, [queryClient, unreadSummary, markAsRead]);

  const openDirectChatWithUser = useCallback(async (targetUserId: string, targetUserName?: string) => {
    if (!currentUser || targetUserId === currentUser.id) return;
    try {
      const conv = await chatApi.createConversation({
        type: 'DIRECT',
        participantIds: [targetUserId],
      });
      openChat(conv.id, { title: targetUserName || 'Direct Chat' });
    } catch (err) {
      console.error('Failed to start chat with user', err);
    }
  }, [currentUser, openChat]);

  const closeChat = useCallback((conversationId: string) => {
    setActiveWindows((prev) => prev.filter((w) => w.conversationId !== conversationId));
  }, []);

  const toggleMinimize = useCallback((conversationId: string) => {
    setActiveWindows((prev) =>
      prev.map((w) =>
        w.conversationId === conversationId ? { ...w, minimized: !w.minimized } : w
      )
    );
  }, []);

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
      await chatApi.markAsUnread(conversationId);
      // Close active window if open so it doesn't immediately auto-read
      setActiveWindows((prev) => prev.filter((w) => w.conversationId !== conversationId));
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    } catch (err) {
      console.error('Failed to mark as unread', err);
    }
  }, [queryClient]);

  const totalUnreadCount = unreadSummary?.totalUnread ?? 0;

  const dndUntil = unreadSummary?.dndUntil ?? null;

  const isDndActive = useMemo(() => {
    if (!dndUntil) return false;
    if (dndUntil === 'FOREVER') return true;
    const time = new Date(dndUntil).getTime();
    return !isNaN(time) && time > Date.now();
  }, [dndUntil]);

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
        await chatApi.leaveConversation(conversationId, currentUser.id);
        closeChat(conversationId);
        queryClient.setQueryData<ChatConversationItem[]>(
          ['chat', 'conversations'],
          (old = []) => old.filter((c) => c.id !== conversationId)
        );
        queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      } catch (err) {
        console.error('Failed to leave conversation', err);
        throw err;
      }
    },
    [currentUser, closeChat, queryClient]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await chatApi.deleteConversation(conversationId);
        await chatStorage.clearConversation(conversationId);
        closeChat(conversationId);
        queryClient.setQueryData<ChatMessageItem[]>(
          ['chat', 'messages', conversationId],
          []
        );
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
      } catch (err) {
        console.error('Failed to delete/clear conversation', err);
        throw err;
      }
    },
    [closeChat, queryClient]
  );

  const muteConversation = useCallback(
    async (conversationId: string, durationMinutes?: number, forever?: boolean) => {
      try {
        const res = await chatApi.muteConversation(conversationId, { durationMinutes, forever });
        queryClient.setQueryData<ChatConversationItem[]>(
          ['chat', 'conversations'],
          (old = []) =>
            old.map((c) =>
              c.id === conversationId
                ? { ...c, muted: true, mutedUntil: res.mutedUntil }
                : c
            )
        );
        queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
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
        await chatApi.unmuteConversation(conversationId);
        queryClient.setQueryData<ChatConversationItem[]>(
          ['chat', 'conversations'],
          (old = []) =>
            old.map((c) =>
              c.id === conversationId
                ? { ...c, muted: false, mutedUntil: null }
                : c
            )
        );
        queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
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
        const res = await chatApi.setDnd({ durationMinutes, forever, off });
        queryClient.setQueryData<ChatUnreadSummary>(
          ['chat', 'unread-summary'],
          (old) =>
            old
              ? { ...old, dndUntil: res.dndUntil }
              : { totalUnread: 0, byConversation: {}, byProject: {}, dndUntil: res.dndUntil }
        );
        queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      } catch (err) {
        console.error('Failed to update DND setting', err);
        throw err;
      }
    },
    [queryClient]
  );

  const contextValue = useMemo<ChatContextType>(
    () => ({
      onlineUserIds,
      activeWindows,
      openChat,
      openMessaging: openChat,
      openDirectChatWithUser,
      openDirectMessagingWithUser: openDirectChatWithUser,
      closeChat,
      closeMessaging: closeChat,
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
    }),
    [
      onlineUserIds,
      activeWindows,
      openChat,
      openDirectChatWithUser,
      closeChat,
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
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

const defaultChatContext: ChatContextType = {
  onlineUserIds: new Set(),
  activeWindows: [],
  openChat: () => {},
  openMessaging: () => {},
  openDirectChatWithUser: async () => {},
  openDirectMessagingWithUser: async () => {},
  closeChat: () => {},
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
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    return defaultChatContext;
  }
  return context;
};

export const useMessaging = useChat;
export const MessagingProvider = ChatProvider;
export const MessagingContext = ChatContext;
export type MessagingContextType = ChatContextType;
export type ActiveMessagingWindow = ActiveChatWindow;
export type MessagingDirectoryUser = ChatDirectoryUser;

