import React from 'react';
import {
  Menu,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Badge,
} from '@mui/material';
import type { AppNotification } from '../../types';
import type { TranslationKeys } from '../../i18n/translations';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  NotificationsIcon,
  NotificationsNoneIcon,
  DoneAllIcon,
  ClearAllIcon,
  DeleteIcon,
  FolderIcon,
} from '../icons';

interface NotificationsMenuProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenProject?: (projectId: string) => void;
}

function formatRelativeTime(dateString: string, t: (k: keyof TranslationKeys, params?: Record<string, string | number>) => string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return t('notificationJustNow');
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ${t('notificationTimeAgo')}`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ${t('notificationTimeAgo')}`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 7) return `${diffDays}d ${t('notificationTimeAgo')}`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

export const NotificationsMenu: React.FC<NotificationsMenuProps> = ({
  anchorEl,
  isOpen,
  onClose,
  onOpenProject,
}) => {
  const { t } = useLanguage();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    onClose();
    if (notif.projectId && onOpenProject) {
      onOpenProject(notif.projectId);
    }
  };

  return (
    <Menu
      id="notifications-menu"
      anchorEl={anchorEl}
      open={isOpen}
      onClose={onClose}
      slotProps={{
        paper: {
          elevation: 6,
          sx: {
            width: { xs: 320, sm: 380 },
            maxHeight: 480,
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.18))',
            mt: 1.5,
            p: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* HEADER */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('notificationsTitle')}
          </Typography>
          {unreadCount > 0 && (
            <Badge
              badgeContent={unreadCount}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  position: 'static',
                  transform: 'none',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 18,
                  minWidth: 18,
                },
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {unreadCount > 0 && (
            <Tooltip title={t('notificationsMarkAllRead')} arrow>
              <IconButton size="small" onClick={() => markAllAsRead()} color="primary">
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {notifications.length > 0 && (
            <Tooltip title={t('notificationsClearAll')} arrow>
              <IconButton size="small" onClick={() => clearAllNotifications()} color="default">
                <ClearAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* NOTIFICATIONS LIST */}
      <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 380 }}>
        {notifications.length === 0 ? (
          <Box
            sx={{
              py: 5,
              px: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <NotificationsNoneIcon sx={{ fontSize: 44, opacity: 0.4, mb: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
              {t('noNotifications')}
            </Typography>
            <Typography variant="caption" sx={{ maxWidth: 240, opacity: 0.8 }}>
              {t('noNotificationsDesc')}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notif, index) => {
              const isUnread = !notif.read;
              const initials = notif.authorName
                ? notif.authorName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2)
                : 'U';

              return (
                <React.Fragment key={notif.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItemButton
                    onClick={() => handleNotificationClick(notif)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      alignItems: 'flex-start',
                      bgcolor: isUnread
                        ? (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(25, 118, 210, 0.12)'
                              : 'rgba(25, 118, 210, 0.05)'
                        : 'transparent',
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                        '& .delete-btn': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 44, mt: 0.25 }}>
                      <Badge
                        color="primary"
                        variant="dot"
                        invisible={!isUnread}
                        overlap="circular"
                        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                      >
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            bgcolor: isUnread ? 'primary.main' : 'action.selected',
                            color: isUnread ? 'primary.contrastText' : 'text.primary',
                          }}
                        >
                          {initials}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: isUnread ? 700 : 500,
                              fontSize: '0.8125rem',
                              lineHeight: 1.3,
                              color: isUnread ? 'text.primary' : 'text.secondary',
                            }}
                          >
                            {notif.authorName || t('roleUser')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                            {formatRelativeTime(notif.createdAt, t)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.78rem',
                              lineHeight: 1.4,
                              color: isUnread ? 'text.primary' : 'text.secondary',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {notif.message}
                          </Typography>

                          {notif.project && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
                              <FolderIcon sx={{ fontSize: '0.85rem', color: 'primary.main' }} />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  color: 'primary.main',
                                  fontSize: '0.72rem',
                                }}
                              >
                                {notif.project.name}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />

                    <IconButton
                      className="delete-btn"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      sx={{
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        p: 0.5,
                        ml: 0.5,
                        mt: -0.5,
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main' },
                      }}
                    >
                      <DeleteIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </ListItemButton>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Menu>
  );
};
