import React, { useState, useMemo } from 'react';
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
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useQuery } from '@tanstack/react-query';
import { chatApi, type ChatConversationItem } from './chatApi';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
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
  updatedAt: string;
  unreadCount: number;
  muted?: boolean;
  mutedUntil?: string | null;
  lastMessageSnippet?: string;
  isOnline?: boolean;
  userSubtext?: string;
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

type ChatTabType = 'all' | 'projects' | 'people' | 'groups';

interface ChatConversationListProps {
  onClose?: () => void;
}

export const ChatConversationList: React.FC<ChatConversationListProps> = ({ onClose }) => {
  const { currentUser, role, actualRole, isRealAdmin, hasPermission } = useAuth();
  const {
    onlineUserIds,
    openChat,
    openDirectChatWithUser,
    markAsRead,
    markAsUnread,
    leaveConversation,
    deleteConversation,
    muteConversation,
    unmuteConversation,
    setDnd,
    isDndActive,
    allUsers,
  } = useChat();

  const [activeTab, setActiveTab] = useState<ChatTabType>('all');
  const [search, setSearch] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserDirectoryItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Mute Menu State
  const [muteMenuAnchor, setMuteMenuAnchor] = useState<null | { el: HTMLElement; convId: string; isMuted: boolean }>(null);

  // DND Menu State
  const [dndMenuAnchor, setDndMenuAnchor] = useState<null | HTMLElement>(null);

  // Delete & Leave Confirmation Dialogs
  const [deleteDialogConv, setDeleteDialogConv] = useState<UnifiedConversationItem | null>(null);
  const [leaveDialogConv, setLeaveDialogConv] = useState<UnifiedConversationItem | null>(null);

  const isManagerPlus =
    Boolean(currentUser?.isSystemAdmin) ||
    isRealAdmin ||
    role === 'Administrator' ||
    role === 'Manager' ||
    actualRole === 'Administrator' ||
    actualRole === 'Manager' ||
    hasPermission('projects', 'delete');

  // Fetch active conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery<ChatConversationItem[]>({
    queryKey: ['chat', 'conversations'],
    queryFn: () => chatApi.getConversations(),
    staleTime: TIME_MS.ONE_MINUTE,
    meta: { silent: true },
  });

  // Combine, sort, and filter conversations + colleagues list
  const filteredItems = useMemo(() => {
    const directPartnerUserIds = new Set<string>();

    // Merely opening a 1-1 chat with someone without sending anything should NOT mark it as recent
    // or remove them from the colleagues list.
    const activeConversations = conversations.filter(
      (c) => c.type !== 'DIRECT' || Boolean(c.lastMessage)
    );

    const conversationItems: UnifiedConversationItem[] = activeConversations.map((c) => {
      let title = c.title || 'Conversation';
      let avatarUrl: string | null | undefined = null;
      let isOnline = false;
      let userSubtext = '';

      const pIds: string[] =
        c.participantIds ||
        (c.participants || []).map((p: any) =>
          typeof p === 'string' ? p : p.id || p.userId || p.user?.id
        );

      if (c.type === 'DIRECT') {
        const otherUserId = pIds.find((id) => id !== currentUser?.id);
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
        updatedAt: c.updatedAt,
        unreadCount: c.unreadCount,
        muted: Boolean(c.muted),
        mutedUntil: c.mutedUntil,
        lastMessageSnippet,
        isOnline,
        userSubtext,
      };
    });

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

    const sortedConversations = [...conversationItems].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const sortedUsers = [...userItems].sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return a.title.localeCompare(b.title);
    });

    let items: UnifiedChatItem[] = [];

    switch (activeTab) {
      case 'projects':
        items = sortedConversations.filter((c) => c.type === 'CONTEXTUAL');
        break;
      case 'people':
        items = [...sortedConversations.filter((c) => c.type === 'DIRECT'), ...sortedUsers];
        break;
      case 'groups':
        items = sortedConversations.filter((c) => c.type === 'GROUP');
        break;
      case 'all':
      default:
        items = [...sortedConversations, ...sortedUsers];
        break;
    }

    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [conversations, allUsers, currentUser?.id, onlineUserIds, activeTab, search]);

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

  const handleConfirmDelete = async () => {
    if (!deleteDialogConv) return;
    try {
      setActionLoading(true);
      await deleteConversation(deleteDialogConv.id);
      setDeleteDialogConv(null);
    } catch (err) {
      console.error('Failed to delete conversation', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmLeave = async () => {
    if (!leaveDialogConv) return;
    try {
      setActionLoading(true);
      await leaveConversation(leaveDialogConv.id);
      setLeaveDialogConv(null);
    } catch (err) {
      console.error('Failed to leave conversation', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyMute = async (durationMinutes?: number, forever?: boolean) => {
    if (!muteMenuAnchor) return;
    const { convId } = muteMenuAnchor;
    setMuteMenuAnchor(null);
    try {
      await muteConversation(convId, durationMinutes, forever);
    } catch (err) {
      console.error('Failed to mute conversation', err);
    }
  };

  const handleApplyUnmute = async () => {
    if (!muteMenuAnchor) return;
    const { convId } = muteMenuAnchor;
    setMuteMenuAnchor(null);
    try {
      await unmuteConversation(convId);
    } catch (err) {
      console.error('Failed to unmute conversation', err);
    }
  };

  const handleApplyDnd = async (durationMinutes?: number, forever?: boolean, off?: boolean) => {
    setDndMenuAnchor(null);
    try {
      await setDnd(durationMinutes, forever, off);
    } catch (err) {
      console.error('Failed to update DND', err);
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
                <Tooltip title={isDndActive ? 'Do Not Disturb (Active)' : 'Do Not Disturb'}>
                  <Button
                    size="small"
                    variant={isDndActive ? 'contained' : 'outlined'}
                    color="warning"
                    onClick={(e) => setDndMenuAnchor(e.currentTarget)}
                    sx={{
                      fontSize: '0.675rem',
                      py: 0.2,
                      px: 0.75,
                      minWidth: 'auto',
                      lineHeight: 1.4,
                      textTransform: 'none',
                      borderRadius: 1.5,
                      fontWeight: 700,
                      ...(isDndActive && {
                        color: 'warning.contrastText',
                        bgcolor: 'warning.main',
                        '&:hover': {
                          bgcolor: 'warning.dark',
                        },
                      }),
                    }}
                    startIcon={<DoNotDisturbOnOutlinedIcon sx={{ fontSize: '13px !important' }} />}
                  >
                    DND
                  </Button>
                </Tooltip>

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
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.825rem',
                  height: 34,
                },
              }}
            />

            {/* Scrollable Filter Tabs */}
            <Tabs
              variant="scrollable"
              scrollButtons="auto"
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              sx={{
                minHeight: 30,
                borderTop: 1,
                borderColor: 'divider',
                '& .MuiTabs-indicator': {
                  height: 2.5,
                  borderRadius: 1,
                },
                '& .MuiTab-root': {
                  minHeight: 30,
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.25,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'none',
                },
              }}
            >
              <Tab label="All" value="all" />
              <Tab label="Projects" value="projects" />
              <Tab label="People" value="people" />
              <Tab label="Groups" value="groups" />
            </Tabs>
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
                  const isGroup = item.type === 'GROUP';

                  return (
                    <ListItemButton
                      key={`conv-${item.id}`}
                      onClick={() => openChat(item.id, { title: item.title })}
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
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
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
                              {item.muted && (
                                <Tooltip title="Muted" arrow>
                                  <NotificationsOffOutlinedIcon
                                    sx={{ fontSize: '0.9rem', color: 'text.disabled', flexShrink: 0 }}
                                  />
                                </Tooltip>
                              )}
                            </Box>

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
                              gap: 0.5,
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

                            {/* Hover Actions Menu */}
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
                              {/* Read / Unread toggle */}
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
                                    <MarkChatReadOutlinedIcon sx={{ fontSize: '0.95rem' }} />
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
                                    <MarkChatUnreadOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {/* Mute toggle button */}
                              <Tooltip title={item.muted ? 'Unmute chat' : 'Mute notifications'} arrow>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMuteMenuAnchor({
                                      el: e.currentTarget,
                                      convId: item.id,
                                      isMuted: Boolean(item.muted),
                                    });
                                  }}
                                  sx={{
                                    p: 0.25,
                                    color: item.muted ? 'warning.main' : 'text.secondary',
                                    '&:hover': { color: 'warning.dark' },
                                  }}
                                >
                                  {item.muted ? (
                                    <NotificationsOffOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                                  ) : (
                                    <NotificationsActiveOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                                  )}
                                </IconButton>
                              </Tooltip>

                              {/* Leave chat for group and project chats */}
                              {(isGroup || isProject) && (
                                <Tooltip title="Leave chat" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLeaveDialogConv(item);
                                    }}
                                    sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'warning.main' } }}
                                  >
                                    <ExitToAppIcon sx={{ fontSize: '0.95rem' }} />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {/* Delete / Clear chat for Manager+ */}
                              {isManagerPlus && (
                                <Tooltip title="Delete chat" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteDialogConv(item);
                                    }}
                                    sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                  >
                                    <DeleteOutlinedIcon sx={{ fontSize: '0.95rem' }} />
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

      {/* Mute Conversation Menu */}
      <Menu
        anchorEl={muteMenuAnchor?.el}
        open={Boolean(muteMenuAnchor)}
        onClose={() => setMuteMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: { borderRadius: 2, minWidth: 170 },
          },
        }}
      >
        <Typography variant="caption" sx={{ px: 2, py: 0.75, display: 'block', color: 'text.secondary', fontWeight: 700 }}>
          MUTE NOTIFICATIONS
        </Typography>
        {muteMenuAnchor?.isMuted && (
          <MenuItem onClick={handleApplyUnmute}>
            <ListItemIcon>
              <NotificationsActiveOutlinedIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Unmute" />
          </MenuItem>
        )}
        <MenuItem onClick={() => handleApplyMute(60)}>For 1 hour</MenuItem>
        <MenuItem onClick={() => handleApplyMute(480)}>For 8 hours</MenuItem>
        <MenuItem onClick={() => handleApplyMute(1440)}>For 24 hours</MenuItem>
        <MenuItem onClick={() => handleApplyMute(undefined, true)}>Until I turn it back on</MenuItem>
      </Menu>

      {/* Global DND Menu */}
      <Menu
        anchorEl={dndMenuAnchor}
        open={Boolean(dndMenuAnchor)}
        onClose={() => setDndMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: { borderRadius: 2, minWidth: 200 },
          },
        }}
      >
        <Typography variant="caption" sx={{ px: 2, py: 0.75, display: 'block', color: 'text.secondary', fontWeight: 700 }}>
          DO NOT DISTURB
        </Typography>
        {isDndActive && (
          <MenuItem onClick={() => handleApplyDnd(undefined, undefined, true)}>
            <ListItemIcon>
              <NotificationsActiveOutlinedIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Turn off DND" secondary="Resume notifications" />
          </MenuItem>
        )}
        <MenuItem onClick={() => handleApplyDnd(30)}>For 30 minutes</MenuItem>
        <MenuItem onClick={() => handleApplyDnd(60)}>For 1 hour</MenuItem>
        <MenuItem onClick={() => handleApplyDnd(240)}>For 4 hours</MenuItem>
        <MenuItem onClick={() => handleApplyDnd(1440)}>For 24 hours</MenuItem>
        <MenuItem onClick={() => handleApplyDnd(undefined, true)}>Until I turn it back on</MenuItem>
      </Menu>

      {/* Delete / Clear Chat Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteDialogConv)}
        onClose={() => !actionLoading && setDeleteDialogConv(null)}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Delete Chat
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontWeight: 500 }}>
            Are you sure you want to delete this entire chat? This action is not reversible.
          </DialogContentText>
          {deleteDialogConv && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Target: <strong>{deleteDialogConv.title}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogConv(null)}
            disabled={actionLoading}
            variant="outlined"
            size="small"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={actionLoading}
            variant="contained"
            color="error"
            size="small"
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlinedIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Chat Confirmation Dialog */}
      <Dialog
        open={Boolean(leaveDialogConv)}
        onClose={() => !actionLoading && setLeaveDialogConv(null)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Leave Chat
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>
            Are you sure you want to leave <strong>{leaveDialogConv?.title}</strong>? You will no longer receive updates or messages from this discussion unless tagged.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setLeaveDialogConv(null)}
            disabled={actionLoading}
            variant="outlined"
            size="small"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLeave}
            disabled={actionLoading}
            variant="contained"
            color="warning"
            size="small"
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <ExitToAppIcon />}
          >
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
