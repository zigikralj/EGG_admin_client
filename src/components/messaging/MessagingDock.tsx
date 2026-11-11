import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  Box,
  Badge,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/MessagingContext';
import { useLanguage } from '../../context/LanguageContext';
import { MessagingConversationList } from './MessagingConversationList';
import { MessagingWindow } from './MessagingWindow';
import { NewMessagingWindow } from './NewMessagingWindow';

export const MessagingDock: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const {
    activeWindows,
    totalUnreadCount,
    isDndActive,
    setDnd,
    closeChat,
    toggleMinimize,
    isNewMessageOpen,
    isNewMessageMinimized,
    openNewMessage,
    closeNewMessage,
    toggleMinimizeNewMessage,
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [optionsMenuAnchor, setOptionsMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuView, setMenuView] = useState<'root' | 'dnd'>('root');

  const leftGroupRef = useRef<HTMLDivElement>(null);
  const rightGroupRef = useRef<HTMLDivElement>(null);
  const [collapsedWidth, setCollapsedWidth] = useState<number>(280);

  useLayoutEffect(() => {
    const measure = () => {
      if (leftGroupRef.current && rightGroupRef.current) {
        const leftW = Math.max(leftGroupRef.current.scrollWidth, leftGroupRef.current.getBoundingClientRect().width);
        const rightW = Math.max(rightGroupRef.current.scrollWidth, rightGroupRef.current.getBoundingClientRect().width);
        // px: 1.5 is 24px total padding; gap: 1.5 is 12px; border: 2px
        const total = Math.ceil(leftW + rightW + 24 + 12 + 2);
        if (total > 0) {
          setCollapsedWidth(total);
        }
      }
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      if (leftGroupRef.current) ro.observe(leftGroupRef.current);
      if (rightGroupRef.current) ro.observe(rightGroupRef.current);
      return () => ro.disconnect();
    }
  }, [totalUnreadCount, isDndActive, t, currentUser?.name, currentUser?.avatarUrl]);

  const handleApplyDnd = async (durationMinutes?: number, forever?: boolean, off?: boolean) => {
    setOptionsMenuAnchor(null);
    setMenuView('root');
    try {
      await setDnd(durationMinutes, forever, off);
    } catch (err) {
      console.error('Failed to update DND', err);
    }
  };

  const handleCloseMenu = () => {
    setOptionsMenuAnchor(null);
    setMenuView('root');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'row-reverse',
        alignItems: 'flex-end',
        gap: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Main Drawer Container on the right */}
      <Paper
        elevation={8}
        sx={{
          width: isOpen ? 320 : collapsedWidth,
          minWidth: isOpen ? 320 : collapsedWidth,
          height: isOpen ? 600 : 48,
          maxHeight: '82vh',
          borderRadius: '10px 10px 0 0',
          border: 1,
          borderBottom: 0,
          borderColor: 'divider',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 -4px 20px rgba(0, 0, 0, 0.5)'
              : '0 -4px 20px rgba(0, 0, 0, 0.1)',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'auto',
        }}
      >
        {/* Header Bar (Transitions upwards as the drawer opens) */}
        <Box
          onClick={() => setIsOpen((prev) => !prev)}
          sx={{
            height: 48,
            minHeight: 48,
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            cursor: 'pointer',
            userSelect: 'none',
            borderBottom: isOpen ? 1 : 0,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {/* Left: User Avatar + Online status + "Messaging" title + unread badge */}
          <Box
            ref={leftGroupRef}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              flexShrink: 0,
              minWidth: 'max-content',
            }}
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: isDndActive ? '#f59e0b' : '#22c55e',
                  width: 9,
                  height: 9,
                  minWidth: 9,
                  borderRadius: '50%',
                  border: '1.5px solid white',
                },
              }}
            >
              <Avatar
                src={currentUser?.avatarUrl || undefined}
                sx={{ width: 28, height: 28, fontSize: '0.8rem', fontWeight: 600 }}
              >
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </Badge>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, minWidth: 'max-content' }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'text.primary',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {t('messagingTitle')}
              </Typography>

              {/* Unread badge or DND indicator */}
              {isDndActive ? (
                <Tooltip title={t('messagingDndActive')} arrow>
                  <DoNotDisturbOnOutlinedIcon sx={{ fontSize: '1.05rem', color: 'warning.main' }} />
                </Tooltip>
              ) : totalUnreadCount > 0 ? (
                <Badge
                  badgeContent={totalUnreadCount}
                  color="error"
                  max={99}
                  sx={{
                    '& .MuiBadge-badge': {
                      position: 'static',
                      transform: 'none',
                      height: 18,
                      minWidth: 18,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      px: 0.5,
                    },
                  }}
                />
              ) : null}
            </Box>
          </Box>

          {/* Right: Three dots (DND), Create new message, Expand/collapse */}
          <Box
            ref={rightGroupRef}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, minWidth: 'max-content' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Three dots - Options Menu */}
            <IconButton
              size="small"
              onClick={(e) => {
                setOptionsMenuAnchor(e.currentTarget);
                setMenuView('root');
              }}
              sx={{
                p: 0.5,
                color: isDndActive ? 'warning.main' : 'text.secondary',
                '&:hover': { color: 'text.primary' },
              }}
            >
              <MoreHorizIcon fontSize="small" />
            </IconButton>

            {/* Create New Message */}
            <Tooltip title={t('messagingNewMessage')} arrow>
              <IconButton
                size="small"
                onClick={() => openNewMessage()}
                sx={{
                  p: 0.5,
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                <DriveFileRenameOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Expand / Collapse toggle */}
            <IconButton
              size="small"
              onClick={() => setIsOpen((prev) => !prev)}
              sx={{
                p: 0.5,
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' },
              }}
            >
              {isOpen ? (
                <KeyboardArrowDownIcon fontSize="small" />
              ) : (
                <KeyboardArrowUpIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Box>

        {/* Conversation List Body (renders inside the expanding paper) */}
        {isOpen && <MessagingConversationList onClose={() => setIsOpen(false)} />}
      </Paper>

      {/* Floating New Message Window (Docked to the left of main tray) */}
      {isNewMessageOpen && (
        <Box sx={{ pointerEvents: 'auto' }}>
          <NewMessagingWindow
            minimized={isNewMessageMinimized}
            onClose={closeNewMessage}
            onToggleMinimize={toggleMinimizeNewMessage}
          />
        </Box>
      )}

      {/* Active Floating Chat Windows (Docked to the left of the new message / tray) */}
      {activeWindows.map((win) => (
        <Box key={win.conversationId} sx={{ pointerEvents: 'auto' }}>
          <MessagingWindow
            conversationId={win.conversationId}
            minimized={win.minimized}
            title={win.title}
            onClose={() => closeChat(win.conversationId)}
            onToggleMinimize={() => toggleMinimize(win.conversationId)}
          />
        </Box>
      ))}

      {/* Options Menu with nested DND view */}
      <Menu
        anchorEl={optionsMenuAnchor}
        open={Boolean(optionsMenuAnchor)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            sx: { borderRadius: 2, minWidth: 220 },
          },
        }}
      >
        {menuView === 'root' ? (
          <>
            <Typography
              variant="caption"
              sx={{ px: 2, py: 0.75, display: 'block', color: 'text.secondary', fontWeight: 700 }}
            >
              {t('messagingOptions')}
            </Typography>
            <MenuItem
              onClick={() => setMenuView('dnd')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <DoNotDisturbOnOutlinedIcon
                    fontSize="small"
                    sx={{ color: isDndActive ? 'warning.main' : 'text.secondary' }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={t('messagingDnd')}
                  secondary={isDndActive ? t('messagingDndActive') : undefined}
                  slotProps={{
                    primary: { sx: { fontSize: '0.875rem', fontWeight: 500 } },
                    secondary: { sx: { fontSize: '0.725rem', color: 'warning.main', fontWeight: 600 } },
                  }}
                />
              </Box>
              <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </MenuItem>
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
                onClick={() => setMenuView('root')}
                sx={{ p: 0.5, mr: 0.5, color: 'text.secondary' }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {t('messagingDnd')}
              </Typography>
            </Box>
            {isDndActive && (
              <MenuItem onClick={() => handleApplyDnd(undefined, undefined, true)}>
                <ListItemIcon>
                  <NotificationsActiveOutlinedIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary={t('messagingTurnOffDnd')} secondary={t('messagingResumeNotifications')} />
              </MenuItem>
            )}
            <MenuItem onClick={() => handleApplyDnd(30)}>{t('messagingFor30Min')}</MenuItem>
            <MenuItem onClick={() => handleApplyDnd(60)}>{t('messagingFor1Hour')}</MenuItem>
            <MenuItem onClick={() => handleApplyDnd(240)}>{t('messagingFor4Hours')}</MenuItem>
            <MenuItem onClick={() => handleApplyDnd(1440)}>{t('messagingFor24Hours')}</MenuItem>
            <MenuItem onClick={() => handleApplyDnd(undefined, true)}>{t('messagingUntilTurnOn')}</MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export const ChatDock = MessagingDock;

