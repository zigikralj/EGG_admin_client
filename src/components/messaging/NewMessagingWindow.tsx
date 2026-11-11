import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Button,
  Divider,
  InputBase,
  Avatar,
  Badge,
  AvatarGroup,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { useQueryClient } from '@tanstack/react-query';
import { chatApi } from './messagingApi';
import { useChat, type ChatDirectoryUser } from '../../context/MessagingContext';
import { useLanguage } from '../../context/LanguageContext';
import { MessagingMemberSelector } from './MessagingMemberSelector';

interface NewChatWindowProps {
  minimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
}

export const NewChatWindow: React.FC<NewChatWindowProps> = ({
  minimized,
  onClose,
  onToggleMinimize,
}) => {
  const { openDirectChatWithUser, openChat, onlineUserIds } = useChat();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [selectedUsers, setSelectedUsers] = useState<ChatDirectoryUser[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isMultiple = selectedUsers.length >= 2;

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) return;

    if (selectedUsers.length === 1) {
      // Direct 1-on-1 message
      try {
        setActionLoading(true);
        const target = selectedUsers[0];
        await openDirectChatWithUser(target.id, target.name);
        onClose();
      } catch (err) {
        console.error('Failed to open direct chat', err);
      } finally {
        setActionLoading(false);
      }
      return;
    }

    // Group chat (2+ members)
    if (!groupTitle.trim()) return;
    try {
      setActionLoading(true);
      const conv = await chatApi.createConversation({
        type: 'GROUP',
        title: groupTitle.trim(),
        participantIds: selectedUsers.map((u) => u.id),
      });
      await queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      openChat(conv.id, { title: conv.title || t('messagingGroupConversation') });
      onClose();
    } catch (err) {
      console.error('Failed to create group conversation', err);
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
          gap: 1,
        }}
        onClick={onToggleMinimize}
      >
        {/* Left: Avatar(s) + Title */}
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
          {selectedUsers.length >= 2 ? (
            <AvatarGroup
              max={3}
              spacing="small"
              sx={{
                flexShrink: 0,
                '& .MuiAvatar-root': {
                  width: 22,
                  height: 22,
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  border: '1px solid white',
                  color: '#ffffff',
                },
                '& .MuiAvatarGroup-avatar': {
                  width: 22,
                  height: 22,
                  fontSize: '0.625rem',
                },
              }}
            >
              {selectedUsers.map((u) => (
                <Avatar key={u.id} src={u.avatarUrl || undefined} alt={u.name}>
                  {u.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              ))}
            </AvatarGroup>
          ) : selectedUsers.length === 1 ? (
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={{
                flexShrink: 0,
                '& .MuiBadge-badge': {
                  bgcolor: onlineUserIds.has(selectedUsers[0].id) ? '#22c55e' : 'rgba(255, 255, 255, 0.5)',
                  width: 8,
                  height: 8,
                  minWidth: 8,
                  borderRadius: '50%',
                  border: '1.5px solid white',
                },
              }}
            >
              <Avatar
                src={selectedUsers[0].avatarUrl || undefined}
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
                {selectedUsers[0].name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </Badge>
          ) : (
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
              <DriveFileRenameOutlineIcon sx={{ fontSize: 14 }} />
            </Avatar>
          )}

          {isMultiple && !minimized ? (
            <InputBase
              placeholder={t('messagingEnterGroupName')}
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && groupTitle.trim()) {
                  e.preventDefault();
                  handleSubmit();
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
          ) : (
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.85rem' }}
              noWrap
            >
              {selectedUsers.length === 1
                ? selectedUsers[0].name
                : isMultiple && groupTitle.trim()
                ? groupTitle.trim()
                : t('messagingNewMessage')}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }} onClick={(e) => e.stopPropagation()}>
          {!minimized && (
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
          {/* Reusable Member Selector (Autocomplete with Chips + Colleague List) */}
          <MessagingMemberSelector
            selectedUsers={selectedUsers}
            onSelectedUsersChange={setSelectedUsers}
          />

          <Divider sx={{ my: 0.25 }} />

          {/* Action Button: Start Chat (1 user) or Create Group (2+ users) */}
          <Button
            variant="contained"
            color="primary"
            size="small"
            fullWidth
            disabled={
              actionLoading ||
              selectedUsers.length === 0 ||
              (isMultiple && !groupTitle.trim())
            }
            onClick={handleSubmit}
            startIcon={
              actionLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : isMultiple ? (
                <GroupAddIcon fontSize="small" />
              ) : (
                <ChatBubbleOutlinedIcon fontSize="small" />
              )
            }
            sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.8rem', py: 0.75 }}
          >
            {isMultiple
              ? !groupTitle.trim()
                ? t('messagingEnterGroupName')
                : t('messagingCreateGroup')
              : selectedUsers.length === 1
              ? t('messagingStartConversation')
              : t('messagingSelectUser')}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export const NewMessagingWindow = NewChatWindow;
