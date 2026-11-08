import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type ChatMessageItem, type ChatConversationItem } from './chatApi';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatMessageInput } from './ChatMessageInput';
import { useAuth } from '../../context/AuthContext';

interface ProjectChatPaneProps {
  projectId: string;
}

export const ProjectChatPane: React.FC<ProjectChatPaneProps> = ({ projectId }) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<ChatMessageItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Get or create contextual conversation for this project
  const { data: conversation, isLoading: isLoadingConv } = useQuery<ChatConversationItem>({
    queryKey: ['chat', 'context', 'PROJECT', projectId],
    queryFn: () => chatApi.getContextualConversation('PROJECT', projectId),
    meta: { silent: true },
  });

  const conversationId = conversation?.id;

  // 2. Fetch messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<ChatMessageItem[]>({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => (conversationId ? chatApi.getMessages(conversationId, { limit: 100 }) : Promise.resolve([])),
    enabled: Boolean(conversationId),
    refetchOnWindowFocus: false,
    meta: { silent: true },
  });

  // Mark as read when opened
  useEffect(() => {
    if (conversationId) {
      chatApi.markAsRead(conversationId).catch(() => {});
    }
  }, [conversationId]);

  // Scroll to bottom on load/messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (
    content: string,
    replyToId?: string | null,
    mentionedUserIds?: string[]
  ) => {
    if (!conversationId) return;
    await chatApi.sendMessage(conversationId, {
      content,
      replyToId,
      mentionedUserIds,
    });
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!conversationId) return;
    const updated = await chatApi.editMessage(messageId, newContent);
    queryClient.setQueryData<ChatMessageItem[]>(
      ['chat', 'messages', conversationId],
      (old = []) => old.map((m) => (m.id === messageId ? updated : m))
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!conversationId) return;
    const res = await chatApi.deleteMessage(messageId);
    queryClient.setQueryData<ChatMessageItem[]>(
      ['chat', 'messages', conversationId],
      (old = []) => {
        if (res.hardDeleted) {
          return old.filter((m) => m.id !== messageId);
        }
        return old.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: '' } : m
        );
      }
    );
  };

  if (isLoadingConv || !conversationId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        height: 520,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Messages Scroll Area */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          p: 2,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        {isLoadingMessages ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={28} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              No project discussions yet.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Post notes or questions here. Mention teammates with @ to notify them!
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              isCurrentUser={msg.senderId === currentUser?.id}
              canModerate={currentUser?.role === 'Administrator' || Boolean(currentUser?.isSystemAdmin)}
              onReply={(m) => setReplyingTo(m)}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
            />
          ))
        )}
      </Box>

      {/* Input */}
      <ChatMessageInput
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        placeholder="Type a message or note about this project..."
      />
    </Paper>
  );
};
