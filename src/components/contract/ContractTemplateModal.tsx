import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Grid,
  TextField,
  Button,
  Chip,
  Box,
  Typography,
  Card,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  DescriptionIcon,
  FolderIcon,
  VisibilityIcon,
  EditIcon,
} from '../icons';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';
import { TipTapEditor } from '../common/tiptap/TipTapEditor';
import { AVAILABLE_PLACEHOLDERS } from '../../utils/contractTemplatePlaceholders';
import type { ContractTemplate } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { stripHtmlToText } from '../../utils/stripHtmlToText';

export interface ContractTemplateModalProps {
  open: boolean;
  onClose: () => void;
  editingTemplate: ContractTemplate | null;
  mode?: ModalMode;
  initialMode?: ModalMode;
  onModeChange?: (mode: ModalMode) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onSave: (data: Partial<ContractTemplate>) => Promise<boolean>;
  onDelete?: (id: string) => void;
}

export const ContractTemplateModal: React.FC<ContractTemplateModalProps> = ({
  open,
  onClose,
  editingTemplate,
  mode: controlledMode,
  initialMode,
  onModeChange: onModeChangeProp,
  canEdit = true,
  canDelete = false,
  onSave,
  onDelete,
}) => {
  const { t } = useLanguage();

  const [internalMode, setInternalMode] = useState<ModalMode>(() => {
    if (controlledMode) return controlledMode;
    if (initialMode) return initialMode;
    return editingTemplate ? 'view' : 'create';
  });

  const currentMode = controlledMode || internalMode;
  const isView = currentMode === 'view';

  // Workspace tab: 'details' | 'editor'
  const [activeWorkspace, setActiveWorkspace] = useState<'details' | 'editor'>('details');

  // Editor instance reference for direct cursor insertions
  const editorRef = useRef<any>(null);

  const handleModeChange = (newMode: ModalMode) => {
    setInternalMode(newMode);
    onModeChangeProp?.(newMode);
  };

  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      if (controlledMode) {
        setInternalMode(controlledMode);
      } else if (initialMode) {
        setInternalMode(initialMode);
      } else {
        setInternalMode(editingTemplate ? 'view' : 'create');
      }
      setActiveWorkspace('details');

      if (editingTemplate) {
        setName(editingTemplate.name || '');
        setCategory(editingTemplate.category || 'General');
        setDescription(editingTemplate.description || '');
        setContent(editingTemplate.content || '');
      } else {
        setName('');
        setCategory('General');
        setDescription('');
        setContent('<p>Unesite tekst klauzule ili šablona ovde...</p>');
      }
      setErrorMsg('');
    }
  }, [open, editingTemplate, controlledMode, initialMode, isView]);

  // Content Metrics
  const docMetrics = useMemo(() => {
    const rawText = stripHtmlToText(content || '').trim();
    const words = rawText ? rawText.split(/\s+/).length : 0;
    const chars = rawText.length;
    const hasContent = rawText.length > 0;
    return { rawText, words, chars, hasContent };
  }, [content]);

  const handleInsertPlaceholder = (placeholderKey: string) => {
    if (editorRef.current) {
      editorRef.current.chain().focus().insertContent(` ${placeholderKey} `).run();
    } else {
      setContent((prev) => `${prev} ${placeholderKey} `);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isView) return;
    if (!name.trim()) {
      setErrorMsg(t('errTemplateNameRequired'));
      setActiveWorkspace('details');
      return;
    }
    if (!content.trim()) {
      setErrorMsg(t('errTemplateContentRequired'));
      setActiveWorkspace('editor');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      const ok = await onSave({
        id: editingTemplate?.id,
        name: name.trim(),
        category: category.trim() || 'General',
        description: description.trim() || null,
        content: content.trim(),
      });
      if (ok) {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || t('errSaveTemplate'));
    } finally {
      setIsSaving(false);
    }
  };

  // Header workspace switcher
  const headerSwitcher = (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={activeWorkspace}
      onChange={(_, val) => {
        if (val) setActiveWorkspace(val);
      }}
      sx={{
        bgcolor: 'action.hover',
        borderRadius: 2,
        p: 0.25,
        border: '1px solid',
        borderColor: 'divider',
        '& .MuiToggleButton-root': {
          px: 1.5,
          py: 0.5,
          border: 0,
          borderRadius: 1.5,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8rem',
          gap: 0.75,
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          },
        },
      }}
    >
      <ToggleButton value="details">
        <FolderIcon sx={{ fontSize: 16 }} />
        {t('templateTabDetails')}
      </ToggleButton>
      <ToggleButton value="editor">
        <DescriptionIcon sx={{ fontSize: 16 }} />
        {t('templateTabEditor')}
        {docMetrics.hasContent && (
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: activeWorkspace === 'editor' ? '#fff' : 'primary.main',
            }}
          />
        )}
      </ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <ViewEditModalBase
      open={open}
      onClose={onClose}
      mode={currentMode}
      onModeChange={handleModeChange}
      canEdit={canEdit}
      canDelete={canDelete}
      isSaving={isSaving}
      title={
        editingTemplate
          ? editingTemplate.name
          : t('modalNewTemplate')
      }
      onSave={handleSubmit}
      onDelete={editingTemplate && onDelete ? () => onDelete(editingTemplate.id) : undefined}
      dialogProps={{ fullScreen: true }}
      maxWidth={false}
      height="100vh"
      maxHeight="100vh"
      paperSx={{ borderRadius: 0, m: 0, width: '100vw', height: '100vh', maxHeight: '100vh' }}
      contentSx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      extraHeaderActions={headerSwitcher}
    >
      {/* Workspace 1: Template Details Dashboard */}
      {activeWorkspace === 'details' && (
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {errorMsg && (
              <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
                {errorMsg}
              </Typography>
            )}

            <Grid container spacing={2.5}>
              {/* Left Column (7/12): Template Core Metadata */}
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>
                    {t('modalTemplateDetails')}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <ViewEditField
                      mode={currentMode}
                      label={t('colTemplateName')}
                      value={name}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        label={t('colTemplateName')}
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('phTemplateName')}
                      />
                    </ViewEditField>

                    <ViewEditField
                      mode={currentMode}
                      label={t('colCategory')}
                      value={<Chip size="small" label={category} sx={{ fontWeight: 600 }} />}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        label={t('colCategory')}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder={t('phTemplateCategory')}
                      />
                    </ViewEditField>

                    <ViewEditField
                      mode={currentMode}
                      label={t('colTemplateDescription')}
                      value={description || '-'}
                    >
                      <TextField
                        fullWidth
                        multiline
                        label={t('colTemplateDescription')}
                        minRows={2}
                        maxRows={4}
                        size="small"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('phTemplateDescription')}
                      />
                    </ViewEditField>
                  </Box>
                </Card>
              </Grid>

              {/* Right Column (5/12): Template Content Summary Card */}
              <Grid size={{ xs: 12, lg: 5 }}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    border: '1px solid',
                    borderColor: docMetrics.hasContent ? 'primary.light' : 'divider',
                    bgcolor: docMetrics.hasContent ? 'action.hover' : 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon color={docMetrics.hasContent ? 'primary' : 'action'} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('templateDocSummaryTitle')}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('contractDocWords', { count: docMetrics.words })} • {t('contractDocChars', { count: docMetrics.chars })}
                    </Typography>
                  </Box>

                  {/* Text Preview Snippet Box */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                      maxHeight: 140,
                      overflow: 'hidden',
                      fontFamily: '"Times New Roman", Times, serif',
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      color: docMetrics.hasContent ? 'text.primary' : 'text.disabled',
                      fontStyle: docMetrics.hasContent ? 'normal' : 'italic',
                    }}
                  >
                    {docMetrics.hasContent
                      ? `${docMetrics.rawText.slice(0, 260)}...`
                      : t('contractDocEmpty')}
                  </Paper>

                  {/* Template Launch Action Buttons */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', pt: 0.5 }}>
                    {isView ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<VisibilityIcon fontSize="small" />}
                          onClick={() => setActiveWorkspace('editor')}
                          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                        >
                          {t('btnPreviewTemplate')}
                        </Button>
                        {canEdit && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<EditIcon fontSize="small" />}
                            onClick={() => {
                              handleModeChange('edit');
                              setActiveWorkspace('editor');
                            }}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                          >
                            {t('btnEditTemplateContent')}
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon fontSize="small" />}
                        onClick={() => setActiveWorkspace('editor')}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                      >
                        {t('btnEditTemplateContent')}
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* Workspace 2: Full-Height Template Editor Studio */}
      {activeWorkspace === 'editor' && (
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
          {/* Main Editor Center Canvas */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
            <TipTapEditor
              value={content}
              onChange={setContent}
              readOnly={isView}
              a4PageMode
              fullHeight
              onEditorReady={(ed) => {
                editorRef.current = ed;
              }}
              autoSaveEnabled={false}
              onPrint={() => window.print()}
            />
          </Box>

          {/* Permanent Right Panel: Dynamic Variables Quick-Insert */}
          <Box
            sx={{
              width: { xs: 260, sm: 320 },
              flexShrink: 0,
              borderLeft: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Panel Content */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {t('sidebarInsertAtCursor')}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {AVAILABLE_PLACEHOLDERS.map((ph) => (
                  <Tooltip key={ph.key} title={`${ph.label} (${ph.example || ph.key})`}>
                    <Chip
                      size="small"
                      label={ph.label}
                      onClick={() => handleInsertPlaceholder(ph.key)}
                      clickable={!isView}
                      variant="outlined"
                      color={ph.category === 'ekos' ? 'primary' : ph.category === 'client' ? 'secondary' : 'default'}
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </ViewEditModalBase>
  );
};

export default ContractTemplateModal;
