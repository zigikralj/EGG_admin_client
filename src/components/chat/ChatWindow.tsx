import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
  TextField,
  Button,
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MarkChatUnreadOutlinedIcon from '@mui/icons-material/MarkChatUnreadOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type ChatMessageItem, type ChatConversationItem } from './chatApi';
import { chatStorage } from './chatStorage';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatMessageInput } from './ChatMessageInput';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { UserAutocomplete } from '../common/autocomplete';
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
  const { currentUser } = useAuth();
  const { markAsUnread, allUsers, onlineUserIds } = useChat();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<ChatMessageItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group Details View state
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
  const displayTitle = conversation?.title || title || (isGroup ? 'Group Chat' : 'Chat');
  const [groupTitle, setGroupTitle] = useState(displayTitle);

  // Keep groupTitle in sync when displayTitle updates
  useEffect(() => {
    setGroupTitle(displayTitle);
  }, [displayTitle]);

  const isTitleChanged = Boolean(
    groupTitle.trim() && groupTitle.trim() !== displayTitle.trim()
  );

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

  const existingUserIds = useMemo(
    () => new Set(normalizedParticipants.map((p) => p.id)),
    [normalizedParticipants]
  );

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

  // Add participant to group
  const handleAddParticipant = async (userIdToAdd: string) => {
    if (!userIdToAdd || actionLoading) return;
    try {
      setActionLoading(true);
      await chatApi.addParticipants(conversationId, [userIdToAdd]);
      await queryClient.invalidateQueries({ queryKey: ['chat', 'conversation', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    } catch (err) {
      console.error('Failed to add participant', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Remove participant or leave group
  const handleRemoveParticipant = async (targetUserId: string) => {
    const isSelf = targetUserId === currentUser?.id;
    const confirmMessage = isSelf
      ? 'Are you sure you want to leave this group chat?'
      : 'Remove this person from the group chat?';
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
        width: 320,
        height: minimized ? 44 : 420,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden',
        transition: 'height 0.25s ease-in-out',
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
        {showGroupDetails ? (
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowGroupDetails(false);
            }}
          >
            <IconButton size="small" sx={{ color: 'inherit', p: 0.25 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Group Details
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 175 }}
            onClick={(e) => {
              if (isGroup && !minimized) {
                e.stopPropagation();
                setShowGroupDetails(true);
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
              {displayTitle}
            </Typography>
            {isGroup && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.68rem',
                  opacity: 0.9,
                  lineHeight: 1,
                  mt: 0.25,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
                noWrap
              >
                {normalizedParticipants.length} members • View info
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
          {!minimized && !showGroupDetails && isGroup && (
            <Tooltip title="Group info & members" arrow>
              <IconButton
                size="small"
                onClick={() => setShowGroupDetails(true)}
                sx={{ color: 'inherit', p: 0.5 }}
              >
                <GroupsIcon sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </Tooltip>
          )}

          {!minimized && !showGroupDetails && (
            <>
              <Tooltip title="Mark as unread" arrow>
                <IconButton
                  size="small"
                  onClick={async () => {
                    await markAsUnread(conversationId);
                  }}
                  sx={{ color: 'inherit', p: 0.5 }}
                >
                  <MarkChatUnreadOutlinedIcon sx={{ fontSize: '1.05rem' }} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={onToggleMinimize} sx={{ color: 'inherit', p: 0.5 }}>
                <MinimizeIcon fontSize="small" />
              </IconButton>
            </>
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
            /* Group Details & Member Management View */
            <Box
              sx={{
                flex: 1,
                p: 1.5,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                bgcolor: 'background.default',
              }}
            >
              {/* 1. Group Title */}
              <TextField
                label="Group Name"
                size="small"
                fullWidth
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isTitleChanged) {
                    e.preventDefault();
                    handleSaveTitle();
                  }
                }}
                placeholder="Enter group name"
                disabled={actionLoading}
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                slotProps={{
                  input: {
                    sx: { fontSize: '0.875rem', fontWeight: 600 },
                    endAdornment: isTitleChanged ? (
                      <InputAdornment position="end">
                        <Tooltip title="Save group name">
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={handleSaveTitle}
                              disabled={actionLoading}
                              edge="end"
                              sx={{ p: 0.5 }}
                            >
                              {actionLoading ? (
                                <CircularProgress size={16} />
                              ) : (
                                <SaveIcon sx={{ fontSize: '1.15rem' }} />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />

              {/* 2. Add Member */}
              <UserAutocomplete
                label="Add Member"
                size="small"
                fullWidth
                value={null}
                valueMode="object"
                forAssignee={false}
                useResponsibleLabel={false}
                placeholder="Select colleague to add..."
                disabled={actionLoading}
                filterLoadedOptions={(opts) => opts.filter((u) => !existingUserIds.has(u.id))}
                onChange={async (val) => {
                  if (val && typeof val === 'object' && val.id) {
                    await handleAddParticipant(val.id);
                  }
                }}
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
              />

              {/* 3. Members List */}
              <Paper
                variant="outlined"
                sx={{ p: 1.25, borderRadius: 2, bgcolor: 'background.paper', flex: 1 }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  MEMBERS ({normalizedParticipants.length})
                </Typography>
                <List dense disablePadding sx={{ mt: 0.5, maxHeight: 150, overflowY: 'auto' }}>
                  {normalizedParticipants.map((p) => {
                    const isSelf = p.id === currentUser?.id;
                    const isOnline = onlineUserIds.has(p.id);

                    return (
                      <ListItem
                        key={p.id}
                        disableGutters
                        secondaryAction={
                          !isSelf && (
                            <Tooltip title="Remove member">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleRemoveParticipant(p.id)}
                                disabled={actionLoading}
                                sx={{ color: 'error.main', p: 0.5 }}
                              >
                                <PersonRemoveOutlinedIcon sx={{ fontSize: '1.05rem' }} />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                        sx={{ py: 0.5 }}
                      >
                        <ListItemAvatar sx={{ minWidth: 34 }}>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            sx={{
                              '& .MuiBadge-badge': {
                                bgcolor: isOnline ? '#22c55e' : '#9ca3af',
                                width: 8,
                                height: 8,
                                minWidth: 8,
                                borderRadius: '50%',
                                border: '1.5px solid white',
                              },
                            }}
                          >
                            <Avatar
                              src={p.avatarUrl || undefined}
                              sx={{ width: 26, height: 26, fontSize: '0.75rem' }}
                            >
                              {p.name?.charAt(0)?.toUpperCase() || 'U'}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 600 }} noWrap>
                              {p.name} {isSelf && '(You)'}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }} noWrap>
                              {isOnline ? 'Online' : 'Offline'} • {p.role || 'User'}
                            </Typography>
                          }
                          sx={{ m: 0, pr: isSelf ? 0 : 4 }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>

              <Divider sx={{ my: 0.5 }} />

              {/* 4. Leave Group Button */}
              <Button
                variant="outlined"
                color="error"
                size="small"
                fullWidth
                disabled={actionLoading}
                onClick={() => currentUser && handleRemoveParticipant(currentUser.id)}
                startIcon={<LogoutIcon fontSize="small" />}
                sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.8rem' }}
              >
                Leave Group
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

              {/* Footer Input */}
              <ChatMessageInput
                onSendMessage={handleSendMessage}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </>
          )}
        </>
      )}
    </Paper>
  );
};
