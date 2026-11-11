import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Badge,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Chip,
  InputBase,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useChat, type ChatDirectoryUser } from '../../context/MessagingContext';
import { useLanguage } from '../../context/LanguageContext';

export interface ExistingGroupMember {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface ChatMemberSelectorProps {
  selectedUsers: ChatDirectoryUser[];
  onSelectedUsersChange: (users: ChatDirectoryUser[]) => void;
  existingMembers?: ExistingGroupMember[];
  onRemoveExistingMember?: (userId: string) => void;
  excludeUserIds?: Set<string>;
  placeholder?: string;
  listTitle?: string;
  label?: string;
}

export const ChatMemberSelector: React.FC<ChatMemberSelectorProps> = ({
  selectedUsers,
  onSelectedUsersChange,
  existingMembers,
  onRemoveExistingMember,
  excludeUserIds,
  placeholder,
  listTitle,
  label = 'To:',
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { allUsers, onlineUserIds } = useChat();

  const effectivePlaceholder = placeholder || t('messagingTypeUserPlaceholder');
  const effectiveListTitle = listTitle || t('messagingUsersListTitle');

  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input on mount so container has cursor and active state
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  // Selected user ID set for quick lookup
  const selectedUserIds = useMemo(
    () => new Set(selectedUsers.map((u) => u.id)),
    [selectedUsers]
  );

  // Existing user ID set for quick lookup
  const existingUserIds = useMemo(
    () => new Set(existingMembers?.map((m) => m.id) || []),
    [existingMembers]
  );

  // Filter available users: exclude current user, already selected users, existing group members, and excluded users
  const availableUsers = useMemo(() => {
    const list = allUsers.filter(
      (u) =>
        u.id !== currentUser?.id &&
        !selectedUserIds.has(u.id) &&
        !existingUserIds.has(u.id) &&
        (!excludeUserIds || !excludeUserIds.has(u.id))
    );

    // Sort online users first, then alphabetically by name
    const sorted = [...list].sort((a, b) => {
      const aOnline = onlineUserIds.has(a.id);
      const bOnline = onlineUserIds.has(b.id);
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      return a.name.localeCompare(b.name);
    });

    const q = search.trim().toLowerCase();
    if (!q) return sorted;

    return sorted.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.role && u.role.toLowerCase().includes(q))
    );
  }, [allUsers, currentUser?.id, selectedUserIds, existingUserIds, excludeUserIds, onlineUserIds, search]);

  const handleAddMember = (user: ChatDirectoryUser) => {
    if (!user || !user.id || user.id === currentUser?.id) return;
    if (selectedUserIds.has(user.id)) return;
    if (existingUserIds.has(user.id)) return;
    if (excludeUserIds && excludeUserIds.has(user.id)) return;
    onSelectedUsersChange([...selectedUsers, user]);
    setSearch('');
    searchInputRef.current?.focus();
  };

  const handleRemoveMember = (userId: string) => {
    onSelectedUsersChange(selectedUsers.filter((u) => u.id !== userId));
    searchInputRef.current?.focus();
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: '2px',
      }}
    >
      {/* Autocomplete Input Container with Chips */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 0.5,
          p: 0.75,
          borderRadius: 1.5,
          border: '1.5px solid',
          borderColor: 'primary.main',
          bgcolor: 'background.paper',
          maxHeight: 100,
          overflowY: 'auto',
          cursor: 'text',
          transition: 'box-shadow 0.15s ease-in-out',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 0 0 1px rgba(76, 175, 80, 0.2)'
              : 'none',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: (theme) => `0 0 0 1.5px ${theme.palette.primary.main}`,
          },
        }}
        onClick={() => searchInputRef.current?.focus()}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: '0.75rem',
            mr: 0.25,
            userSelect: 'none',
          }}
        >
          {label}
        </Typography>

        {/* Existing Group Members */}
        {existingMembers?.map((m) => (
          <Chip
            key={m.id}
            size="small"
            color="primary"
            variant="outlined"
            avatar={
              <Avatar
                src={m.avatarUrl || undefined}
                sx={{ width: 18, height: 18, fontSize: '0.65rem' }}
              >
                {m.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            }
            label={m.name}
            onDelete={onRemoveExistingMember ? () => onRemoveExistingMember(m.id) : undefined}
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 24,
              borderColor: 'primary.main',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.16)'
                  : 'rgba(46, 125, 50, 0.08)',
            }}
          />
        ))}

        {/* Newly Selected (Staged) Members */}
        {selectedUsers.map((u) => (
          <Chip
            key={u.id}
            size="small"
            color="primary"
            variant="outlined"
            avatar={
              <Avatar
                src={u.avatarUrl || undefined}
                sx={{ width: 18, height: 18, fontSize: '0.65rem' }}
              >
                {u.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            }
            label={u.name}
            onDelete={() => handleRemoveMember(u.id)}
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 24,
              borderColor: 'primary.main',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.16)'
                  : 'rgba(46, 125, 50, 0.08)',
            }}
          />
        ))}

        <InputBase
          inputRef={searchInputRef}
          placeholder={
            selectedUsers.length === 0 && (!existingMembers || existingMembers.length === 0)
              ? effectivePlaceholder
              : ''
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !search && selectedUsers.length > 0) {
              handleRemoveMember(selectedUsers[selectedUsers.length - 1].id);
            } else if (e.key === 'Enter' && availableUsers.length > 0) {
              e.preventDefault();
              handleAddMember(availableUsers[0]);
            }
          }}
          sx={{
            flex: 1,
            minWidth: 80,
            fontSize: '0.825rem',
            '& input': { p: 0.25 },
          }}
        />
      </Box>

      {/* User List below autocomplete */}
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 0,
          borderRadius: 2,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            pt: 1,
            pb: 0.5,
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: '0.04em',
          }}
        >
          {effectiveListTitle} ({availableUsers.length})
        </Typography>

        <List
          dense
          disablePadding
          sx={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {availableUsers.map((u) => {
            const isOnline = onlineUserIds.has(u.id);

            return (
              <ListItemButton
                key={u.id}
                onClick={() => handleAddMember(u)}
                sx={{ py: 0.75, px: 1.5 }}
              >
                <ListItemAvatar sx={{ minWidth: 36 }}>
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
                      sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
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
                      {isOnline ? t('tagOnline') : t('tagOffline')} • {u.role || 'User'}
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </ListItemButton>
            );
          })}

          {availableUsers.length === 0 && (
            <Box sx={{ py: 3, textAlign: 'center', px: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {search ? t('messagingNoMatchingUsers') : t('messagingAllUsersSelected')}
              </Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export const MessagingMemberSelector = ChatMemberSelector;
export type MessagingMemberSelectorProps = ChatMemberSelectorProps;

