import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { TipTapToolbar } from './TipTapToolbar';
import { createMentionExtension } from './mentionExtension';
import { useLanguage } from '../../../context/LanguageContext';
import type { User } from '../../../types';

import { cleanWordHtml } from '../RichTextEditor';

import { fetchMentionUsers } from '../../../queries';

export interface TipTapEditorProps {
  value: string;
  onChange?: (html: string) => void;
  onAutoSave?: (html: string) => Promise<void>;
  autoSaveEnabled?: boolean;
  autoSaveDebounceMs?: number;
  readOnly?: boolean;
  placeholder?: string;
  users?: User[];
  onOpenHistory?: () => void;
  minHeight?: number | string;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  value,
  onChange,
  onAutoSave,
  autoSaveEnabled = true,
  autoSaveDebounceMs = 3500,
  readOnly = false,
  placeholder,
  users: propUsers,
  onOpenHistory,
  minHeight = 220,
}) => {
  const { t } = useLanguage();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedValRef = useRef(value || '');

  const propUsersRef = useRef(propUsers);
  propUsersRef.current = propUsers;

  const mentionExt = useMemo(() => {
    return createMentionExtension(async (query: string, signal?: AbortSignal) => {
      // 1. If explicit users were passed via prop, filter from them in memory
      if (propUsersRef.current && propUsersRef.current.length > 0) {
        const q = (query || '').toLowerCase().trim();
        return propUsersRef.current
          .filter((u) => u.status !== 'BLOCKED' && (!q || (u.name && u.name.toLowerCase().includes(q))))
          .slice(0, 10)
          .map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role,
            avatarUrl: u.avatarUrl,
          }));
      }

      // 2. Otherwise, fetch lightweight paginated users from server (limit: 10, fields: mention, debounced)
      return await fetchMentionUsers(query, 10, signal);
    });
  }, []);

  const editor = useEditor({
    editable: !readOnly,
    content: value || '',
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({
        placeholder: placeholder || t('typeNotesHere') || 'Type notes here... (type @ to mention someone)',
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      mentionExt,
    ],
    editorProps: {
      transformPastedHTML(html) {
        // Strip MS Word/Outlook conditional comments, XML, style blocks and invisible non-breaking spaces via robust parser
        const cleaned = cleanWordHtml(html);
        return cleaned
          .replace(/&(?:nbsp|#160|#xa0);/gi, ' ')
          .replace(/[\u00a0\u200B\uFEFF]/g, ' ');
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);

      if (autoSaveEnabled && onAutoSave && html !== lastSavedValRef.current) {
        setSaveStatus('unsaved');
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(async () => {
          try {
            setSaveStatus('saving');
            await onAutoSave(html);
            lastSavedValRef.current = html;
            setSaveStatus('saved');
          } catch {
            setSaveStatus('unsaved');
          }
        }, autoSaveDebounceMs);
      }
    },
  });

  // Sync external value when changed outside
  useEffect(() => {
    if (editor && value !== editor.getHTML() && value !== lastSavedValRef.current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
      lastSavedValRef.current = value || '';
    }
  }, [value, editor]);

  // Flush pending save on blur
  const handleBlur = async () => {
    if (!editor || !onAutoSave || !autoSaveEnabled) return;
    const currentHtml = editor.getHTML();
    if (currentHtml !== lastSavedValRef.current) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      setSaveStatus('saving');
      try {
        await onAutoSave(currentHtml);
        lastSavedValRef.current = currentHtml;
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
      }
    }
  };

  return (
    <Paper
      variant="outlined"
      onBlur={handleBlur}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        '& .ProseMirror': {
          outline: 'none',
          minHeight,
          fontFamily: 'inherit',
          fontSize: '0.875rem',
          lineHeight: 1.6,
          '& p.is-editor-empty:first-of-type::before': {
            color: 'text.disabled',
            content: 'attr(data-placeholder)',
            float: 'left',
            height: 0,
            pointerEvents: 'none',
          },
          '& .mention-tag': {
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            px: 0.75,
            py: 0.2,
            borderRadius: 1,
            fontWeight: 600,
            fontSize: '0.85em',
            display: 'inline-block',
            lineHeight: 1.3,
            userSelect: 'none',
          },
          '& table': {
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            width: '100%',
            my: 1,
            overflow: 'hidden',
            '& td, & th': {
              minWidth: '1em',
              border: '1px solid',
              borderColor: 'divider',
              padding: '6px 8px',
              verticalAlign: 'top',
              boxSizing: 'border-box',
              position: 'relative',
            },
            '& th': {
              fontWeight: 600,
              bgcolor: 'action.hover',
            },
          },
          '& blockquote': {
            borderLeft: '3px solid',
            borderColor: 'primary.main',
            ml: 0,
            pl: 2,
            fontStyle: 'italic',
            color: 'text.secondary',
          },
        },
      }}
    >
      <TipTapToolbar editor={editor} onOpenHistory={onOpenHistory} readOnly={readOnly} />
      <Box
        sx={{
          p: 2,
          flex: 1,
          cursor: readOnly ? 'default' : 'text',
          overflowY: 'auto',
          maxHeight: 500,
        }}
        onClick={() => {
          if (!readOnly && editor) editor.commands.focus();
        }}
      >
        <EditorContent editor={editor} />
      </Box>
      {autoSaveEnabled && !readOnly && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
          }}
        >
          {saveStatus === 'saving' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <CircularProgress size={12} thickness={5} />
              <Typography variant="caption" color="text.secondary">
                {t('saving') || 'Saving...'}
              </Typography>
            </Box>
          )}
          {saveStatus === 'saved' && (
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
              ✓ {t('allChangesSaved') || 'All changes saved'}
            </Typography>
          )}
          {saveStatus === 'unsaved' && (
            <Typography variant="caption" color="text.disabled">
              {t('unsavedChanges') || 'Unsaved changes'}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};
