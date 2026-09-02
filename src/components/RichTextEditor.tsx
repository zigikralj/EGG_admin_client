import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Typography,
  Popper,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Fade,
} from '@mui/material';

import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';
import {
  FormatBoldIcon,
  FormatItalicIcon,
  FormatUnderlinedIcon,
  StrikethroughSIcon,
  FormatListBulletedIcon,
  FormatListNumberedIcon,
  FormatQuoteIcon,
  TitleIcon,
  FormatClearIcon,
  UndoIcon,
  RedoIcon,
  ArrowDropDownIcon,
  AlternateEmailIcon,
} from './icons';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number | string;
  readOnly?: boolean;
  disabled?: boolean;
  users?: User[];
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  minHeight = 160,
  readOnly = false,
  disabled = false,
  users: propUsers,
}) => {
  const { t } = useLanguage();
  const auth = useAuth();
  const availableUsers = propUsers || auth.users || [];

  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);

  // Formatting active states
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  const [headingAnchorEl, setHeadingAnchorEl] = useState<null | HTMLElement>(null);
  const [isEmpty, setIsEmpty] = useState(!value || value === '<p><br></p>' || value === '<br>');

  // Mention State
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionAnchorEl, setMentionAnchorEl] = useState<HTMLElement | null>(null);
  const mentionRangeRef = useRef<Range | null>(null);

  const filteredUsers = useMemo(() => {
    const q = mentionQuery.toLowerCase().trim();
    return availableUsers.filter((u) => {
      if (u.status === 'BLOCKED') return false;
      if (!q) return true;
      const nameMatch = u.name.toLowerCase().includes(q);
      const emailMatch = u.email ? u.email.toLowerCase().includes(q) : false;
      const roleMatch = u.role ? u.role.toLowerCase().includes(q) : false;
      return nameMatch || emailMatch || roleMatch;
    }).slice(0, 8);
  }, [availableUsers, mentionQuery]);

  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current || readOnly || disabled) return;
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {
      // ignore
    }
  }, [readOnly, disabled]);

  // Check for @ mentions in current caret position
  const checkForMention = useCallback(() => {
    if (readOnly || disabled || !editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setMentionOpen(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (!editorRef.current.contains(node)) {
      setMentionOpen(false);
      return;
    }

    // Only process text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const caretPos = range.startOffset;
      const textBeforeCaret = text.slice(0, caretPos);
      const lastAtIndex = textBeforeCaret.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const query = textBeforeCaret.slice(lastAtIndex + 1);
        // Ensure no whitespace in query and that @ is either at start or after whitespace/boundary
        const charBeforeAt = lastAtIndex > 0 ? textBeforeCaret[lastAtIndex - 1] : ' ';
        if (!/\s/.test(query) && (/\s/.test(charBeforeAt) || lastAtIndex === 0)) {
          // Save range for replacement
          const mentionRange = document.createRange();
          mentionRange.setStart(node, lastAtIndex);
          mentionRange.setEnd(node, caretPos);
          mentionRangeRef.current = mentionRange;

          setMentionQuery(query);
          setMentionIndex(0);
          setMentionAnchorEl(editorRef.current);
          setMentionOpen(true);
          return;
        }
      }
    }

    setMentionOpen(false);
  }, [readOnly, disabled]);

  // Insert Mention
  const insertMention = useCallback((user: User) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    let range = mentionRangeRef.current;

    if (!range && selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    }

    if (range) {
      range.deleteContents();

      // Create mention span
      const mentionSpan = document.createElement('span');
      mentionSpan.className = 'mention-tag';
      mentionSpan.setAttribute('data-user-id', user.id);
      mentionSpan.setAttribute('data-user-name', user.name);
      mentionSpan.setAttribute('contenteditable', 'false');
      mentionSpan.textContent = `@${user.name}`;

      // Style mention span
      mentionSpan.style.backgroundColor = 'rgba(25, 118, 210, 0.12)';
      mentionSpan.style.color = '#1976d2';
      mentionSpan.style.padding = '2px 6px';
      mentionSpan.style.borderRadius = '4px';
      mentionSpan.style.fontWeight = '600';
      mentionSpan.style.display = 'inline-flex';
      mentionSpan.style.alignItems = 'center';
      mentionSpan.style.margin = '0 2px';
      mentionSpan.style.userSelect = 'all';

      const spaceNode = document.createTextNode('\u00A0'); // Non-breaking space

      range.insertNode(spaceNode);
      range.insertNode(mentionSpan);

      // Move cursor after space
      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.setEndAfter(spaceNode);

      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }

    setMentionOpen(false);
    mentionRangeRef.current = null;

    // Trigger input change
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const textContent = editorRef.current.textContent || '';
      const empty = !textContent.trim() && !editorRef.current.querySelector('img, hr, iframe, ul, ol');
      setIsEmpty(empty);
      isInternalChangeRef.current = true;
      onChange(empty ? '' : html);
    }
  }, [onChange]);

  // Sync external value changes to editor DOM
  useEffect(() => {
    if (editorRef.current) {
      if (isInternalChangeRef.current) {
        isInternalChangeRef.current = false;
        return;
      }
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml !== value) {
        editorRef.current.innerHTML = value || '';
        const textContent = editorRef.current.textContent || '';
        setIsEmpty(!textContent.trim() && !editorRef.current.querySelector('img, hr, iframe'));
      }
    }
  }, [value]);

  // Listen for selection changes inside editor
  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === editorRef.current) {
        updateActiveFormats();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateActiveFormats]);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const textContent = editorRef.current.textContent || '';
    const empty = !textContent.trim() && !editorRef.current.querySelector('img, hr, iframe, ul, ol');
    setIsEmpty(empty);

    isInternalChangeRef.current = true;
    onChange(empty ? '' : html);
    updateActiveFormats();
    checkForMention();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (mentionOpen && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }
  };

  const exec = (command: string, val: string | null = null) => {
    if (readOnly || disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val ?? undefined);
    handleInput();
    updateActiveFormats();
  };

  const handleHeadingSelect = (tag: string) => {
    setHeadingAnchorEl(null);
    if (tag === 'p') {
      exec('formatBlock', '<p>');
    } else {
      exec('formatBlock', `<${tag}>`);
    }
  };

  const handleMentionButtonClick = () => {
    if (readOnly || disabled || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertText', false, '@');
    handleInput();
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 1.5,
        overflow: 'hidden',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'border-color 0.2s ease',
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
        },
      }}
    >
      {/* TOOLBAR */}
      {!readOnly && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.5,
            p: 0.75,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
          }}
        >
          {/* TEXT FORMATTING */}
          <Tooltip title={t('editorBold')} arrow>
            <IconButton
              size="small"
              color={activeFormats.bold ? 'primary' : 'default'}
              onClick={() => exec('bold')}
              disabled={disabled}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.bold ? 'action.selected' : 'transparent',
              }}
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editorItalic')} arrow>
            <IconButton
              size="small"
              color={activeFormats.italic ? 'primary' : 'default'}
              onClick={() => exec('italic')}
              disabled={disabled}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.italic ? 'action.selected' : 'transparent',
              }}
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editorUnderline')} arrow>
            <IconButton
              size="small"
              color={activeFormats.underline ? 'primary' : 'default'}
              onClick={() => exec('underline')}
              disabled={disabled}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.underline ? 'action.selected' : 'transparent',
              }}
            >
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editorStrikethrough')} arrow>
            <IconButton
              size="small"
              color={activeFormats.strikeThrough ? 'primary' : 'default'}
              onClick={() => exec('strikeThrough')}
              disabled={disabled}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.strikeThrough ? 'action.selected' : 'transparent',
              }}
            >
              <StrikethroughSIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          {/* LISTS */}
          <Tooltip title={t('editorBulletList')} arrow>
            <IconButton
              size="small"
              color={activeFormats.insertUnorderedList ? 'primary' : 'default'}
              onClick={() => exec('insertUnorderedList')}
              disabled={disabled}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.insertUnorderedList ? 'action.selected' : 'transparent',
              }}
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editorNumberedList')} arrow>
            <IconButton
              size="small"
              color={activeFormats.insertOrderedList ? 'primary' : 'default'}
              onClick={() => exec('insertOrderedList')}
              disabled={disabled}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.insertOrderedList ? 'action.selected' : 'transparent',
              }}
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          {/* MENTION USER BUTTON */}
          <Tooltip title={t('editorMentionUser')} arrow>
            <IconButton
              size="small"
              color="primary"
              onClick={handleMentionButtonClick}
              disabled={disabled}
              sx={{
                borderRadius: 1,
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.18)',
                },
              }}
            >
              <AlternateEmailIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          {/* HEADINGS / BLOCK FORMATS */}
          <Tooltip title={t('editorHeading')} arrow>
            <IconButton
              size="small"
              onClick={(e) => setHeadingAnchorEl(e.currentTarget)}
              disabled={disabled}
              sx={{ borderRadius: 1, display: 'flex', alignItems: 'center', px: 0.75 }}
            >
              <TitleIcon fontSize="small" />
              <ArrowDropDownIcon sx={{ fontSize: '1rem', ml: -0.25 }} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={headingAnchorEl}
            open={Boolean(headingAnchorEl)}
            onClose={() => setHeadingAnchorEl(null)}
            slotProps={{ paper: { sx: { minWidth: 150 } } }}
          >
            <MenuItem onClick={() => handleHeadingSelect('h3')}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t('editorHeading')} 1
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => handleHeadingSelect('h4')}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {t('editorHeading')} 2
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => handleHeadingSelect('p')}>
              <Typography variant="body2">{t('editorParagraph')}</Typography>
            </MenuItem>
          </Menu>

          <Tooltip title={t('editorQuote')} arrow>
            <IconButton
              size="small"
              onClick={() => exec('formatBlock', '<blockquote>')}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <FormatQuoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editorClearFormat')} arrow>
            <IconButton
              size="small"
              onClick={() => {
                exec('removeFormat');
                exec('formatBlock', '<p>');
              }}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <FormatClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          {/* UNDO / REDO */}
          <Tooltip title={t('editorUndo')} arrow>
            <IconButton
              size="small"
              onClick={() => exec('undo')}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editorRedo')} arrow>
            <IconButton
              size="small"
              onClick={() => exec('redo')}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* EDITABLE CONTENT CONTAINER */}
      <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isEmpty && placeholder && !readOnly && (
          <Typography
            variant="body2"
            sx={{
              position: 'absolute',
              top: 12,
              left: 14,
              color: 'text.secondary',
              opacity: 0.65,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {placeholder}
          </Typography>
        )}

        <Box
          ref={editorRef}
          contentEditable={!readOnly && !disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onKeyUp={(e) => {
            updateActiveFormats();
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== 'Escape') {
              checkForMention();
            }
          }}
          onMouseUp={() => {
            updateActiveFormats();
            checkForMention();
          }}
          sx={{
            p: 1.5,
            minHeight,
            maxHeight: 400,
            overflowY: 'auto',
            outline: 'none',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'text.primary',
            '& p': {
              m: 0,
              mb: 0.75,
              '&:last-child': { mb: 0 },
            },
            '& h3': {
              m: 0,
              mb: 1,
              mt: 1,
              fontSize: '1.15rem',
              fontWeight: 700,
            },
            '& h4': {
              m: 0,
              mb: 0.75,
              mt: 0.75,
              fontSize: '1rem',
              fontWeight: 600,
            },
            '& ul, & ol': {
              m: 0,
              my: 0.75,
              pl: 2.75,
            },
            '& li': {
              mb: 0.35,
              '&:last-child': { mb: 0 },
            },
            '& blockquote': {
              m: 0,
              my: 1,
              pl: 1.5,
              py: 0.5,
              borderLeft: '3px solid',
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
              borderRadius: '0 4px 4px 0',
              fontStyle: 'italic',
            },
            '& .mention-tag': {
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.18)' : 'rgba(25, 118, 210, 0.12)',
              color: (theme) => (theme.palette.mode === 'dark' ? '#90caf9' : 'primary.main'),
              border: '1px solid',
              borderColor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.35)' : 'rgba(25, 118, 210, 0.25)',
              borderRadius: '4px',
              px: 0.75,
              py: 0.15,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              margin: '0 2px',
              userSelect: 'all',
              lineHeight: 1.3,
            },
          }}
        />
      </Box>

      {/* MENTION AUTOCOMPLETE POPPER */}
      <Popper
        open={mentionOpen && filteredUsers.length > 0}
        anchorEl={mentionAnchorEl}
        placement="bottom-start"
        transition
        style={{ zIndex: 1400 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={150}>
            <Paper
              elevation={6}
              sx={{
                mt: 0.5,
                maxHeight: 280,
                width: 260,
                overflowY: 'auto',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 8px 24px rgba(0,0,0,0.5)'
                    : '0 8px 24px rgba(0,0,0,0.12)',
              }}
            >
              <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {t('editorMentionSearchPlaceholder')} ({filteredUsers.length})
                </Typography>
              </Box>
              <List dense sx={{ p: 0.5 }}>
                {filteredUsers.map((user, idx) => {
                  const isSelected = idx === mentionIndex;
                  const initials = user.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)
                    : 'U';

                  return (
                    <ListItemButton
                      key={user.id}
                      selected={isSelected}
                      onClick={() => insertMention(user)}
                      sx={{
                        borderRadius: 1.5,
                        my: 0.25,
                        py: 0.75,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                          '& .MuiTypography-root': {
                            color: 'inherit',
                          },
                          '& .MuiChip-root': {
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                          },
                        },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar
                          src={user.avatarUrl || undefined}
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'primary.main',
                          }}
                        >
                          {initials}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                            {user.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                            <Chip
                              label={user.role}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                px: 0.2,
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Paper>
          </Fade>
        )}
      </Popper>
    </Paper>
  );
};

