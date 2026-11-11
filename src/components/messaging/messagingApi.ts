import { apiFetch } from '../../api';

export interface ChatParticipantUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    role?: string;
    email?: string;
  };
}

export interface ChatMessageSender {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface ChatMessageReplyTo {
  id: string;
  content: string;
  isDeleted: boolean;
  sender?: { id: string; name: string };
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  seq?: number;
  senderId: string;
  content: string;
  replyToId?: string | null;
  isEdited: boolean;
  editedAt?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
  sender: ChatMessageSender;
  replyTo?: ChatMessageReplyTo | null;
}

export interface ChatConversationItem {
  id: string;
  type: 'DIRECT' | 'GROUP' | 'CONTEXTUAL';
  title?: string | null;
  contextType?: string | null;
  contextId?: string | null;
  messageSeq?: number;
  lastReadSeq?: number;
  updatedAt: string;
  lastReadAt?: string;
  unreadCount: number;
  muted?: boolean;
  mutedUntil?: string | null;
  participantIds?: string[];
  participants?: (ChatParticipantUser | { id: string; userId?: string } | string)[];
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; name?: string };
  } | null;
}

export interface ChatMessageDeltaSyncResponse {
  delta: boolean;
  newMessages: ChatMessageItem[];
  updatedMessages: ChatMessageItem[];
  currentSeq: number;
  syncedAt: string;
}

export interface ChatUnreadSummary {
  totalUnread: number;
  byConversation: Record<string, number>;
  byProject: Record<string, number>;
  dndUntil?: string | null;
}

export const chatApi = {
  getUnreadSummary: async (): Promise<ChatUnreadSummary> => {
    const res = await apiFetch('/api/chat/unread-summary');
    if (!res.ok) throw new Error('Failed to fetch unread summary');
    return res.json();
  },

  getConversations: async (): Promise<ChatConversationItem[]> => {
    const res = await apiFetch('/api/chat/conversations');
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  createConversation: async (payload: {
    type?: 'DIRECT' | 'GROUP';
    participantIds: string[];
    title?: string;
  }): Promise<ChatConversationItem> => {
    const res = await apiFetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  getContextualConversation: async (
    type: string,
    id: string
  ): Promise<ChatConversationItem> => {
    const res = await apiFetch(`/api/chat/conversations/context/${type}/${id}`);
    if (!res.ok) throw new Error('Failed to load contextual conversation');
    return res.json();
  },

  getMessages: async (
    conversationId: string,
    options?: { beforeSeq?: number; limit?: number }
  ): Promise<ChatMessageItem[]> => {
    const params = new URLSearchParams();
    if (options?.beforeSeq !== undefined) params.set('beforeSeq', String(options.beforeSeq));
    if (options?.limit) params.set('limit', String(options.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await apiFetch(`/api/chat/conversations/${conversationId}/messages${qs}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  syncMessageDeltas: async (
    conversationId: string,
    options: { afterSeq: number; sinceUpdatedAt?: string }
  ): Promise<ChatMessageDeltaSyncResponse> => {
    const params = new URLSearchParams();
    params.set('afterSeq', String(options.afterSeq));
    if (options.sinceUpdatedAt) params.set('sinceUpdatedAt', options.sinceUpdatedAt);

    const res = await apiFetch(`/api/chat/conversations/${conversationId}/messages?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to sync message deltas');
    return res.json();
  },

  sendMessage: async (
    conversationId: string,
    payload: {
      content: string;
      replyToId?: string | null;
      mentionedUserIds?: string[];
    }
  ): Promise<ChatMessageItem> => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  editMessage: async (
    messageId: string,
    content: string
  ): Promise<ChatMessageItem> => {
    const res = await apiFetch(`/api/chat/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to edit message');
    return res.json();
  },

  deleteMessage: async (
    messageId: string
  ): Promise<{ success: boolean; hardDeleted: boolean }> => {
    const res = await apiFetch(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete message');
    return res.json();
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await apiFetch(`/api/chat/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  },

  markAsUnread: async (conversationId: string): Promise<{ success: boolean; unreadCount: number }> => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}/unread`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to mark conversation as unread');
    return res.json();
  },

  getConversation: async (conversationId: string): Promise<ChatConversationItem> => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}`);
    if (!res.ok) throw new Error('Failed to fetch conversation details');
    return res.json();
  },

  renameConversation: async (
    conversationId: string,
    title: string
  ): Promise<ChatConversationItem> => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed to rename conversation');
    return res.json();
  },

  addParticipants: async (
    conversationId: string,
    userIds: string[]
  ): Promise<{ conversation: ChatConversationItem; addedUsers: ChatParticipantUser[] }> => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    });
    if (!res.ok) throw new Error('Failed to add participants');
    return res.json();
  },

  removeParticipant: async (
    conversationId: string,
    targetUserId: string
  ): Promise<{ success: boolean; removedUserId: string; isLeaving: boolean }> => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}/participants/${targetUserId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove participant');
    return res.json();
  },

  leaveConversation: async (
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; isLeaving: boolean }> => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}/participants/${userId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to leave conversation');
    return res.json();
  },

  muteConversation: async (
    conversationId: string,
    options?: { durationMinutes?: number; forever?: boolean }
  ): Promise<{ success: boolean; conversationId: string; mutedUntil: string | null }> => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}/mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) throw new Error('Failed to mute conversation');
    return res.json();
  },

  unmuteConversation: async (
    conversationId: string
  ): Promise<{ success: boolean; conversationId: string; mutedUntil: null }> => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}/mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unmute: true }),
    });
    if (!res.ok) throw new Error('Failed to unmute conversation');
    return res.json();
  },

  setDnd: async (
    options: { durationMinutes?: number; forever?: boolean; off?: boolean }
  ): Promise<{ success: boolean; dndUntil: string | null }> => {
    const res = await apiFetch('/api/chat/dnd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) throw new Error('Failed to update DND setting');
    return res.json();
  },

  deleteConversation: async (
    conversationId: string
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete conversation');
    }
    return res.json();
  },
};

export const messagingApi = chatApi;
export type MessagingParticipantUser = ChatParticipantUser;
export type MessagingMessageSender = ChatMessageSender;
export type MessagingMessageReplyTo = ChatMessageReplyTo;
export type MessagingMessageItem = ChatMessageItem;
export type MessagingConversationItem = ChatConversationItem;
export type MessagingUnreadSummary = ChatUnreadSummary;

