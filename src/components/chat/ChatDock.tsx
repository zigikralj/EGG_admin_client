import React, { useState } from 'react';
import {
  Box,
  Button,
  Badge,
  Paper,
  Typography,
} from '@mui/material';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useChat } from '../../context/ChatContext';
import { ChatConversationList } from './ChatConversationList';
import { ChatWindow } from './ChatWindow';

export const ChatDock: React.FC = () => {
  const {
    activeWindows,
    totalUnreadCount,
    closeChat,
    toggleMinimize,
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);

  const handleToggleTray = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 0, // Flush against the right edge of the window
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'row-reverse', // Tray button on far right, open chat windows to its left
        alignItems: 'flex-end',
        gap: 0, // Flush docking with no gap between chat windows
        pointerEvents: 'none', // Let clicks through except on interactive children
      }}
    >
      {/* Main Drawer Container on the right */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          pointerEvents: 'auto',
          width: 280,
        }}
      >
        {/* Permanent Panel when Open (Does NOT close on outside click / blur) */}
        {isOpen && (
          <Paper
            elevation={12}
            sx={{
              width: 280,
              borderRadius: '8px 8px 0 0',
              borderTop: 2,
              borderLeft: 2,
              borderRight: 2,
              borderBottom: 0,
              borderColor: 'primary.main', // Theme reactive border
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 -4px 24px rgba(76, 175, 80, 0.25), 0 -2px 10px rgba(0,0,0,0.5)'
                  : '0 -4px 24px rgba(46, 125, 50, 0.2), 0 -2px 10px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <ChatConversationList onClose={() => setIsOpen(false)} />
          </Paper>
        )}

        {/* Main Tray Toggle Button (Flush with bottom & right, identical 280px width) */}
        <Button
          variant="contained"
          color="primary"
          disableRipple
          onClick={handleToggleTray}
          sx={{
            height: 44,
            width: 280,
            borderRadius: '4px',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            border: '1px solid #ffffff',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
            '&:active': {
              boxShadow: 'none',
            },
            '&:focus': {
              boxShadow: 'none',
            },
          }}
        >
          {/* Left: Chat Bubble Icon + Unread Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 28, overflow: 'visible' }}>
            <Badge badgeContent={totalUnreadCount} color="error" max={99}>
              <ChatBubbleOutlinedIcon fontSize="small" />
            </Badge>
          </Box>

          {/* Center: "Chat" stays in the middle */}
          <Typography
            sx={{
              flex: 1,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.02em',
            }}
          >
            Chat
          </Typography>

          {/* Right: Arrow Up when closed, Arrow Down when open */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 28 }}>
            {isOpen ? (
              <KeyboardArrowDownIcon fontSize="small" />
            ) : (
              <KeyboardArrowUpIcon fontSize="small" />
            )}
          </Box>
        </Button>
      </Box>

      {/* Active Floating Chat Windows (Docked to the left of the main tray) */}
      {activeWindows.map((win) => (
        <Box key={win.conversationId} sx={{ pointerEvents: 'auto' }}>
          <ChatWindow
            conversationId={win.conversationId}
            minimized={win.minimized}
            title={win.title}
            onClose={() => closeChat(win.conversationId)}
            onToggleMinimize={() => toggleMinimize(win.conversationId)}
          />
        </Box>
      ))}
    </Box>
  );
};
