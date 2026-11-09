import React, { useState, useRef, useMemo } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ReplyIcon from '@mui/icons-material/Reply';
import { useChat, type ChatDirectoryUser } from '../../context/ChatContext';
import type { ChatMessageItem } from './chatApi';

interface ChatMessageInputProps {
  onSendMessage: (content: string, replyToId?: string | null, mentionedUserIds?: string[]) => Promise<void>;
  replyingTo: ChatMessageItem | null;
  onCancelReply: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  onSendMessage,
  replyingTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const { allUsers } = useChat();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionedIds, setMentionedIds] = useState<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);

  const filteredUsers = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return allUsers.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 5);
  }, [mentionQuery, allUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n') {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        if (!query.includes(' ')) {
          setMentionQuery(query);
          setSelectedMentionIndex(0);
          return;
        }
      }
    }
    setMentionQuery(null);
  };

  const handleSelectMention = (user: ChatDirectoryUser) => {
    if (!inputRef.current) return;
    const cursorPos = inputRef.current.selectionStart || content.length;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const prefix = textBeforeCursor.slice(0, lastAtIndex);
      const newContent = `${prefix}@${user.name} ${textAfterCursor}`;
      setContent(newContent);
      setMentionedIds((prev) => new Set(prev).add(user.id));
      setMentionQuery(null);

      setTimeout(() => {
        if (inputRef.current) {
          const nextPos = prefix.length + user.name.length + 2;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(nextPos, nextPos);
        }
      }, 0);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectMention(filteredUsers[selectedMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const text = content.trim();
    if (!text || isSending || disabled) return;

    try {
      setIsSending(true);
      await onSendMessage(text, replyingTo?.id, Array.from(mentionedIds));
      setContent('');
      setMentionedIds(new Set());
      setMentionQuery(null);
      onCancelReply();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Mention Popup */}
      {mentionQuery !== null && filteredUsers.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            mb: 1,
            maxHeight: 220,
            overflowY: 'auto',
            zIndex: 9999,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <List dense disablePadding>
            {filteredUsers.map((u, idx) => (
              <ListItemButton
                key={u.id}
                selected={idx === selectedMentionIndex}
                onClick={() => handleSelectMention(u)}
                sx={{ py: 0.5 }}
              >
                <ListItemAvatar sx={{ minWidth: 32 }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }} src={u.avatarUrl || undefined}>
                    {u.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {u.name}
                    </Typography>
                  }
                  secondary={u.role || undefined}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {/* Quoted Reply Banner */}
      {replyingTo && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.5,
            py: 0.5,
            bgcolor: 'action.hover',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            borderLeft: 3,
            borderColor: 'primary.main',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
            <ReplyIcon fontSize="small" color="primary" />
            <Typography variant="caption" noWrap sx={{ maxWidth: 220 }}>
              Replying to <strong>{replyingTo.sender?.name || 'User'}</strong>:{' '}
              {replyingTo.isDeleted ? 'Deleted message' : replyingTo.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Input Field with Send Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'background.paper' }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          multiline
          maxRows={3}
          placeholder={placeholder}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              fontSize: '0.875rem',
            },
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSubmit}
          disabled={!content.trim() || isSending || disabled}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}
          size="small"
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};
