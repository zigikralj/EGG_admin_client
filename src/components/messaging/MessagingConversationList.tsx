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
import GroupsIcon from '@mui/icons-material/Groups';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import MarkChatUnreadOutlinedIcon from '@mui/icons-material/MarkChatUnreadOutlined';
import MarkChatReadOutlinedIcon from '@mui/icons-material/MarkChatReadOutlined';
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useQuery } from '@tanstack/react-query';
import { chatApi, type ChatConversationItem } from './messagingApi';
import { useChat } from '../../context/MessagingContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { TIME_MS } from '../../constants';

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

export const ChatConversationList: React.FC<ChatConversationListProps> = () => {
  const { currentUser, role, actualRole, isRealAdmin, hasPermission } = useAuth();
  const { t } = useLanguage();
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
    allUsers,
  } = useChat();

  const [activeTab, setActiveTab] = useState<ChatTabType>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Mute Menu State
  const [muteMenuAnchor, setMuteMenuAnchor] = useState<null | { el: HTMLElement; convId: string; isMuted: boolean }>(null);

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
  const { data: conversations = [] } = useQuery<ChatConversationItem[]>({
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
        title = c.title ? `${c.title}` : t('messagingProjectDiscussion');
        userSubtext = t('messagingProjectDiscussion');
      } else {
        title = c.title || t('messagingGroupConversation');
        userSubtext = t('messagingMembersCount', { count: pIds.length });
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

  return (
    <Box sx={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Search and Tabs */}
      <Box sx={{ p: 1.25, pb: 0, bgcolor: 'background.paper' }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('messagingSearchPlaceholder')}
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
          <Tab label={t('messagingTabAll')} value="all" />
          <Tab label={t('messagingTabProjects')} value="projects" />
          <Tab label={t('messagingTabPeople')} value="people" />
          <Tab label={t('messagingTabGroups')} value="groups" />
        </Tabs>
      </Box>

      {/* Unified List content */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filteredItems.length === 0 ? (
          <Typography variant="caption" sx={{ display: 'block', p: 3, textAlign: 'center', color: 'text.secondary' }}>
            {t('messagingNoConversationsFound')}
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
                                <Tooltip title={t('messagingMuted')} arrow>
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
                                <Tooltip title={t('messagingMarkAsRead')} arrow>
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
                                <Tooltip title={t('messagingMarkAsUnread')} arrow>
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
                              <Tooltip title={item.muted ? t('messagingUnmuteConversation') : t('messagingMuteNotifications')} arrow>
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

                              {/* Leave conversation for group and project conversations */}
                              {(isGroup || isProject) && (
                                <Tooltip title={t('messagingLeaveConversation')} arrow>
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

                              {/* Delete / Clear conversation for Manager+ */}
                              {isManagerPlus && (
                                <Tooltip title={t('messagingDeleteConversation')} arrow>
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
        open={Boolean(deleteDialogConv)}
        onClose={() => !actionLoading && setDeleteDialogConv(null)}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          {t('messagingConfirmDeleteTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontWeight: 500 }}>
            {t('messagingConfirmDeleteText')}
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
        open={Boolean(leaveDialogConv)}
        onClose={() => !actionLoading && setLeaveDialogConv(null)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('messagingConfirmLeaveTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>
            {t('messagingConfirmLeaveText', { title: leaveDialogConv?.title || '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setLeaveDialogConv(null)}
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
    </Box>
  );
};

export const MessagingConversationList = ChatConversationList;
export type MessagingConversationListProps = ChatConversationListProps;
export type UnifiedMessagingItem = UnifiedChatItem;

