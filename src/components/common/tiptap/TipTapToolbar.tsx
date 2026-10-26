import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  FormatBoldIcon,
  FormatItalicIcon,
  StrikethroughSIcon,
  FormatListBulletedIcon,
  FormatListNumberedIcon,
  FormatQuoteIcon,
  LinkIcon,
  LinkOffIcon,
  TableChartIcon,
  FormatClearIcon,
  UndoIcon,
  RedoIcon,
  HistoryIcon,
  AlternateEmailIcon,
} from '../../icons';
import { useLanguage } from '../../../context/LanguageContext';

export interface TipTapToolbarProps {
  editor: Editor | null;
  onOpenHistory?: () => void;
  readOnly?: boolean;
}

export const TipTapToolbar: React.FC<TipTapToolbarProps> = ({
  editor,
  onOpenHistory,
  readOnly = false,
}) => {
  const { t } = useLanguage();

  if (!editor || readOnly) {
    return onOpenHistory ? (
      <Box sx={{ p: 0.5, display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tooltip title={t('noteHistoryAndDiff') || 'Note History & Diff'}>
          <IconButton size="small" onClick={onOpenHistory} color="primary">
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ) : null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 0.5,
        p: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      {/* History & Diff Button */}
      {onOpenHistory && (
        <>
          <Tooltip title={t('noteHistoryAndDiff') || 'Note History & Diff'}>
            <IconButton size="small" onClick={onOpenHistory} color="primary">
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        </>
      )}

      {/* Undo / Redo */}
      <Tooltip title={t('undo') || 'Undo'}>
        <span>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('redo') || 'Redo'}>
        <span>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Text Style: Bold, Italic, Strike */}
      <ToggleButtonGroup size="small">
        <Tooltip title={t('bold') || 'Bold'}>
          <ToggleButton
            value="bold"
            selected={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <FormatBoldIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('italic') || 'Italic'}>
          <ToggleButton
            value="italic"
            selected={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <FormatItalicIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('strikethrough') || 'Strikethrough'}>
          <ToggleButton
            value="strike"
            selected={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <StrikethroughSIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Headings */}
      <ToggleButtonGroup size="small">
        <Tooltip title="Heading 1">
          <ToggleButton
            value="h1"
            selected={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            sx={{ px: 1, fontWeight: 700, fontSize: '0.75rem' }}
          >
            H1
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Heading 2">
          <ToggleButton
            value="h2"
            selected={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            sx={{ px: 1, fontWeight: 700, fontSize: '0.75rem' }}
          >
            H2
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Heading 3">
          <ToggleButton
            value="h3"
            selected={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            sx={{ px: 1, fontWeight: 700, fontSize: '0.75rem' }}
          >
            H3
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Lists & Quote */}
      <ToggleButtonGroup size="small">
        <Tooltip title={t('bulletList') || 'Bullet List'}>
          <ToggleButton
            value="bulletList"
            selected={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <FormatListBulletedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('orderedList') || 'Numbered List'}>
          <ToggleButton
            value="orderedList"
            selected={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <FormatListNumberedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('quote') || 'Quote'}>
          <ToggleButton
            value="blockquote"
            selected={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <FormatQuoteIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Link */}
      <Tooltip title={t('link') || 'Link'}>
        <IconButton size="small" onClick={setLink} color={editor.isActive('link') ? 'primary' : 'default'}>
          <LinkIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {editor.isActive('link') && (
        <Tooltip title={t('removeLink') || 'Remove Link'}>
          <IconButton size="small" onClick={() => editor.chain().focus().unsetLink().run()}>
            <LinkOffIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Table */}
      <Tooltip title={t('insertTable') || 'Insert Table'}>
        <IconButton size="small" onClick={insertTable}>
          <TableChartIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Mention User */}
      <Tooltip title={t('editorMentionUser') || 'Mention user (@)'}>
        <IconButton
          size="small"
          onClick={() => {
            if (!editor) return;
            const { from } = editor.state.selection;
            const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1), from);
            const needsSpace = from > 0 && Boolean(textBefore) && !/\s/.test(textBefore);
            editor.chain().focus().insertContent(needsSpace ? ' @' : '@').run();
          }}
          color="default"
        >
          <AlternateEmailIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Clear Formatting */}
      <Tooltip title={t('clearFormatting') || 'Clear Formatting'}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          <FormatClearIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
