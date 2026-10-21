import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.name });
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
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
      elevation={6}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        minWidth: 200,
        maxWidth: 320,
        maxHeight: 260,
        overflowY: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        zIndex: 9999,
      }}
    >
      <List dense disablePadding>
        {props.items.map((item, index) => (
          <ListItemButton
            key={item.id}
            selected={index === selectedIndex}
            onClick={() => selectItem(index)}
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
