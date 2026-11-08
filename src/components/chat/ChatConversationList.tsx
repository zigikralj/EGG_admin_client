import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Badge,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Paper,
  ListItem,
  Divider,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import GroupsIcon from '@mui/icons-material/Groups';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import MarkChatUnreadOutlinedIcon from '@mui/icons-material/MarkChatUnreadOutlined';
import MarkChatReadOutlinedIcon from '@mui/icons-material/MarkChatReadOutlined';
import { useQuery } from '@tanstack/react-query';
import { chatApi, type ChatConversationItem } from './chatApi';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useUsersDirectoryQuery } from '../../queries/users.queries';
import { UserAutocomplete } from '../common/autocomplete';
import { TIME_MS } from '../../constants';

interface UserDirectoryItem {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface UnifiedConversationItem {
  kind: 'conversation';
  id: string;
  title: string;
  avatarUrl?: string | null;
  type: 'DIRECT' | 'GROUP' | 'CONTEXTUAL';
  contextType?: string | null;
  contextId?: string | null;
  updatedAt: string;
  unreadCount: number;
  lastMessageSnippet?: string;
  isOnline?: boolean;
  userSubtext?: string;
  otherUserId?: string;
}

export interface UnifiedUserItem {
  kind: 'user';
  id: string;
  title: string;
  avatarUrl?: string | null;
  role?: string;
  isOnline: boolean;
}

export type UnifiedChatItem = UnifiedConversationItem | UnifiedUserItem;

interface ChatConversationListProps {
  onClose?: () => void;
}

export const ChatConversationList: React.FC<ChatConversationListProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { onlineUserIds, openChat, openDirectChatWithUser, markAsRead, markAsUnread } = useChat();
  const [search, setSearch] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserDirectoryItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch active conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery<ChatConversationItem[]>({
    queryKey: ['chat', 'conversations'],
    queryFn: () => chatApi.getConversations(),
    staleTime: TIME_MS.ONE_MINUTE,
    meta: { silent: true },
  });

  // Fetch all users for directory
  const { data: allUsers = [] } = useUsersDirectoryQuery();

  // 1. Process conversations into unified list items
  // Merely opening a 1-1 chat with someone without sending anything should NOT mark it as recent
  // or remove them from the colleagues list.
  const directPartnerUserIds = new Set<string>();

  const activeConversations = conversations.filter(
    (c) => c.type !== 'DIRECT' || Boolean(c.lastMessage)
  );

  const conversationItems: UnifiedConversationItem[] = activeConversations.map((c) => {
    let title = c.title || 'Conversation';
    let avatarUrl: string | null | undefined = null;
    let isOnline = false;
    let userSubtext = '';
    let otherUserId: string | undefined;

    const pIds: string[] =
      c.participantIds ||
      (c.participants || []).map((p: any) =>
        typeof p === 'string' ? p : p.id || p.userId || p.user?.id
      );

    if (c.type === 'DIRECT') {
      otherUserId = pIds.find((id) => id !== currentUser?.id);
      const otherUser = allUsers.find((u) => u.id === otherUserId);
      if (otherUser) {
        title = otherUser.name;
        avatarUrl = otherUser.avatarUrl;
        directPartnerUserIds.add(otherUser.id);
        isOnline = onlineUserIds.has(otherUser.id);
        userSubtext = `${isOnline ? 'Online' : 'Offline'} • ${otherUser.role || 'User'}`;
      } else if (otherUserId) {
        title = 'User';
        directPartnerUserIds.add(otherUserId);
        isOnline = onlineUserIds.has(otherUserId);
        userSubtext = `${isOnline ? 'Online' : 'Offline'}`;
      }
    } else if (c.type === 'CONTEXTUAL') {
      title = c.title ? `${c.title}` : 'Project Chat';
      userSubtext = 'Project Discussion';
    } else {
      title = c.title || 'Group Chat';
      userSubtext = `${pIds.length} members`;
    }

    const lastSenderName =
      c.lastMessage?.sender?.name ||
      (c.lastMessage?.sender?.id
        ? allUsers.find((u) => u.id === c.lastMessage?.sender?.id)?.name
        : undefined);

    const lastMessageSnippet = c.lastMessage
      ? `${lastSenderName || 'User'}: ${c.lastMessage.content}`
      : undefined;

    return {
      kind: 'conversation',
      id: c.id,
      title,
      avatarUrl,
      type: c.type,
      contextType: c.contextType,
      contextId: c.contextId,
      updatedAt: c.updatedAt,
      unreadCount: c.unreadCount,
      lastMessageSnippet,
      isOnline,
      userSubtext,
      otherUserId,
    };
  });

  // 2. Add users who don't have an existing direct conversation
  const userItems: UnifiedUserItem[] = allUsers
    .filter((u) => u.id !== currentUser?.id && !directPartnerUserIds.has(u.id))
    .map((u) => ({
      kind: 'user',
      id: u.id,
      title: u.name,
      avatarUrl: u.avatarUrl,
      role: u.role,
      isOnline: onlineUserIds.has(u.id),
    }));

  // 3. Combine & Sort:
  // Active conversations sorted by most recent first (updatedAt desc)
  // Followed by available users (Online first, then alphabetical)
  const sortedConversations = [...conversationItems].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const sortedUsers = [...userItems].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return a.title.localeCompare(b.title);
  });

  const allCombinedItems = [...sortedConversations, ...sortedUsers];

  const filteredItems = allCombinedItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddMember = (user: any) => {
    if (!user || !user.id) return;
    if (user.id === currentUser?.id) return;
    if (selectedUsers.some((u) => u.id === user.id)) return;
    setSelectedUsers((prev) => [
      ...prev,
      {
        id: user.id,
        name: user.name || 'User',
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    ]);
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim() || selectedUsers.length === 0) return;
    try {
      setActionLoading(true);
      const conv = await chatApi.createConversation({
        type: 'GROUP',
        title: groupTitle.trim(),
        participantIds: selectedUsers.map((u) => u.id),
      });
      setShowCreateGroup(false);
      setGroupTitle('');
      setSelectedUsers([]);
      await refetchConversations();
      openChat(conv.id, { title: conv.title || 'Group Chat' });
    } catch (err) {
      console.error('Failed to create group chat', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: 600, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Title, Close, New Group & Search */}
      <Box sx={{ p: 1.25, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        {showCreateGroup ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
              onClick={() => {
                setShowCreateGroup(false);
                setGroupTitle('');
                setSelectedUsers([]);
              }}
            >
              <IconButton size="small" sx={{ color: 'inherit', p: 0.25 }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Create Group Chat
              </Typography>
            </Box>
            {onClose && (
              <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Messaging
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowCreateGroup(true)}
                  sx={{
                    fontSize: '0.675rem',
                    py: 0.2,
                    px: 0.75,
                    minWidth: 'auto',
                    lineHeight: 1.4,
                    textTransform: 'none',
                    borderRadius: 1.5,
                  }}
                  startIcon={<GroupAddIcon sx={{ fontSize: '13px !important' }} />}
                >
                  Group
                </Button>
                {onClose && (
                  <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>

            <TextField
              fullWidth
              size="small"
              placeholder="Search people & chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.825rem',
                  height: 34,
                },
              }}
            />
          </>
        )}
      </Box>

      {showCreateGroup ? (
        /* Create Group View (matching Group Details layout) */
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
            required
            label="Group Name"
            size="small"
            fullWidth
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && groupTitle.trim() && selectedUsers.length > 0) {
                e.preventDefault();
                handleCreateGroup();
              }
            }}
            placeholder="Enter group name"
            disabled={actionLoading}
            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
            slotProps={{
              input: {
                sx: { fontSize: '0.875rem', fontWeight: 600 },
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
            filterLoadedOptions={(opts) =>
              opts.filter(
                (u) => u.id !== currentUser?.id && !selectedUsers.some((sel) => sel.id === u.id)
              )
            }
            onChange={(val) => {
              if (val && typeof val === 'object' && val.id) {
                handleAddMember(val);
              }
            }}
            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
          />

          {/* 3. Members List */}
          <Paper
            variant="outlined"
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: 'background.paper',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 180,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              MEMBERS ({selectedUsers.length + (currentUser ? 1 : 0)})
            </Typography>
            <List dense disablePadding sx={{ mt: 0.5, flex: 1, maxHeight: 260, overflowY: 'auto' }}>
              {/* Current user (You) */}
              {currentUser && (
                <ListItem disableGutters sx={{ py: 0.5 }}>
                  <ListItemAvatar sx={{ minWidth: 34 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      sx={{
                        '& .MuiBadge-badge': {
                          bgcolor: '#22c55e',
                          width: 8,
                          height: 8,
                          minWidth: 8,
                          borderRadius: '50%',
                          border: '1.5px solid white',
                        },
                      }}
                    >
                      <Avatar
                        src={currentUser.avatarUrl || undefined}
                        sx={{ width: 26, height: 26, fontSize: '0.75rem' }}
                      >
                        {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 600 }} noWrap>
                        {currentUser.name} (You)
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }} noWrap>
                        Online • {currentUser.role || 'User'}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </ListItem>
              )}

              {/* Selected Members */}
              {selectedUsers.map((u) => {
                const isOnline = onlineUserIds.has(u.id);

                return (
                  <ListItem
                    key={u.id}
                    disableGutters
                    secondaryAction={
                      <Tooltip title="Remove member">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveMember(u.id)}
                          disabled={actionLoading}
                          sx={{ color: 'error.main', p: 0.5 }}
                        >
                          <PersonRemoveOutlinedIcon sx={{ fontSize: '1.05rem' }} />
                        </IconButton>
                      </Tooltip>
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
                          src={u.avatarUrl || undefined}
                          sx={{ width: 26, height: 26, fontSize: '0.75rem' }}
                        >
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 600 }} noWrap>
                          {u.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }} noWrap>
                          {isOnline ? 'Online' : 'Offline'} • {u.role || 'User'}
                        </Typography>
                      }
                      sx={{ m: 0, pr: 4 }}
                    />
                  </ListItem>
                );
              })}

              {selectedUsers.length === 0 && (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'block' }}
                  >
                    Select colleagues using the search above to add them to this group.
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>

          <Divider sx={{ my: 0.5 }} />

          {/* 4. Create Group Button */}
          <Button
            variant="contained"
            color="primary"
            size="small"
            fullWidth
            disabled={actionLoading || !groupTitle.trim() || selectedUsers.length === 0}
            onClick={handleCreateGroup}
            startIcon={
              actionLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <GroupAddIcon fontSize="small" />
              )
            }
            sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.8rem' }}
          >
            Create Group
          </Button>
        </Box>
      ) : (
        /* Unified List content */
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filteredItems.length === 0 ? (
          <Typography variant="caption" sx={{ display: 'block', p: 3, textAlign: 'center', color: 'text.secondary' }}>
            No chats or colleagues found
          </Typography>
        ) : (
          <List dense disablePadding>
            {filteredItems.map((item) => {
              if (item.kind === 'conversation') {
                const isProject = item.type === 'CONTEXTUAL';
                const isDirect = item.type === 'DIRECT';

                return (
                  <ListItemButton
                    key={`conv-${item.id}`}
                    onClick={() =>
                      openChat(item.id, {
                        title: item.title,
                        contextType: item.contextType,
                        contextId: item.contextId,
                      })
                    }
                    sx={{ py: 1, px: 1.5 }}
                  >
                    <ListItemAvatar sx={{ minWidth: 42 }}>
                      {isDirect ? (
                        <Badge
                          variant="dot"
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          sx={{
                            '& .MuiBadge-badge': {
                              bgcolor: item.isOnline ? 'success.main' : 'text.disabled',
                              boxShadow: item.isOnline ? '0 0 0 2px white' : 'none',
                            },
                          }}
                        >
                          <Avatar src={item.avatarUrl || undefined} sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                            {item.title.charAt(0)}
                          </Avatar>
                        </Badge>
                      ) : (
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: '0.8rem',
                            bgcolor: isProject ? 'secondary.main' : 'info.main',
                          }}
                        >
                          {isProject ? <FolderSpecialIcon fontSize="small" /> : <GroupsIcon fontSize="small" />}
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      disableTypography
                      sx={{ my: 0, minWidth: 0 }}
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: item.unreadCount > 0 ? 700 : 500,
                              minWidth: 0,
                              color: 'text.primary',
                            }}
                            noWrap
                          >
                            {item.title}
                          </Typography>
                          {item.unreadCount > 0 && (
                            <Badge
                              badgeContent={item.unreadCount}
                              color="error"
                              sx={{
                                flexShrink: 0,
                                '& .MuiBadge-badge': {
                                  position: 'static',
                                  transform: 'none',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  height: 18,
                                  minWidth: 18,
                                  px: 0.5,
                                },
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                            mt: 0.25,
                            minHeight: 20,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{
                              display: 'block',
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {item.lastMessageSnippet || item.userSubtext}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              flexShrink: 0,
                              opacity: item.unreadCount > 0 ? 1 : 0,
                              transition: 'opacity 0.15s ease',
                              '.MuiListItemButton-root:hover &': {
                                opacity: 1,
                              },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.unreadCount > 0 ? (
                              <Tooltip title="Mark as read" arrow>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(item.id);
                                  }}
                                  sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                                >
                                  <MarkChatReadOutlinedIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Mark as unread" arrow>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsUnread(item.id);
                                  }}
                                  sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                                >
                                  <MarkChatUnreadOutlinedIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                );
              }

              // Direct User (no prior conversation yet)
              return (
                <ListItemButton
                  key={`user-${item.id}`}
                  onClick={() => openDirectChatWithUser(item.id, item.title)}
                  sx={{ py: 1, px: 1.5 }}
                >
                  <ListItemAvatar sx={{ minWidth: 42 }}>
                    <Badge
                      variant="dot"
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      sx={{
                        '& .MuiBadge-badge': {
                          bgcolor: item.isOnline ? 'success.main' : 'text.disabled',
                          boxShadow: item.isOnline ? '0 0 0 2px white' : 'none',
                        },
                      }}
                    >
                      <Avatar src={item.avatarUrl || undefined} sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                        {item.title.charAt(0)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {item.isOnline ? 'Online' : 'Offline'} • {item.role || 'User'}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
      )}
    </Box>
  );
};
