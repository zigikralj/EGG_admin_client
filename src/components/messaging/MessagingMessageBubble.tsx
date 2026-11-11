import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Avatar,
  Paper,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReplyIcon from '@mui/icons-material/Reply';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useChat } from '../../context/MessagingContext';
import type { ChatMessageItem } from './messagingApi';

interface ChatMessageBubbleProps {
  message: ChatMessageItem;
  isCurrentUser: boolean;
  canModerate: boolean;
  onReply: (message: ChatMessageItem) => void;
  onEdit: (messageId: string, newContent: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = React.memo(({
  message,
  isCurrentUser,
  canModerate,
  onReply,
  onEdit,
  onDelete,
}) => {
  const { allUsers } = useChat();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false);
      return;
    }
    await onEdit(message.id, editContent.trim());
    setIsEditing(false);
  };

  // Memoize @mention regex pattern so we only compute it when candidate names change
  const mentionPattern = useMemo(() => {
    if (!message.content?.includes('@')) return null;

    const namesSet = new Set<string>();
    allUsers.forEach((u) => {
      if (u.name?.trim()) {
        const raw = u.name.trim();
        namesSet.add(raw);
        const stripped = raw
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'dj')
          .replace(/Đ/g, 'Dj');
        if (stripped) namesSet.add(stripped);
      }
    });

    if (message.sender?.name?.trim()) {
      namesSet.add(message.sender.name.trim());
    }
    if (message.replyTo?.sender?.name?.trim()) {
      namesSet.add(message.replyTo.sender.name.trim());
    }

    const candidateNames = Array.from(namesSet).sort((a, b) => b.length - a.length);
    if (candidateNames.length > 0) {
      const namesPattern = candidateNames.map(escapeRegex).join('|');
      return new RegExp(`(@(?:${namesPattern}|[\\p{L}\\p{N}_-]+))`, 'gu');
    }
    return /(@[\p{L}\p{N}_-]+)/gu;
  }, [allUsers, message.content, message.sender?.name, message.replyTo?.sender?.name]);

  const isSystemAnnouncement =
    message.content.startsWith('renamed the group to') ||
    (message.content.startsWith('added ') && message.content.includes('to the group')) ||
    (message.content.startsWith('removed ') && message.content.includes('from the group')) ||
    message.content === 'left the group';

  if (isSystemAnnouncement) {
    const actorName = isCurrentUser ? 'You' : message.sender?.name || 'Someone';
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1, width: '100%' }}>
        <Typography
          variant="caption"
          sx={{
            bgcolor: 'action.hover',
            color: 'text.secondary',
            px: 1.5,
            py: 0.35,
            borderRadius: 4,
            fontSize: '0.72rem',
            fontStyle: 'italic',
            textAlign: 'center',
            maxWidth: '90%',
            border: 1,
            borderColor: 'divider',
          }}
        >
          {actorName} {message.content}
        </Typography>
      </Box>
    );
  }

  const renderFormattedContent = (text: string) => {
    if (!mentionPattern) return text;
    const parts = text.split(mentionPattern);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <Typography
            key={i}
            component="span"
            variant="body2"
            sx={{ fontWeight: 700, color: isCurrentUser ? 'inherit' : 'primary.main' }}
          >
            {part}
          </Typography>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const timeString = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isCurrentUser ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          maxWidth: '85%',
          gap: 1,
        }}
      >
        {!isCurrentUser && (
          <Avatar
            src={message.sender?.avatarUrl || undefined}
            sx={{ width: 28, height: 28, fontSize: '0.75rem', mb: 0.5 }}
          >
            {message.sender?.name?.charAt(0) || 'U'}
          </Avatar>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {!isCurrentUser && (
            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.5, mb: 0.25, fontWeight: 600 }}>
              {message.sender?.name}
            </Typography>
          )}

          {/* Quoted Message in Reply */}
          {message.replyTo && (
            <Paper
              elevation={0}
              sx={{
                p: 0.75,
                mb: 0.5,
                bgcolor: 'action.hover',
                borderLeft: 3,
                borderColor: isCurrentUser ? 'primary.light' : 'primary.main',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                {message.replyTo.sender?.name || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }} noWrap>
                {message.replyTo.isDeleted ? 'This message was deleted' : message.replyTo.content}
              </Typography>
            </Paper>
          )}

          {/* Bubble Container */}
          <Box
            sx={{
              position: 'relative',
              p: 1.25,
              borderRadius: 2.5,
              bgcolor: message.isDeleted
                ? 'action.hover'
                : isCurrentUser
                ? 'primary.main'
                : 'background.paper',
              color: message.isDeleted
                ? 'text.secondary'
                : isCurrentUser
                ? 'primary.contrastText'
                : 'text.primary',
              boxShadow: 1,
              '&:hover .message-actions': {
                opacity: 1,
              },
            }}
          >
            {message.isDeleted ? (
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                This message was deleted
              </Typography>
            ) : isEditing ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <TextField
                  size="small"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  autoFocus
                  multiline
                  sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                />
                <IconButton size="small" onClick={handleSaveEdit} color="inherit">
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => setIsEditing(false)} color="inherit">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {renderFormattedContent(message.content)}
              </Typography>
            )}

            {/* Timestamp and Edit status */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 0.5,
                mt: 0.5,
              }}
            >
              {message.isEdited && !message.isDeleted && (
                <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                  (edited)
                </Typography>
              )}
              <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                {timeString}
              </Typography>
            </Box>

            {/* Quick Action Button */}
            {!message.isDeleted && (
              <IconButton
                size="small"
                className="message-actions"
                onClick={handleOpenMenu}
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: isCurrentUser ? 'auto' : -28,
                  left: isCurrentUser ? -28 : 'auto',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  p: 0.25,
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
        <MenuItem
          onClick={() => {
            onReply(message);
            handleCloseMenu();
          }}
          dense
        >
          <ReplyIcon fontSize="small" sx={{ mr: 1 }} /> Reply
        </MenuItem>

        {isCurrentUser && !message.isDeleted && (
          <MenuItem
            onClick={() => {
              setIsEditing(true);
              setEditContent(message.content);
              handleCloseMenu();
            }}
            dense
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
          </MenuItem>
        )}

        {(isCurrentUser || canModerate) && !message.isDeleted && (
          <MenuItem
            onClick={async () => {
              await onDelete(message.id);
              handleCloseMenu();
            }}
            dense
            sx={{ color: 'error.main' }}
          >
            <DeleteOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
});

ChatMessageBubble.displayName = 'ChatMessageBubble';

export const MessagingMessageBubble = ChatMessageBubble;
export type MessagingMessageBubbleProps = ChatMessageBubbleProps;

