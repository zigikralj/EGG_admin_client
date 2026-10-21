import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Button,
  Grid,
  Typography,
  Box,
  Paper,
  IconButton,
  Chip,
  ToggleButton,
  LinearProgress,
  useTheme,
  alpha,
  Tabs,
  Tab,
} from '@mui/material';

import type { Project } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ErrorDialog } from '../dialogs/ErrorDialog';
import { TipTapEditor } from '../common/tiptap/TipTapEditor';
import { ProjectProgressSlider } from './ProjectProgressSlider';
import { ProjectReminderSection } from './ProjectReminderSection';
import { ProjectInvoiceSection } from './ProjectInvoiceSection';
import { useProjectForm } from '../../hooks/useProjectForm';
import {
  EditIcon,
  CloseIcon,
  NotesIcon,
  VisibilityIcon,
  CompareArrowsIcon,
  NotificationsActiveIcon,
  ReceiptLongIcon,
} from '../icons';
import { ConfirmDialog } from '../dialogs/ConfirmDialog';
import { HistoryTimelineModal } from '../history';
import {
  useClientsQuery,
  useUsersQuery,
  useServicesQuery,
  useRemindersQuery,
  useInvoicesQuery,
  useProjectsMutations,
  useRemindersMutations,
  useInvoicesMutations,
  useProjectDetailsQuery,
  useProjectNoteQuery,
  useProjectUpdatesDiffQuery,
} from '../../queries';

interface Props {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onEdit: (project: Project) => void;
  diffRange?: { dateFrom: string; dateTo: string } | null;
}

const ProjectViewModal: React.FC<Props> = ({
  isOpen,
  project,
  onClose,
  onEdit,
  diffRange,
}) => {
  const { data: clients = [] } = useClientsQuery();
  const { data: users = [] } = useUsersQuery();
  const { data: services = [] } = useServicesQuery();
  const { data: reminders = [] } = useRemindersQuery();
  const { data: invoices = [] } = useInvoicesQuery();
  const { handleSave: onSave, handleSaveNotes: _handleSaveNotes, handleSaveNote, toggleDoneMutation } = useProjectsMutations();
  const { handleSave: onSaveReminder, handleDelete: onDeleteReminder, handleStatusChangeReminder: onStatusChangeReminder } = useRemindersMutations();
  const { handleSave: onSaveInvoice, handleDelete: onDeleteInvoice, handleUpdateInvoiceStatus: _onStatusChangeInvoice } = useInvoicesMutations();

  const { data: projectDetails } = useProjectDetailsQuery(
    project?.id,
    isOpen && Boolean(project?.id)
  );

  const effectiveProject = React.useMemo(() => {
    if (!project) return null;
    return projectDetails ? { ...project, ...projectDetails } : project;
  }, [project, projectDetails]);

  const onToggleDone = async (id: string) => {
    await toggleDoneMutation.mutateAsync({ id, isCompleting: !effectiveProject?.done });
  };

  const onStatusChangeInvoice = async (id: string, status: string, paymentDate?: string) => {
    await _onStatusChangeInvoice(id, status, paymentDate);
  };

  const { t, getServiceLabel, getResponsibleLabel } = useLanguage();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { currentUser, canEditProject, canManageInvoices } = useAuth();
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const wrapDelete = (delFn: (id: string, confirm: (msg: string, cb: () => void) => void) => void) => (id: string) => {
    delFn(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));
  };

  const wrappedOnDeleteReminder = wrapDelete(onDeleteReminder);
  const wrappedOnDeleteInvoice = wrapDelete(onDeleteInvoice);

  const effectiveProjectId = effectiveProject?.id;

  // Diff Mode state and query
  const { data: updatesDiff, isFetching: isDiffFetching } = useProjectUpdatesDiffQuery(
    effectiveProjectId,
    diffRange?.dateFrom,
    diffRange?.dateTo,
    isOpen && Boolean(diffRange?.dateFrom && effectiveProjectId)
  );

  const [showDiffView, setShowDiffView] = useState(Boolean(diffRange));

  useEffect(() => {
    if (diffRange) {
      setShowDiffView(true);
    }
  }, [diffRange]);

  const fieldDiffs = updatesDiff?.fieldDiffs || {};
  const hasNoteChanges = Boolean(
    updatesDiff?.notesDiff?.diff &&
    updatesDiff.notesDiff.diff.length > 0 &&
    updatesDiff.notesDiff.diff.some((tk: any) => tk.op === 'insert' || tk.op === 'delete')
  );

  const renderFieldDiff = (fieldName: string, format?: (val: any) => string) => {
    if (!showDiffView || !fieldDiffs[fieldName]) return null;
    const { old: oldVal, new: newVal } = fieldDiffs[fieldName];
    const oldText = format ? format(oldVal) : String(oldVal ?? '—');
    const newText = format ? format(newVal) : String(newVal ?? '—');
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          ml: 1,
          px: 0.8,
          py: 0.2,
          borderRadius: 1,
          bgcolor: isDark ? alpha('#f59e0b', 0.22) : alpha('#f59e0b', 0.12),
          border: '1px solid',
          borderColor: isDark ? alpha('#f59e0b', 0.45) : alpha('#f59e0b', 0.35),
          fontSize: '0.72rem',
          fontWeight: 600,
          color: isDark ? '#fbbf24' : '#b45309',
          verticalAlign: 'middle',
        }}
      >
        <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.75 }}>
          {oldText || '—'}
        </Box>
        <Box component="span" sx={{ fontSize: '0.75rem' }}>➔</Box>
        <Box component="span" sx={{ color: isDark ? '#4ade80' : '#15803d', fontWeight: 700 }}>
          {newText || '—'}
        </Box>
      </Box>
    );
  };

  const { data: noteData } = useProjectNoteQuery(
    effectiveProjectId,
    isOpen && Boolean(effectiveProjectId)
  );

  const effectiveProjectNotes = noteData?.content !== undefined ? noteData.content : effectiveProject?.notes;

  // Local state for editable notes
  const [notes, setNotes] = useState(effectiveProjectNotes || '');
  const prevProjectIdRef = useRef(effectiveProjectId);
  const lastSavedNotesRef = useRef(effectiveProjectNotes || '');
  const isAutoSavingRef = useRef(false);

  useEffect(() => {
    if (!effectiveProjectId) return;
    if (prevProjectIdRef.current !== effectiveProjectId) {
      prevProjectIdRef.current = effectiveProjectId;
      let initialVal = effectiveProjectNotes || '';
      try {
        const savedDraft = localStorage.getItem(`ekos_draft_notes_${effectiveProjectId}`);
        if (savedDraft && savedDraft !== initialVal) {
          initialVal = savedDraft;
        }
      } catch {}
      setNotes(initialVal);
      lastSavedNotesRef.current = effectiveProjectNotes || '';
    } else if (effectiveProjectNotes !== undefined && effectiveProjectNotes !== lastSavedNotesRef.current && !isAutoSavingRef.current) {
      setNotes((curr) => {
        if (!curr || curr === '<p></p>' || curr === lastSavedNotesRef.current) {
          return effectiveProjectNotes || '';
        }
        return curr;
      });
      lastSavedNotesRef.current = effectiveProjectNotes || '';
    }
  }, [effectiveProjectId, effectiveProjectNotes]);

  const { reminderState, invoiceState } = useProjectForm({
    projectToEdit: effectiveProject,
    clients,
    users,
    services,
    reminders,
    invoices,
    currentUser,
  });

  const [activeTab, setActiveTab] = useState<'notes' | 'invoices' | 'reminders'>('notes');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('notes');
    }
  }, [isOpen, effectiveProjectId]);

  const invoiceCount = invoiceState.projectInvoices?.length || 0;
  const reminderCount = reminderState.projectReminders?.length || 0;

  const handleAutoSaveNotes = async (val: string) => {
    if (!effectiveProjectId) return;
    isAutoSavingRef.current = true;
    lastSavedNotesRef.current = val;
    try {
      const res = await handleSaveNote(effectiveProjectId, val);
      if (res && !res.success) {
        setErrorDialogState({ open: true, message: res.error || t('errorSavingProject') });
        throw new Error(res.error || t('errorSavingProject'));
      }
      try {
        localStorage.removeItem(`ekos_draft_notes_${effectiveProjectId}`);
      } catch {}
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } finally {
      isAutoSavingRef.current = false;
    }
  };

  if (!isOpen || !project) return null;

  const clientObj = clients.find((c) => c.id === project.clientId || c.name === project.clientName);

  const isEditable = project ? canEditProject(project) : false;
  const canEditProjectInvoices = canManageInvoices;

  const handleProgressChange = async (val: number) => {
    if (!project || !onSave) return;
    const newDone = val >= 100;
    try {
      const res = await onSave({ ...project, progress: val, done: newDone }, { silent: true });
      if (res && !res.success) {
        setErrorDialogState({ open: true, message: res.error || t('errorSavingProject') });
      }
    } catch (err: any) {
      setErrorDialogState({ open: true, message: err?.message || t('errorSavingProject') });
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              height: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
              maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('modalViewProject')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {diffRange && (
              <ToggleButton
                value="currentData"
                selected={!showDiffView}
                onChange={() => setShowDiffView((v) => !v)}
                color="primary"
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 0.5,
                  height: 32,
                  borderColor: !showDiffView ? 'primary.main' : 'divider',
                  bgcolor: !showDiffView
                    ? (theme) => alpha(theme.palette.primary.main, 0.12)
                    : 'transparent',
                  color: !showDiffView ? 'primary.main' : 'text.primary',
                  '&.Mui-selected': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                    color: 'primary.main',
                    borderColor: 'primary.main',
                    fontWeight: 700,
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.22),
                    },
                  },
                }}
              >
                {showDiffView ? (
                  <VisibilityIcon sx={{ fontSize: 16, mr: 0.75 }} />
                ) : (
                  <CompareArrowsIcon sx={{ fontSize: 16, mr: 0.75 }} />
                )}
                {showDiffView ? t('showFinalData') : t('showDiffs')}
              </ToggleButton>
            )}

            {isEditable && (
              <>
                <Button
                  color={project.done ? 'success' : 'inherit'}
                  variant={project.done ? 'contained' : 'outlined'}
                  size="small"
                  disabled={showDiffView}
                  onClick={() => {
                    if (onToggleDone) {
                      onToggleDone(project.id);
                    } else if (onSave) {
                      onSave({
                        ...project,
                        done: !project.done,
                        progress: !project.done ? 100 : project.progress,
                      });
                    }
                  }}
                  startIcon={
                    <Checkbox
                      checked={project.done}
                      size="small"
                      sx={{
                        p: 0,
                        color: project.done ? 'inherit' : 'action.active',
                        '&.Mui-checked': { color: 'inherit' },
                      }}
                      tabIndex={-1}
                    />
                  }
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 1.5,
                    px: 1.5,
                    bgcolor: project.done ? 'success.main' : 'transparent',
                    color: project.done ? 'success.contrastText' : 'text.primary',
                    borderColor: project.done ? 'success.main' : 'divider',
                    '&:hover': {
                      bgcolor: project.done ? 'success.dark' : 'action.hover',
                      borderColor: project.done ? 'success.dark' : 'text.secondary',
                    },
                  }}
                >
                  {t('btnMarkDone')}
                </Button>
              </>
            )}

            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: 'text.secondary', ml: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        {diffRange && isDiffFetching && (
          <LinearProgress
            sx={{
              height: 2.5,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              '& .MuiLinearProgress-bar': {
                bgcolor: 'primary.main',
              },
            }}
          />
        )}

        <DialogContent dividers sx={{ pt: 2 }}>
          <Grid container spacing={1.25}>
            {/* PROJECT NAME */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {t('lblProjectName')}:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {project.name}
                  {renderFieldDiff('name')}
                </Typography>
              </Box>
            </Grid>

            {/* CLIENT */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {t('lblClient')}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {project.clientName || '—'}
                  {clientObj?.city && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                      ({clientObj.city})
                    </Typography>
                  )}
                  {renderFieldDiff('clientName')}
                </Typography>
              </Box>
            </Grid>

            {/* RESPONSIBLE */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {getResponsibleLabel(project.responsible, users)}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {project.responsible || '—'}
                  {renderFieldDiff('responsible', (r) => getResponsibleLabel(r, users))}
                </Typography>
              </Box>
            </Grid>

            {/* SERVICE TYPE */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {t('lblService')}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {getServiceLabel(project.type, services)}
                  {renderFieldDiff('type', (tp) => getServiceLabel(tp, services))}
                </Typography>
              </Box>
            </Grid>

            {/* DATES */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {t('lblStartDate')}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {project.start || '—'}
                  {renderFieldDiff('start')}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {t('lblDeadlineDate')}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: project.deadline ? 'text.primary' : 'text.secondary', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {project.deadline || '—'}
                  {renderFieldDiff('deadline')}
                </Typography>
              </Box>
            </Grid>

            {/* PROGRESS (INTERACTIVE SLIDER) */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  py: 0.6,
                  px: 1.25,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  minHeight: 38,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <ProjectProgressSlider
                    value={project.progress}
                    label={t('progress')}
                    disabled={!isEditable || showDiffView}
                    onChangeCommitted={handleProgressChange}
                    compact
                  />
                </Box>
                {showDiffView && (fieldDiffs.progress || fieldDiffs.done) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
                    {renderFieldDiff('progress', (p) => `${p}%`)}
                    {renderFieldDiff('done', (d) => d ? (t('statusCompleted') || 'Završeno') : (t('statusInProgress') || 'U toku'))}
                  </Box>
                )}
              </Box>
            </Grid>

            {/* TABS NAVIGATION FOR NOTES, INVOICES, REMINDERS */}
            <Grid size={{ xs: 12 }} sx={{ mt: 0.5 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, val) => setActiveTab(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 40,
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                    },
                    '& .MuiTab-root': {
                      minHeight: 40,
                      py: 0.75,
                      px: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: 'text.secondary',
                      '&.Mui-selected': {
                        fontWeight: 700,
                        color: 'primary.main',
                      },
                    },
                  }}
                >
                  <Tab
                    value="notes"
                    icon={<NotesIcon sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <span>{t('lblProjectNotes')}</span>
                        {showDiffView && diffRange && hasNoteChanges && (
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: '#f59e0b',
                              display: 'inline-block',
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <Tab
                    value="invoices"
                    icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <span>{t('tabInvoices')}</span>
                        {invoiceCount > 0 && (
                          <Chip
                            label={invoiceCount}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: activeTab === 'invoices' ? 'primary.main' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                              color: activeTab === 'invoices' ? 'primary.contrastText' : 'text.secondary',
                            }}
                          />
                        )}
                        {showDiffView && updatesDiff?.invoices && updatesDiff.invoices.length > 0 && (
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: '#10b981',
                              display: 'inline-block',
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <Tab
                    value="reminders"
                    icon={<NotificationsActiveIcon sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <span>{t('tabReminders')}</span>
                        {reminderCount > 0 && (
                          <Chip
                            label={reminderCount}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: activeTab === 'reminders' ? 'primary.main' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                              color: activeTab === 'reminders' ? 'primary.contrastText' : 'text.secondary',
                            }}
                          />
                        )}
                        {showDiffView && updatesDiff?.reminders && updatesDiff.reminders.length > 0 && (
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: '#3b82f6',
                              display: 'inline-block',
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                </Tabs>
              </Box>
            </Grid>

            {/* TAB PANELS */}
            {/* TAB 1: NOTES */}
            <Grid size={{ xs: 12 }} sx={{ display: activeTab === 'notes' ? 'block' : 'none' }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotesIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('lblProjectNotes')}
                    </Typography>
                    {showDiffView && diffRange && hasNoteChanges && (
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.6,
                          px: 0.8,
                          py: 0.2,
                          borderRadius: 1,
                          bgcolor: isDark ? alpha('#f59e0b', 0.22) : alpha('#f59e0b', 0.12),
                          border: '1px solid',
                          borderColor: isDark ? alpha('#f59e0b', 0.45) : alpha('#f59e0b', 0.35),
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: isDark ? '#fbbf24' : '#b45309',
                          verticalAlign: 'middle',
                        }}
                      >
                        <CompareArrowsIcon sx={{ fontSize: 13 }} />
                        {t('reviewChanges')}
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Single Notes Container: Full text with inline diffs when diffs exist, otherwise clean editor */}
                {showDiffView && diffRange && hasNoteChanges ? (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: isDark ? alpha('#0f172a', 0.5) : '#ffffff',
                      border: '1px solid',
                      borderColor: isDark ? alpha('#f59e0b', 0.45) : alpha('#f59e0b', 0.35),
                      fontSize: '0.875rem',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      minHeight: 120,
                      maxHeight: 400,
                      overflowY: 'auto',
                      fontFamily: theme.typography.fontFamily,
                    }}
                  >
                    {updatesDiff?.notesDiff?.diff?.map((token: any, i: number) => {
                      const text = token.text.replace(/<[^>]*>/g, '');
                      if (!text) return null;
                      if (token.op === 'insert') {
                        return (
                          <Box
                            key={i}
                            component="span"
                            sx={{
                              bgcolor: isDark ? alpha('#22c55e', 0.25) : alpha('#22c55e', 0.16),
                              color: isDark ? '#4ade80' : '#15803d',
                              fontWeight: 600,
                              px: 0.4,
                              py: 0.1,
                              borderRadius: '3px',
                            }}
                          >
                            {text}
                          </Box>
                        );
                      }
                      if (token.op === 'delete') {
                        return (
                          <Box
                            key={i}
                            component="span"
                            sx={{
                              bgcolor: isDark ? alpha('#ef4444', 0.22) : alpha('#ef4444', 0.14),
                              color: isDark ? '#f87171' : '#b91c1c',
                              textDecoration: 'line-through',
                              px: 0.4,
                              py: 0.1,
                              borderRadius: '3px',
                            }}
                          >
                            {text}
                          </Box>
                        );
                      }
                      return (
                        <Box key={i} component="span" sx={{ color: 'text.primary' }}>
                          {text}
                        </Box>
                      );
                    })}
                  </Box>
                ) : !showDiffView && isEditable ? (
                  <TipTapEditor
                    value={notes}
                    onChange={(val) => {
                      setNotes(val);
                      try {
                        if (effectiveProjectId) {
                          localStorage.setItem(`ekos_draft_notes_${effectiveProjectId}`, val);
                        }
                      } catch {}
                    }}
                    onAutoSave={handleAutoSaveNotes}
                    users={users}
                    placeholder={t('phProjectNotes')}
                    minHeight={160}
                  />
                ) : (
                  <TipTapEditor
                    value={notes}
                    readOnly
                    users={users}
                    minHeight={100}
                  />
                )}
              </Paper>
            </Grid>

            {/* TAB 2: INVOICES */}
            <Grid size={{ xs: 12 }} sx={{ display: activeTab === 'invoices' ? 'block' : 'none' }}>
              {showDiffView && updatesDiff?.invoices && updatesDiff.invoices.length > 0 && (
                <Box
                  sx={{
                    mb: 1.5,
                    p: 1.25,
                    borderRadius: 1.5,
                    bgcolor: isDark ? alpha('#10b981', 0.14) : alpha('#10b981', 0.08),
                    border: '1px solid',
                    borderColor: isDark ? alpha('#10b981', 0.3) : alpha('#10b981', 0.2),
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', display: 'block', mb: 0.5 }}>
                    {t('updatedInvoicesInPeriod')}:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {updatesDiff.invoices.map((inv) => (
                      <Chip
                        key={inv.id}
                        size="small"
                        label={`${inv.invoiceNumber} (${inv.isNew ? 'Nova' : 'Izmenjena'})`}
                        color={inv.isNew ? 'success' : 'info'}
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              <ProjectInvoiceSection
                projectToEdit={project}
                projectName={project?.name || ''}
                clientId={project?.clientId || ''}
                clientName={project?.clientName || ''}
                invoices={invoices}
                onSaveInvoice={onSaveInvoice}
                onDeleteInvoice={wrappedOnDeleteInvoice}
                onStatusChangeInvoice={onStatusChangeInvoice}
                setErrorDialogState={setErrorDialogState}
                disabled={!canEditProjectInvoices || showDiffView}
                invoiceState={invoiceState}
              />
            </Grid>

            {/* TAB 3: REMINDERS */}
            <Grid size={{ xs: 12 }} sx={{ display: activeTab === 'reminders' ? 'block' : 'none' }}>
              {showDiffView && updatesDiff?.reminders && updatesDiff.reminders.length > 0 && (
                <Box
                  sx={{
                    mb: 1.5,
                    p: 1.25,
                    borderRadius: 1.5,
                    bgcolor: isDark ? alpha('#3b82f6', 0.14) : alpha('#3b82f6', 0.08),
                    border: '1px solid',
                    borderColor: isDark ? alpha('#3b82f6', 0.3) : alpha('#3b82f6', 0.2),
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 0.5 }}>
                    {t('updatedRemindersInPeriod')}:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {updatesDiff.reminders.map((r) => (
                      <Chip
                        key={r.id}
                        size="small"
                        label={`${r.title} (${r.isNew ? 'Novo' : 'Izmenjeno'})`}
                        color={r.isNew ? 'success' : 'info'}
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              <ProjectReminderSection
                projectToEdit={project}
                projectName={project.name}
                clientId={project.clientId || ''}
                clientName={project.clientName || ''}
                responsible={project.responsible || ''}
                users={users}
                reminders={reminders}
                onSaveReminder={onSaveReminder}
                onDeleteReminder={wrappedOnDeleteReminder}
                onStatusChangeReminder={onStatusChangeReminder}
                setErrorDialogState={setErrorDialogState}
                disabled={!isEditable || showDiffView}
                reminderState={reminderState}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            {isEditable && (
              <Button
                onClick={() => {
                  onClose();
                  onEdit(project);
                }}
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
              >
                {t('modalEditProject')}
              </Button>
            )}
          </Box>
          <Button onClick={onClose} variant="contained" color="inherit">
            {t('btnClose')}
          </Button>
        </DialogActions>
      </Dialog>



      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState({ open: false, message: '' })}
      />

      <ConfirmDialog
        open={deleteConfirmState.open}
        title={t('confirmDeleteTitle')}
        message={deleteConfirmState.message}
        confirmLabel={t('btnDelete')}
        onConfirm={() => {
          deleteConfirmState.onConfirm();
          setDeleteConfirmState(prev => ({ ...prev, open: false }));
        }}
        onClose={() => setDeleteConfirmState(prev => ({ ...prev, open: false }))}
        confirmColor="warning"
      />

      {isHistoryOpen && effectiveProject && (
        <HistoryTimelineModal
          open={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          entityType="Project"
          entityId={effectiveProject.id}
          entityTitle={effectiveProject.name}
        />
      )}
    </>
  );
};

export default ProjectViewModal;
