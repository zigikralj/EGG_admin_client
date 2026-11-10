import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Menu,
  MenuItem,
  Popover,
  Typography,
  Select,
  FormControl,
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
  DescriptionIcon,
  PrintIcon,
} from '../../icons';
import { useLanguage } from '../../../context/LanguageContext';
import type { ContractTemplate, ContractPlaceholderContext } from '../../../types';
import { resolveContractPlaceholders } from '../../../utils/contractTemplatePlaceholders';

export interface TipTapToolbarProps {
  editor: Editor | null;
  onOpenHistory?: () => void;
  readOnly?: boolean;
  contractTemplates?: ContractTemplate[];
  contractContext?: ContractPlaceholderContext;
  a4PageMode?: boolean;
  onPrint?: () => void;
  extraToolbarActions?: React.ReactNode;
}

export const TipTapToolbar: React.FC<TipTapToolbarProps> = ({
  editor,
  onOpenHistory,
  readOnly = false,
  contractTemplates = [],
  contractContext,
  a4PageMode = false,
  onPrint,
  extraToolbarActions,
}) => {
  const { t } = useLanguage();

  // Template Picker Anchor & Preview State
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState<null | HTMLElement>(null);
  const [hoveredTemplate, setHoveredTemplate] = useState<ContractTemplate | null>(null);
  const [previewAnchor, setPreviewAnchor] = useState<null | HTMLElement>(null);

  // Font size selector state (legal pt sizes)
  const [currentFontSize, setCurrentFontSize] = useState<string>('11pt');

  if (!editor || readOnly) {
    return (
      <Box sx={{ p: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {extraToolbarActions}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          {onPrint && (
            <Tooltip title={t('btnPrintPdfA4')}>
              <Button
                size="small"
                startIcon={<PrintIcon fontSize="small" />}
                onClick={onPrint}
                color="primary"
                variant="outlined"
                sx={{ textTransform: 'none', py: 0.25, px: 1, borderRadius: 1.5, fontSize: '0.78rem' }}
              >
                {t('btnPrintPdfA4')}
              </Button>
            </Tooltip>
          )}
          {onOpenHistory && (
            <Tooltip title={t('noteHistoryAndDiff') || 'Note History & Diff'}>
              <IconButton size="small" onClick={onOpenHistory} color="primary">
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
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

  const handleOpenTemplates = (e: React.MouseEvent<HTMLElement>) => {
    setTemplateMenuAnchor(e.currentTarget);
  };

  const handleCloseTemplates = () => {
    setTemplateMenuAnchor(null);
    setHoveredTemplate(null);
    setPreviewAnchor(null);
  };

  const handleInsertTemplate = (tpl: ContractTemplate) => {
    handleCloseTemplates();
    if (!editor) return;

    // Resolve dynamic placeholders against context
    const resolvedHtml = resolveContractPlaceholders(tpl.content, contractContext || {});

    // Insert as custom contractTemplateBlock wrapper
    const wrappedHtml = `<div data-contract-template-block="true" data-template-id="${tpl.id}" data-template-name="${tpl.name}">${resolvedHtml}</div>`;
    editor.chain().focus().insertContent(wrappedHtml).run();
  };

  const handleFontSizeChange = (pt: string) => {
    setCurrentFontSize(pt);
    if (!editor) return;
    // Apply font-size inline or paragraph style
    editor.chain().focus().setMark('textStyle', { fontSize: pt }).run();
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

      {/* A4 Font Size Selector in Typographic Points */}
      {a4PageMode && (
        <>
          <Tooltip title="Veličina fonta (pt)">
            <FormControl size="small" sx={{ minWidth: 78 }}>
              <Select
                value={currentFontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                sx={{
                  height: 28,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  bgcolor: 'background.paper',
                }}
              >
                <MenuItem value="9pt">9 pt</MenuItem>
                <MenuItem value="10pt">10 pt</MenuItem>
                <MenuItem value="11pt">11 pt (Standard)</MenuItem>
                <MenuItem value="12pt">12 pt</MenuItem>
                <MenuItem value="13pt">13 pt (Član)</MenuItem>
                <MenuItem value="14pt">14 pt</MenuItem>
                <MenuItem value="16pt">16 pt (Naslov)</MenuItem>
                <MenuItem value="18pt">18 pt</MenuItem>
                <MenuItem value="24pt">24 pt</MenuItem>
              </Select>
            </FormControl>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        </>
      )}

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
        <Tooltip title="Naslov Ugovora (H1)">
          <ToggleButton
            value="h1"
            selected={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            sx={{ px: 1, fontWeight: 700, fontSize: '0.75rem' }}
          >
            H1
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Član / Odeljak (H2)">
          <ToggleButton
            value="h2"
            selected={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            sx={{ px: 1, fontWeight: 700, fontSize: '0.75rem' }}
          >
            H2
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Podnaslov (H3)">
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

      {/* Clear Formatting */}
      <Tooltip title={t('clearFormatting') || 'Clear Formatting'}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          <FormatClearIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Insert Contract Template Button */}
      {contractTemplates.length > 0 && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<DescriptionIcon fontSize="small" />}
            onClick={handleOpenTemplates}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.78rem',
              py: 0.25,
              px: 1,
              borderRadius: 1.5,
            }}
          >
            {t('sidebarTemplatesAndClauses')}
          </Button>

          <Menu
            anchorEl={templateMenuAnchor}
            open={Boolean(templateMenuAnchor)}
            onClose={handleCloseTemplates}
            slotProps={{ paper: { sx: { minWidth: 260, maxWidth: 360, maxHeight: 380, borderRadius: 2 } } }}
          >
            <Typography variant="caption" sx={{ px: 2, py: 0.5, fontWeight: 700, color: 'text.secondary', display: 'block' }}>
              {t('sidebarTemplatesAndClauses').toUpperCase()}
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            {contractTemplates.map((tpl) => (
              <MenuItem
                key={tpl.id}
                onClick={() => handleInsertTemplate(tpl)}
                onMouseEnter={(e) => {
                  setHoveredTemplate(tpl);
                  setPreviewAnchor(e.currentTarget);
                }}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {tpl.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '100%' }}>
                  {tpl.category} {tpl.description ? `• ${tpl.description}` : ''}
                </Typography>
              </MenuItem>
            ))}
          </Menu>

          {/* Hover Preview Popover */}
          <Popover
            open={Boolean(hoveredTemplate && previewAnchor && templateMenuAnchor)}
            anchorEl={previewAnchor}
            onClose={() => setHoveredTemplate(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            disableRestoreFocus
            sx={{ pointerEvents: 'none', ml: 1 }}
            slotProps={{
              paper: {
                sx: {
                  p: 2,
                  maxWidth: 380,
                  maxHeight: 280,
                  overflowY: 'auto',
                  borderRadius: 2,
                  boxShadow: 4,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'primary.light',
                },
              },
            }}
          >
            {hoveredTemplate && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'primary.main' }}>
                  {hoveredTemplate.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Pregled sa popunjenim parametrima (Ekos / Klijent):
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Box
                  sx={{
                    fontSize: '0.78rem',
                    lineHeight: 1.4,
                    '& p': { m: '4px 0' },
                    color: 'text.primary',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: resolveContractPlaceholders(hoveredTemplate.content, contractContext || {}),
                  }}
                />
              </Box>
            )}
          </Popover>
        </>
      )}

      {/* Print / PDF Button */}
      {onPrint && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title={t('btnPrintPdfA4')}>
            <IconButton size="small" onClick={onPrint} color="primary">
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}

      {extraToolbarActions && (
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          {extraToolbarActions}
        </Box>
      )}
    </Box>
  );
};
