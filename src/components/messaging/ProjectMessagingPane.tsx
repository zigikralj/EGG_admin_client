import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type ChatMessageItem, type ChatConversationItem } from './messagingApi';
import { MessagingMessageBubble } from './MessagingMessageBubble';
import { MessagingMessageInput } from './MessagingMessageInput';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/MessagingContext';
import { useLanguage } from '../../context/LanguageContext';

interface ProjectChatPaneProps {
  projectId: string;
}

export const ProjectChatPane: React.FC<ProjectChatPaneProps> = ({ projectId }) => {
  const { currentUser, role, actualRole, isRealAdmin, hasPermission } = useAuth();
  const { t } = useLanguage();
  const {
    getProjectUnreadCount,
    markAsRead,
    deleteConversation,
    muteConversation,
    unmuteConversation,
  } = useChat();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<ChatMessageItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [muteMenuAnchor, setMuteMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isManagerPlus =
    Boolean(currentUser?.isSystemAdmin) ||
    isRealAdmin ||
    role === 'Administrator' ||
    role === 'Manager' ||
    actualRole === 'Administrator' ||
    actualRole === 'Manager' ||
    hasPermission('projects', 'delete');

  // 1. Get or create contextual conversation for this project
  const { data: conversation, isLoading: isLoadingConv } = useQuery<ChatConversationItem>({
    queryKey: ['chat', 'context', 'PROJECT', projectId],
    queryFn: () => chatApi.getContextualConversation('PROJECT', projectId),
    meta: { silent: true },
  });

  const conversationId = conversation?.id;
  const projectUnread = getProjectUnreadCount(projectId);
  const isMuted = Boolean(conversation?.muted);

  // 2. Fetch messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<ChatMessageItem[]>({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => (conversationId ? chatApi.getMessages(conversationId, { limit: 100 }) : Promise.resolve([])),
    enabled: Boolean(conversationId),
    refetchOnWindowFocus: false,
    meta: { silent: true },
  });

  // Mark as read when opened or when new unread messages arrive while viewing
  useEffect(() => {
    if (conversationId && projectUnread > 0) {
      markAsRead(conversationId);
    }
  }, [conversationId, projectUnread, markAsRead]);

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

  const handleConfirmClear = async () => {
    if (!conversationId) return;
    try {
      setActionLoading(true);
      await deleteConversation(conversationId);
      setDeleteConfirmOpen(false);
      queryClient.setQueryData<ChatMessageItem[]>(
        ['chat', 'messages', conversationId],
        []
      );
    } catch (err) {
      console.error('Failed to clear project chat', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyMute = async (durationMinutes?: number, forever?: boolean) => {
    if (!conversationId) return;
    setMuteMenuAnchor(null);
    try {
      await muteConversation(conversationId, durationMinutes, forever);
    } catch (err) {
      console.error('Failed to mute project conversation', err);
    }
  };

  const handleApplyUnmute = async () => {
    if (!conversationId) return;
    setMuteMenuAnchor(null);
    try {
      await unmuteConversation(conversationId);
    } catch (err) {
      console.error('Failed to unmute project conversation', err);
    }
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
      {/* Top Header Bar */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
          {t('messagingProjectDiscussion')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Mute button */}
          <Tooltip title={isMuted ? t('messagingUnmuteConversation') : t('messagingMuteNotifications')} arrow>
            <IconButton
              size="small"
              onClick={(e) => setMuteMenuAnchor(e.currentTarget)}
              sx={{ color: isMuted ? 'warning.main' : 'text.secondary' }}
            >
              {isMuted ? (
                <NotificationsOffOutlinedIcon fontSize="small" />
              ) : (
                <NotificationsActiveOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          {/* Clear chat button for Manager+ */}
          {isManagerPlus && messages.length > 0 && (
            <Tooltip title={t('messagingClearHistory')} arrow>
              <Button
                size="small"
                variant="text"
                color="error"
                startIcon={<DeleteOutlinedIcon fontSize="small" />}
                onClick={() => setDeleteConfirmOpen(true)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  py: 0.25,
                  px: 0.75,
                }}
              >
                {t('messagingClearConversation')}
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>

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
            <MessagingMessageBubble
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
      <MessagingMessageInput
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        placeholder="Type a message or note about this project..."
      />

      {/* Mute Menu */}
      <Menu
        anchorEl={muteMenuAnchor}
        open={Boolean(muteMenuAnchor)}
        onClose={() => setMuteMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: { borderRadius: 2, minWidth: 170 },
          },
        }}
      >
        <Typography variant="caption" sx={{ px: 2, py: 0.75, display: 'block', color: 'text.secondary', fontWeight: 700 }}>
          {t('messagingMuteNotifications')}
        </Typography>
        {isMuted && (
          <MenuItem onClick={handleApplyUnmute}>
            <ListItemIcon>
              <NotificationsActiveOutlinedIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary={t('messagingUnmuteConversation')} />
          </MenuItem>
        )}
        <MenuItem onClick={() => handleApplyMute(60)}>{t('messagingFor1Hour')}</MenuItem>
        <MenuItem onClick={() => handleApplyMute(480)}>{t('messagingFor8Hours')}</MenuItem>
        <MenuItem onClick={() => handleApplyMute(1440)}>{t('messagingFor24Hours')}</MenuItem>
        <MenuItem onClick={() => handleApplyMute(undefined, true)}>{t('messagingUntilTurnOn')}</MenuItem>
      </Menu>

      {/* Delete / Clear Conversation Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !actionLoading && setDeleteConfirmOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          {t('messagingClearProjectConversation')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontWeight: 500 }}>
            {t('messagingConfirmClearProjectText')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={actionLoading}
            variant="outlined"
            size="small"
          >
            {t('btnCancel')}
          </Button>
          <Button
            onClick={handleConfirmClear}
            disabled={actionLoading}
            variant="contained"
            color="error"
            size="small"
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlinedIcon />}
          >
            {t('btnDelete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export const ProjectMessagingPane = ProjectChatPane;
export type ProjectMessagingPaneProps = ProjectChatPaneProps;

