import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Paper, List, ListItemButton, ListItemText, ListItemAvatar, Avatar, Typography } from '@mui/material';

export interface MentionSuggestionItem {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface MentionSuggestionListProps {
  items: MentionSuggestionItem[];
  command: (item: { id: string; label: string }) => void;
}

export const MentionSuggestionList = forwardRef((props: MentionSuggestionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  useEffect(() => {
    setSelectedIndex(0);
    selectedIndexRef.current = 0;
  }, [props.items]);

  const selectItem = (index: number) => {
    const item = props.items[index] || props.items[0];
    if (item) {
      props.command({ id: item.id, label: item.name });
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        const next = (selectedIndexRef.current + props.items.length - 1) % props.items.length;
        setSelectedIndex(next);
        selectedIndexRef.current = next;
        return true;
      }
      if (event.key === 'ArrowDown') {
        const next = (selectedIndexRef.current + 1) % props.items.length;
        setSelectedIndex(next);
        selectedIndexRef.current = next;
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        selectItem(selectedIndexRef.current);
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={8}
      onMouseDown={(e) => {
        // Prevent stealing focus from editor so click events fire and editor selection remains active
        e.preventDefault();
      }}
      sx={{
        borderRadius: '4px',
        minWidth: 240,
        maxWidth: 320,
        maxHeight: 260,
        overflowY: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 8px 24px rgba(0, 0, 0, 0.45)'
            : '0 8px 24px rgba(0, 0, 0, 0.12)',
        scrollbarWidth: 'thin',
        scrollbarColor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.25) transparent'
            : 'rgba(0, 0, 0, 0.25) transparent',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.25)'
              : 'rgba(0, 0, 0, 0.25)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.4)'
                : 'rgba(0, 0, 0, 0.4)',
          },
        },
      }}
    >
      <List dense disablePadding>
        {props.items.map((item, index) => (
          <ListItemButton
            key={item.id}
            selected={index === selectedIndex}
            onClick={(e) => {
              e.preventDefault();
              selectItem(index);
            }}
            sx={{
              py: 0.75,
              px: 1.5,
              '&.Mui-selected': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <ListItemAvatar sx={{ minWidth: 32, mr: 1 }}>
              <Avatar
                src={item.avatarUrl || undefined}
                sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}
              >
                {item.name ? item.name.charAt(0).toUpperCase() : '?'}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.name}
                </Typography>
              }
              secondary={
                item.role ? (
                  <Typography variant="caption" color="text.secondary">
                    {item.role}
                  </Typography>
                ) : null
              }
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
});

MentionSuggestionList.displayName = 'MentionSuggestionList';
