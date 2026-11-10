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
import { ContractTemplateBlock } from './contractTemplateExtension';
import { useLanguage } from '../../../context/LanguageContext';
import type { User, ContractTemplate, ContractPlaceholderContext } from '../../../types';

import { cleanWordHtml } from '../../../utils/cleanWordHtml';
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

  // A4 & Template Support
  a4PageMode?: boolean;
  contractTemplates?: ContractTemplate[];
  contractContext?: ContractPlaceholderContext;
  onPrint?: () => void;
  fullHeight?: boolean;
  onEditorReady?: (editor: any) => void;
  extraToolbarActions?: React.ReactNode;
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
  a4PageMode = false,
  contractTemplates = [],
  contractContext,
  onPrint,
  fullHeight = false,
  onEditorReady,
  extraToolbarActions,
}) => {
  const { t } = useLanguage();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedValRef = useRef(value || '');

  const propUsersRef = useRef(propUsers);
  propUsersRef.current = propUsers;

  const mentionExt = useMemo(() => {
    return createMentionExtension(async (query: string, signal?: AbortSignal) => {
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
        placeholder: placeholder || t('typeNotesHere') || 'Tekst ugovora...',
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      mentionExt,
      ContractTemplateBlock,
    ],
    editorProps: {
      transformPastedHTML(html) {
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

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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
        height: fullHeight ? '100%' : 'auto',
        minHeight: fullHeight ? '100%' : undefined,
        bgcolor: a4PageMode ? 'action.selected' : 'background.paper',
        '& .ProseMirror': {
          outline: 'none',
          minHeight: a4PageMode ? '297mm' : minHeight,
          fontFamily: a4PageMode ? '"Times New Roman", Times, "Liberation Serif", serif' : 'inherit',
          fontSize: a4PageMode ? '11pt' : '0.875rem',
          lineHeight: a4PageMode ? 1.4 : 1.25,
          color: a4PageMode ? '#111827' : 'inherit',
          '& p': {
            margin: a4PageMode ? '4pt 0' : '2px 0',
          },
          '& h1': {
            fontSize: a4PageMode ? '16pt' : '1.5rem',
            fontWeight: 700,
            margin: a4PageMode ? '12pt 0 6pt 0' : '4px 0',
            textAlign: a4PageMode ? 'center' : 'left',
          },
          '& h2': {
            fontSize: a4PageMode ? '13pt' : '1.25rem',
            fontWeight: 700,
            margin: a4PageMode ? '10pt 0 4pt 0' : '4px 0',
          },
          '& h3': {
            fontSize: a4PageMode ? '11.5pt' : '1.1rem',
            fontWeight: 700,
            margin: a4PageMode ? '8pt 0 2pt 0' : '2px 0',
          },
          '& ul, & ol': {
            margin: a4PageMode ? '4pt 0' : 0,
            pl: 3,
          },
          '& li': {
            margin: a4PageMode ? '2pt 0' : 0,
          },
          '& table': {
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            width: '100%',
            my: a4PageMode ? '8pt' : 1,
            '& td, & th': {
              minWidth: '1em',
              border: '1px solid',
              borderColor: a4PageMode ? '#374151' : 'divider',
              padding: a4PageMode ? '6pt 8pt' : '6px 8px',
              verticalAlign: 'top',
              fontSize: a4PageMode ? '10pt' : 'inherit',
            },
            '& th': {
              fontWeight: 700,
              bgcolor: a4PageMode ? '#f3f4f6' : 'action.hover',
            },
          },
        },
      }}
    >
      <TipTapToolbar
        editor={editor}
        onOpenHistory={onOpenHistory}
        readOnly={readOnly}
        contractTemplates={contractTemplates}
        contractContext={contractContext}
        a4PageMode={a4PageMode}
        onPrint={onPrint}
        extraToolbarActions={extraToolbarActions}
      />

      {/* Editor Document Area */}
      <Box
        sx={{
          p: a4PageMode ? { xs: 1, sm: 2, md: 3 } : 2,
          flex: 1,
          cursor: readOnly ? 'default' : 'text',
          overflowY: 'auto',
          maxHeight: fullHeight ? 'none' : a4PageMode ? 750 : 500,
          height: fullHeight ? '100%' : 'auto',
          display: a4PageMode ? 'flex' : 'block',
          justifyContent: a4PageMode ? 'center' : 'initial',
        }}
        onClick={() => {
          if (!readOnly && editor) editor.commands.focus();
        }}
      >
        {a4PageMode ? (
          /* Physical A4 Sheet Container (210mm x 297mm proportions) */
          <Box
            className="a4-document-sheet"
            sx={{
              width: '100%',
              maxWidth: '210mm',
              minHeight: '297mm',
              bgcolor: '#ffffff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              borderRadius: 1,
              px: { xs: '15mm', sm: '20mm' },
              py: '25mm',
              boxSizing: 'border-box',
              position: 'relative',
              '@media print': {
                width: '100% !important',
                maxWidth: 'none !important',
                minHeight: 'auto !important',
                boxShadow: 'none !important',
                p: '0 !important',
                m: '0 !important',
              },
            }}
          >
            <EditorContent editor={editor} />
          </Box>
        ) : (
          <EditorContent editor={editor} />
        )}
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
                {t('saving') || 'Čuvanje...'}
              </Typography>
            </Box>
          )}
          {saveStatus === 'saved' && (
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
              ✓ {t('allChangesSaved') || 'Sve izmene sačuvane'}
            </Typography>
          )}
          {saveStatus === 'unsaved' && (
            <Typography variant="caption" color="text.disabled">
              {t('unsavedChanges') || 'Nesačuvane izmene'}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};
