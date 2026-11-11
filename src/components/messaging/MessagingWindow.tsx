import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
  Button,
  ListItemText,
  Divider,
  InputBase,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
  Badge,
  AvatarGroup,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MarkChatUnreadOutlinedIcon from '@mui/icons-material/MarkChatUnreadOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type ChatMessageItem, type ChatConversationItem } from './messagingApi';
import { chatStorage } from './messagingStorage';
import { MessagingMessageBubble } from './MessagingMessageBubble';
import { MessagingMessageInput } from './MessagingMessageInput';
import { useAuth } from '../../context/AuthContext';
import { useChat, type ChatDirectoryUser } from '../../context/MessagingContext';
import { useLanguage } from '../../context/LanguageContext';
import { MessagingMemberSelector } from './MessagingMemberSelector';
import { TIME_MS } from '../../constants';

interface ChatWindowProps {
  conversationId: string;
  minimized: boolean;
  title?: string;
  onClose: () => void;
  onToggleMinimize: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  minimized,
  title,
  onClose,
  onToggleMinimize,
}) => {
  const { currentUser, role, actualRole, isRealAdmin, hasPermission } = useAuth();
  const { t } = useLanguage();
  const {
    markAsUnread,
    allUsers,
    onlineUserIds,
    muteConversation,
    unmuteConversation,
    deleteConversation,
    leaveConversation,
  } = useChat();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<ChatMessageItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group Details View state
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<ChatDirectoryUser[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Menus and Dialogs
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuView, setMoreMenuView] = useState<'root' | 'mute'>('root');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  const isManagerPlus =
    Boolean(currentUser?.isSystemAdmin) ||
    isRealAdmin ||
    role === 'Administrator' ||
    role === 'Manager' ||
    actualRole === 'Administrator' ||
    actualRole === 'Manager' ||
    hasPermission('projects', 'delete');

  // Read existing conversation metadata from the conversations list cache if available
  const cachedConversation = useMemo(() => {
    const list = queryClient.getQueryData<ChatConversationItem[]>(['chat', 'conversations']);
    return list?.find((c) => c.id === conversationId);
  }, [queryClient, conversationId]);

  // Load conversation details (participants, title, type)
  // Gated: only triggers network fetch if missing from cache or when opening Group Details drawer
  const { data: conversation = cachedConversation } = useQuery<ChatConversationItem>({
    queryKey: ['chat', 'conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId),
    enabled: !cachedConversation || showGroupDetails,
    initialData: cachedConversation,
    staleTime: TIME_MS.FIVE_MINUTES,
    refetchOnWindowFocus: false,
    meta: { silent: true },
  });

  const isGroup = conversation?.type === 'GROUP';
  const isProject = conversation?.type === 'CONTEXTUAL' || conversation?.contextType === 'PROJECT';
  const displayTitle =
    conversation?.title ||
    title ||
    (isGroup ? t('messagingGroupConversation') : isProject ? t('messagingProjectDiscussion') : t('messagingTitle'));
  const [groupTitle, setGroupTitle] = useState(displayTitle);

  // Keep groupTitle in sync when displayTitle updates
  useEffect(() => {
    setGroupTitle(displayTitle);
  }, [displayTitle]);

  const isTitleChanged = Boolean(
    groupTitle.trim() && groupTitle.trim() !== displayTitle.trim()
  );

  const isMuted = Boolean(conversation?.muted);

  const handleConfirmDelete = async () => {
    try {
      setActionLoading(true);
      await deleteConversation(conversationId);
      setDeleteConfirmOpen(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete chat', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmLeave = async () => {
    try {
      setActionLoading(true);
      await leaveConversation(conversationId);
      setLeaveConfirmOpen(false);
      onClose();
    } catch (err) {
      console.error('Failed to leave chat', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseMoreMenu = () => {
    setMoreMenuAnchor(null);
    setMoreMenuView('root');
  };

  const handleApplyMute = async (durationMinutes?: number, forever?: boolean) => {
    handleCloseMoreMenu();
    try {
      await muteConversation(conversationId, durationMinutes, forever);
    } catch (err) {
      console.error('Failed to mute conversation', err);
    }
  };

  const handleApplyUnmute = async () => {
    handleCloseMoreMenu();
    try {
      await unmuteConversation(conversationId);
    } catch (err) {
      console.error('Failed to unmute conversation', err);
    }
  };

  // Normalized participants list with guaranteed user details and IDs resolved from /users directory
  const normalizedParticipants = useMemo(() => {
    const rawList = conversation?.participantIds || conversation?.participants || [];
    return rawList.map((p: any) => {
      const u = p?.user || p;
      const uid = (typeof p === 'string' ? p : u?.id || p?.userId || p?.id) as string;
      const directoryUser = allUsers.find((user) => user.id === uid);
      return {
        id: uid,
        name: directoryUser?.name || (typeof p === 'object' ? p?.name || u?.name : '') || 'User',
        role: directoryUser?.role || (typeof p === 'object' ? p?.role || u?.role : '') || 'User',
        avatarUrl: directoryUser?.avatarUrl ?? (typeof p === 'object' ? p?.avatarUrl ?? u?.avatarUrl : null),
      };
    });
  }, [conversation?.participantIds, conversation?.participants, allUsers]);

  // Other participants (excluding currentUser)
  const otherParticipants = useMemo(() => {
    return normalizedParticipants.filter((p) => p.id !== currentUser?.id);
  }, [normalizedParticipants, currentUser?.id]);

  // For 1-on-1 direct conversations:
  const directPartner = useMemo(() => {
    if (isGroup || isProject) return null;
    return otherParticipants[0] || normalizedParticipants[0] || null;
  }, [isGroup, isProject, otherParticipants, normalizedParticipants]);

  const isPartnerOnline = directPartner ? onlineUserIds.has(directPartner.id) : false;

  // Load message history with IndexedDB local cache + cursor delta sync
  const { data: messages = [], isLoading } = useQuery<ChatMessageItem[]>({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: async () => {
      // 1. Try reading from local IndexedDB cache first
      const cached = await chatStorage.getMessages(conversationId);
      const meta = await chatStorage.getConversationMeta(conversationId);

      // If we have cached messages and a known sequence watermark, perform a lightweight forward delta sync
      if (cached && cached.length > 0 && meta?.maxSeq) {
        try {
          const deltaRes = await chatApi.syncMessageDeltas(conversationId, {
            afterSeq: meta.maxSeq,
            sinceUpdatedAt: meta.syncedAt,
          });

          if (deltaRes && deltaRes.delta) {
            let merged = [...cached];
            // Apply updated / deleted messages
            if (deltaRes.updatedMessages?.length) {
              const updatedMap = new Map(deltaRes.updatedMessages.map((m) => [m.id, m]));
              merged = merged.map((m) => updatedMap.get(m.id) || m);
            }
            // Append new messages
            if (deltaRes.newMessages?.length) {
              const existingIds = new Set(merged.map((m) => m.id));
              deltaRes.newMessages.forEach((nm) => {
                if (!existingIds.has(nm.id)) merged.push(nm);
              });
            }

            merged.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
            // Keep up to 100 most recent in IndexedDB
            const toPersist = merged.slice(-100);
            await chatStorage.saveMessages(conversationId, toPersist);
            return merged;
          }
        } catch (e) {
          console.warn('[ChatWindow] Delta sync failed, using cached messages:', e);
          return cached;
        }
      }

      // 2. Full fresh fetch if no local cache exists
      const fresh = (await chatApi.getMessages(conversationId, { limit: 50 })) as ChatMessageItem[];
      await chatStorage.saveMessages(conversationId, fresh);
      return fresh;
    },
    refetchOnWindowFocus: false,
    meta: { silent: true },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!minimized && !showGroupDetails && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, minimized, showGroupDetails]);

  const handleSendMessage = async (
    content: string,
    replyToId?: string | null,
    mentionedUserIds?: string[]
  ) => {
    await chatApi.sendMessage(conversationId, {
      content,
      replyToId,
      mentionedUserIds,
    });
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const updated = await chatApi.editMessage(messageId, newContent);
    chatStorage.upsertMessage(updated).catch(() => {});
    queryClient.setQueryData<ChatMessageItem[]>(
      ['chat', 'messages', conversationId],
      (old = []) => old.map((m) => (m.id === messageId ? updated : m))
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    const res = await chatApi.deleteMessage(messageId);
    if (res.hardDeleted) {
      chatStorage.removeMessage(messageId).catch(() => {});
    }
    queryClient.setQueryData<ChatMessageItem[]>(
      ['chat', 'messages', conversationId],
      (old = []) => {
        if (res.hardDeleted) {
          return old.filter((m) => m.id !== messageId);
        }
        return old.map((m) => {
          if (m.id !== messageId) return m;
          const softDeleted = { ...m, isDeleted: true, content: '' };
          chatStorage.upsertMessage(softDeleted).catch(() => {});
          return softDeleted;
        });
      }
    );
  };

  // Rename group chat
  const handleSaveTitle = async () => {
    if (!isTitleChanged || actionLoading) return;
    try {
      setActionLoading(true);
      await chatApi.renameConversation(conversationId, groupTitle.trim());
      await queryClient.invalidateQueries({ queryKey: ['chat', 'conversation', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    } catch (err) {
      console.error('Failed to rename group', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Add multiple participants to group
  const handleAddSelectedMembers = async () => {
    if (selectedUsersToAdd.length === 0 || actionLoading) return;
    try {
      setActionLoading(true);
      await chatApi.addParticipants(
        conversationId,
        selectedUsersToAdd.map((u) => u.id)
      );
      await queryClient.invalidateQueries({ queryKey: ['chat', 'conversation', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      setSelectedUsersToAdd([]);
    } catch (err) {
      console.error('Failed to add participants', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Remove participant or leave group
  const handleRemoveParticipant = async (targetUserId: string) => {
    const isSelf = targetUserId === currentUser?.id;
    const confirmMessage = isSelf
      ? 'Are you sure you want to leave this group conversation?'
      : 'Remove this person from the group conversation?';
    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(true);
      await chatApi.removeParticipant(conversationId, targetUserId);
      if (isSelf) {
        onClose();
      } else {
        await queryClient.invalidateQueries({ queryKey: ['chat', 'conversation', conversationId] });
        await queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      }
    } catch (err) {
      console.error('Failed to remove participant', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Paper
      elevation={8}
      sx={{
        width: minimized ? 210 : 320,
        height: minimized ? 44 : 420,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden',
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        border: 2,
        borderBottom: 0,
        borderColor: 'primary.main',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 -4px 20px rgba(76, 175, 80, 0.25), 0 -2px 12px rgba(0,0,0,0.5)'
            : '0 -4px 18px rgba(46, 125, 50, 0.2), 0 -2px 10px rgba(0,0,0,0.15)',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 44,
          px: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={onToggleMinimize}
      >
        {showGroupDetails && !minimized ? (
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, mr: 1, overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              size="small"
              sx={{ color: 'inherit', p: 0.25 }}
              onClick={() => {
                setShowGroupDetails(false);
                setSelectedUsersToAdd([]);
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <InputBase
              placeholder={t('messagingEnterGroupName')}
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveTitle();
                }
              }}
              sx={{
                flex: 1,
                color: 'inherit',
                fontWeight: 700,
                fontSize: '0.875rem',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(0, 0, 0, 0.22)'
                    : 'rgba(0, 0, 0, 0.1)',
                px: 1,
                py: 0.25,
                borderRadius: 1,
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.45)'
                    : 'rgba(255, 255, 255, 0.55)',
                '& input': {
                  p: 0,
                },
                '& input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.9)',
                  opacity: 1,
                },
                '&:focus-within': {
                  borderColor: '#ffffff',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(0, 0, 0, 0.32)'
                      : 'rgba(0, 0, 0, 0.16)',
                  boxShadow: '0 0 0 1px #ffffff',
                },
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 0,
              flex: 1,
              mr: 1,
              overflow: 'hidden',
            }}
          >
            {/* Avatar representation */}
            {isGroup ? (
              <AvatarGroup
                max={3}
                spacing="small"
                sx={{
                  flexShrink: 0,
                  '& .MuiAvatar-root': {
                    width: 24,
                    height: 24,
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    border: '1px solid white',
                    color: '#ffffff',
                  },
                  '& .MuiAvatarGroup-avatar': {
                    width: 24,
                    height: 24,
                    fontSize: '0.625rem',
                  },
                }}
              >
                {otherParticipants.length > 0
                  ? otherParticipants.map((p) => (
                      <Avatar key={p.id} src={p.avatarUrl || undefined} alt={p.name}>
                        {p.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                    ))
                  : normalizedParticipants.map((p) => (
                      <Avatar key={p.id} src={p.avatarUrl || undefined} alt={p.name}>
                        {p.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                    ))}
              </AvatarGroup>
            ) : isProject ? (
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  border: '1.5px solid rgba(255, 255, 255, 0.8)',
                }}
              >
                <FolderSpecialIcon sx={{ fontSize: 14 }} />
              </Avatar>
            ) : (
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                sx={{
                  flexShrink: 0,
                  '& .MuiBadge-badge': {
                    bgcolor: isPartnerOnline ? '#22c55e' : 'rgba(255, 255, 255, 0.5)',
                    width: 8,
                    height: 8,
                    minWidth: 8,
                    borderRadius: '50%',
                    border: '1.5px solid white',
                  },
                }}
              >
                <Avatar
                  src={directPartner?.avatarUrl || undefined}
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    border: '1.5px solid rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {directPartner?.name?.charAt(0)?.toUpperCase() || displayTitle?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              </Badge>
            )}

            {/* Title & Subtitle */}
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.85rem' }} noWrap>
                  {displayTitle}
                </Typography>
                {isMuted && (
                  <Tooltip title={t('messagingMuted')} arrow>
                    <NotificationsOffOutlinedIcon
                      sx={{ fontSize: '0.85rem', color: '#fef08a', flexShrink: 0 }}
                    />
                  </Tooltip>
                )}
              </Box>
              {isGroup && !minimized && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.68rem',
                    opacity: 0.9,
                    lineHeight: 1,
                    mt: 0.25,
                    display: 'block',
                  }}
                  noWrap
                >
                  <span>{t('messagingMembersCount', { count: normalizedParticipants.length })}</span>
                  {' • '}
                  <Box
                    component="span"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGroupDetails(true);
                    }}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      '&:hover': { opacity: 1 },
                    }}
                  >
                    {t('messagingViewInfo')}
                  </Box>
                </Typography>
              )}
              {!isGroup && !isProject && !minimized && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.68rem',
                    opacity: 0.85,
                    lineHeight: 1,
                    display: 'block',
                  }}
                  noWrap
                >
                  {isPartnerOnline ? t('tagOnline') : t('tagOffline')}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }} onClick={(e) => e.stopPropagation()}>
          {!minimized && !showGroupDetails && (
            <>
              {/* More options menu */}
              <IconButton
                size="small"
                onClick={(e) => {
                  setMoreMenuAnchor(e.currentTarget);
                  setMoreMenuView('root');
                }}
                sx={{ color: 'inherit', p: 0.5 }}
              >
                <MoreVertIcon sx={{ fontSize: '1.15rem' }} />
              </IconButton>

              <IconButton size="small" onClick={onToggleMinimize} sx={{ color: 'inherit', p: 0.5 }}>
                <MinimizeIcon fontSize="small" />
              </IconButton>
            </>
          )}
          {showGroupDetails && !minimized && (
            <IconButton size="small" onClick={onToggleMinimize} sx={{ color: 'inherit', p: 0.5 }}>
              <MinimizeIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={onClose} sx={{ color: 'inherit', p: 0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Body */}
      {!minimized && (
        <>
          {showGroupDetails ? (
            /* Group Details & Member Management View using ChatMemberSelector */
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                p: 1.25,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                bgcolor: 'background.default',
                overflow: 'hidden',
              }}
            >
              <MessagingMemberSelector
                existingMembers={normalizedParticipants
                  .filter((p) => p.id !== currentUser?.id)
                  .map((p) => ({
                    id: p.id,
                    name: p.name,
                    role: p.role,
                    avatarUrl: p.avatarUrl,
                  }))}
                onRemoveExistingMember={handleRemoveParticipant}
                selectedUsers={selectedUsersToAdd}
                onSelectedUsersChange={setSelectedUsersToAdd}
                placeholder="Search users to add..."
                listTitle="USERS"
              />

              <Divider sx={{ my: 0.25 }} />

              <Button
                variant="contained"
                color="primary"
                size="small"
                fullWidth
                disabled={selectedUsersToAdd.length === 0 || actionLoading}
                onClick={handleAddSelectedMembers}
                startIcon={
                  actionLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <GroupAddIcon fontSize="small" />
                  )
                }
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  fontSize: '0.8rem',
                  py: 0.75,
                  fontWeight: 700,
                }}
              >
                {selectedUsersToAdd.length > 0
                  ? `${t('messagingAddToGroup')} (${selectedUsersToAdd.length})`
                  : t('messagingAddToGroup')}
              </Button>
            </Box>
          ) : (
            /* Standard Chat Messages Stream */
            <>
              <Box
                ref={scrollRef}
                sx={{
                  flex: 1,
                  p: 1.5,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.default',
                }}
              >
                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="caption" color="text.secondary">
                      No messages yet. Say hello!
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

              {/* Footer Input */}
              <MessagingMessageInput
                onSendMessage={handleSendMessage}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </>
          )}
        </>
      )}

      {/* More Options Menu with nested Mute Notifications view */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleCloseMoreMenu}
        slotProps={{
          paper: {
            sx: { borderRadius: 2, minWidth: 210 },
          },
        }}
      >
        {moreMenuView === 'root' ? (
          <>
            {isGroup && (
              <MenuItem
                onClick={() => {
                  handleCloseMoreMenu();
                  setShowGroupDetails(true);
                }}
              >
                <ListItemIcon>
                  <GroupsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('messagingGroupDetails')} />
              </MenuItem>
            )}

            {/* Mute Notifications Sub-navigation */}
            <MenuItem
              onClick={() => setMoreMenuView('mute')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {isMuted ? (
                    <NotificationsOffOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />
                  ) : (
                    <NotificationsActiveOutlinedIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={t('messagingMuteNotifications')}
                  secondary={isMuted ? t('messagingMuted') : undefined}
                  slotProps={{
                    primary: { sx: { fontSize: '0.875rem', fontWeight: 500 } },
                    secondary: { sx: { fontSize: '0.725rem', color: 'warning.main', fontWeight: 600 } },
                  }}
                />
              </Box>
              <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </MenuItem>

            <MenuItem
              onClick={async () => {
                handleCloseMoreMenu();
                await markAsUnread(conversationId);
              }}
            >
              <ListItemIcon>
                <MarkChatUnreadOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('messagingMarkAsUnread')} />
            </MenuItem>

            {(isGroup || conversation?.type === 'CONTEXTUAL') && (
              <MenuItem
                onClick={() => {
                  handleCloseMoreMenu();
                  setLeaveConfirmOpen(true);
                }}
              >
                <ListItemIcon>
                  <ExitToAppIcon fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText primary={t('messagingLeaveConversation')} />
              </MenuItem>
            )}

            {isManagerPlus && (
              <MenuItem
                onClick={() => {
                  handleCloseMoreMenu();
                  setDeleteConfirmOpen(true);
                }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <DeleteOutlinedIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary={t('messagingDeleteEntireConversation')} />
              </MenuItem>
            )}
          </>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 0.75,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <IconButton
                size="small"
                onClick={() => setMoreMenuView('root')}
                sx={{ p: 0.5, mr: 0.5, color: 'text.secondary' }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {t('messagingMuteNotifications')}
              </Typography>
            </Box>
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
          </>
        )}
      </Menu>

      {/* Delete / Clear Conversation Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !actionLoading && setDeleteConfirmOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          {t('messagingConfirmDeleteTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontWeight: 500 }}>
            {t('messagingConfirmDeleteText')}
          </DialogContentText>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Target: <strong>{displayTitle}</strong>
          </Typography>
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
            onClick={handleConfirmDelete}
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

      {/* Leave Conversation Confirmation Dialog */}
      <Dialog
        open={leaveConfirmOpen}
        onClose={() => !actionLoading && setLeaveConfirmOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('messagingConfirmLeaveTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>
            {t('messagingConfirmLeaveText', { title: displayTitle })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setLeaveConfirmOpen(false)}
            disabled={actionLoading}
            variant="outlined"
            size="small"
          >
            {t('btnCancel')}
          </Button>
          <Button
            onClick={handleConfirmLeave}
            disabled={actionLoading}
            variant="contained"
            color="warning"
            size="small"
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <ExitToAppIcon />}
          >
            {t('messagingLeaveConversation')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export const MessagingWindow = ChatWindow;
