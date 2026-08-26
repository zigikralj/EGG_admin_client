import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';












import { useLanguage } from '../context/LanguageContext';
import { FormatBoldIcon, FormatItalicIcon, FormatUnderlinedIcon, StrikethroughSIcon, FormatListBulletedIcon, FormatListNumberedIcon, FormatQuoteIcon, TitleIcon, FormatClearIcon, UndoIcon, RedoIcon, ArrowDropDownIcon } from './icons';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number | string;
  readOnly?: boolean;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  minHeight = 160,
  readOnly = false,
  disabled = false,
}) => {
  const { t } = useLanguage();
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
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
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
          }}
        />
      </Box>
    </Paper>
  );
};
