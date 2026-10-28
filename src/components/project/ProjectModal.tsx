import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Checkbox,
  Grid,
  Tabs,
  Tab,
  Chip,
  ToggleButton,
  TextField,
  useTheme,
  alpha,
} from '@mui/material';

import type { Project } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ErrorDialog } from '../common/dialogs/ErrorDialog';
import { ConfirmDialog } from '../common/dialogs/ConfirmDialog';
import { TipTapEditor } from '../common/tiptap/TipTapEditor';
import { stripHtmlToText } from '../common/RichTextEditor';
import { ProjectProgressSlider } from './ProjectProgressSlider';
import { ProjectReminderSection } from './ProjectReminderSection';
import { ProjectInvoiceSection } from './ProjectInvoiceSection';
import { useProjectForm } from '../../hooks/useProjectForm';
import { HistoryTimelineModal } from '../history';
import {
  NotesIcon,
  ReceiptLongIcon,
  NotificationsActiveIcon,
  VisibilityIcon,
  CompareArrowsIcon,
  HistoryIcon,
} from '../icons';
import {
  useProjectsMutations,
  useRemindersMutations,
  useInvoicesMutations,
  useProjectDetailsQuery,
  useProjectUpdatesDiffQuery,
} from '../../queries';
import { ClientAutocomplete, UserAutocomplete, ServiceAutocomplete } from '../common/autocomplete';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';

export interface ProjectModalProps {
  isOpen: boolean;
  projectToEdit?: Project | null;
  project?: Project | null;
  initialMode?: ModalMode;
  diffRange?: { dateFrom: string; dateTo: string } | null;
  onClose: () => void;
  onEdit?: (project: Project) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  projectToEdit,
  project: propProject,
  initialMode,
  diffRange,
  onClose,
  onEdit,
}) => {
  const { t, getServiceLabel, getResponsibleLabel } = useLanguage();
  const { currentUser, canEditProject, canDeleteProject, canManageInvoices } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Resolve target project from props
  const targetProject = propProject !== undefined ? propProject : projectToEdit || null;
  const targetProjectId = targetProject?.id;

  // Mode state: 'view' | 'edit' | 'create'
  const [mode, setMode] = useState<ModalMode>(() => {
    if (initialMode) return initialMode;
    return targetProject ? 'view' : 'create';
  });

  useEffect(() => {
    if (isOpen) {
      if (initialMode) {
        setMode(initialMode);
      } else {
        setMode(targetProject ? 'view' : 'create');
      }
    }
  }, [isOpen, targetProjectId, initialMode]);

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  // React Query mutations
  const {
    handleSave: onSave,
    handleDelete: onDelete,
    handleSaveNote,
    toggleDoneMutation,
  } = useProjectsMutations();
  const {
    handleSave: onSaveReminder,
    handleDelete: onDeleteReminder,
    handleStatusChangeReminder: onStatusChangeReminder,
  } = useRemindersMutations();
  const {
    handleSave: onSaveInvoice,
    handleDelete: onDeleteInvoice,
    handleUpdateInvoiceStatus: _onStatusChangeInvoice,
  } = useInvoicesMutations();

  const onStatusChangeInvoice = async (id: string, status: string, paymentDate?: string) => {
    await _onStatusChangeInvoice(id, status, paymentDate);
  };

  // Detailed Project Query (with full rich-text notes)
  const { data: projectDetails } = useProjectDetailsQuery(
    targetProjectId,
    isOpen && Boolean(targetProjectId)
  );

  const effectiveProject = useMemo(() => {
    if (!targetProject) return null;
    return projectDetails ? { ...targetProject, ...projectDetails } : targetProject;
  }, [targetProject, projectDetails]);

  // Diff Mode state and query
  const { data: updatesDiff, isFetching: isDiffFetching } = useProjectUpdatesDiffQuery(
    targetProjectId,
    diffRange?.dateFrom,
    diffRange?.dateTo,
    isOpen && Boolean(diffRange?.dateFrom && targetProjectId)
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

  // Dialog State
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const wrapDelete = (delFn: (id: string, confirm: (msg: string, cb: () => void) => void) => void) => (id: string) => {
    delFn(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));
  };

  const wrappedOnDelete = wrapDelete(onDelete);
  const wrappedOnDeleteReminder = wrapDelete(onDeleteReminder);
  const wrappedOnDeleteInvoice = wrapDelete(onDeleteInvoice);

  // Form State via hook
  const { formState, reminderState, invoiceState, handleClientSelectChange } = useProjectForm({
    projectToEdit: effectiveProject,
    clients: (effectiveProject?.client ? [effectiveProject.client] : []) as any,
    reminders: effectiveProject?.reminders,
    invoices: effectiveProject?.invoices,
    currentUser,
  });

  const {
    name, setName,
    clientId,
    clientName,
    responsible, setResponsible,
    type, setType,
    start, setStart,
    deadline, setDeadline,
    progress, setProgress,
    done, setDone,
    notes, setNotes,
  } = formState;

  // Active Tab navigation
  const [activeTab, setActiveTab] = useState<'notes' | 'invoices' | 'reminders'>('notes');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('notes');
    }
  }, [isOpen, targetProjectId]);

  const invoiceCount = isCreate
    ? invoiceState.stagedInvoices?.length || 0
    : invoiceState.projectInvoices?.length || effectiveProject?.invoices?.length || 0;
  const reminderCount = isCreate
    ? reminderState.stagedReminders?.length || 0
    : reminderState.projectReminders?.length || effectiveProject?.reminders?.length || 0;

  // Auto-saving notes in view mode
  const prevProjectIdRef = useRef<string | undefined>(undefined);
  const lastSavedNotesRef = useRef(effectiveProject?.notes || '');
  const isAutoSavingRef = useRef(false);

  useEffect(() => {
    if (!targetProjectId) return;
    const effectiveNotes = effectiveProject?.notes;
    if (prevProjectIdRef.current !== targetProjectId) {
      prevProjectIdRef.current = targetProjectId;
      let initialVal = effectiveNotes || '';
      try {
        const savedDraft = localStorage.getItem(`ekos_draft_notes_${targetProjectId}`);
        if (savedDraft && savedDraft !== initialVal) {
          initialVal = savedDraft;
        }
      } catch {}
      if (initialVal && initialVal !== notes) {
        setNotes(initialVal);
      }
      lastSavedNotesRef.current = effectiveNotes || '';
    }
  }, [targetProjectId, effectiveProject?.notes]);

  const handleAutoSaveNotes = async (val: string) => {
    if (!targetProjectId) return;
    isAutoSavingRef.current = true;
    lastSavedNotesRef.current = val;
    try {
      const res = await handleSaveNote(targetProjectId, val);
      if (res && !res.success) {
        setErrorDialogState({ open: true, message: res.error || t('errorSavingProject') });
        throw new Error(res.error || t('errorSavingProject'));
      }
      try {
        localStorage.removeItem(`ekos_draft_notes_${targetProjectId}`);
      } catch {}
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } finally {
      isAutoSavingRef.current = false;
    }
  };

  // Permissions
  const isEditable = effectiveProject ? canEditProject(effectiveProject) : true;
  const isDeletable = effectiveProject ? canDeleteProject(effectiveProject) : false;
  const canEditProjectInvoices = canManageInvoices;

  // Save handler for edit / create modes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!clientName.trim() && !clientId)) {
      setErrorDialogState({
        open: true,
        message: t('alertProjectValidation'),
      });
      return;
    }

    if (!type) {
      setErrorDialogState({
        open: true,
        message: t('alertServiceRequired'),
      });
      return;
    }

    const finalResponsible = responsible || currentUser?.name || '';
    const finalProgress = done ? 100 : Math.max(0, Math.min(100, Number(progress) || 0));

    setIsSaving(true);
    try {
      const res = await onSave({
        ...(effectiveProject ? { id: effectiveProject.id } : {}),
        name: name.trim(),
        clientId: clientId || null,
        clientName: clientName.trim(),
        responsible: finalResponsible.trim() || null,
        type,
        start: start || null,
        deadline: deadline || null,
        progress: finalProgress,
        done,
        notes: notes.trim() || null,
      }, { silent: true });

      if (res && typeof res === 'object' && 'success' in res) {
        if (res.success) {
          const createdProjectId = res.id || (res.data && res.data.id) || (effectiveProject ? effectiveProject.id : null);

          if (isCreate && createdProjectId) {
            const { stagedReminders } = reminderState;
            const { stagedInvoices } = invoiceState;

            // Save staged reminders
            if (stagedReminders && stagedReminders.length > 0 && onSaveReminder) {
              for (const rem of stagedReminders) {
                try {
                  const savePayload = rem.isNewStaged
                    ? {
                        title: rem.title,
                        projectId: createdProjectId,
                        projectName: name.trim(),
                        clientId: clientId || null,
                        clientName: clientName.trim(),
                        responsible: rem.responsible || null,
                        dueDate: rem.dueDate || null,
                        notes: rem.notes || null,
                        status: rem.status || 'Pending',
                      }
                    : {
                        id: rem.id,
                        projectId: createdProjectId,
                        projectName: name.trim(),
                        clientId: clientId || rem.clientId || null,
                        clientName: clientName.trim() || rem.clientName,
                      };
                  await onSaveReminder(savePayload, { silent: true });
                } catch (err) {
                  console.error('Error saving staged reminder:', err);
                }
              }
            }

            // Save staged invoices
            if (stagedInvoices && stagedInvoices.length > 0 && onSaveInvoice) {
              for (const inv of stagedInvoices) {
                try {
                  const invPayload = inv.isNewStaged
                    ? {
                        invoiceNumber: inv.invoiceNumber,
                        invoiceType: inv.invoiceType,
                        parentInvoiceId: inv.parentInvoiceId || null,
                        projectId: createdProjectId,
                        projectName: name.trim(),
                        clientId: clientId || null,
                        clientName: clientName.trim(),
                        dateCreated: inv.dateCreated || null,
                        dueDate: inv.dueDate || null,
                        status: inv.status,
                        currency: inv.currency,
                        notes: inv.notes,
                        items: inv.items,
                        totalAmount: inv.totalAmount,
                      }
                    : {
                        id: inv.id,
                        projectId: createdProjectId,
                        projectName: name.trim(),
                        clientId: clientId || inv.clientId || null,
                        clientName: clientName.trim() || inv.clientName,
                      };
                  await onSaveInvoice(invPayload, { silent: true });
                } catch (err) {
                  console.error('Error saving staged invoice:', err);
                }
              }
            }
          }

          if (isEdit) {
            setMode('view');
          } else {
            onClose();
          }
        } else {
          setErrorDialogState({
            open: true,
            message: res.error || t('errorSavingProject'),
          });
        }
      } else {
        if (isEdit) {
          setMode('view');
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setErrorDialogState({
        open: true,
        message: err?.message || t('errorSavingProject'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Direct progress change in view mode
  const handleProgressChange = async (val: number) => {
    if (!effectiveProject || !onSave) return;
    const newDone = val >= 100;
    try {
      const res = await onSave({ ...effectiveProject, progress: val, done: newDone }, { silent: true });
      if (res && !res.success) {
        setErrorDialogState({ open: true, message: res.error || t('errorSavingProject') });
      }
    } catch (err: any) {
      setErrorDialogState({ open: true, message: err?.message || t('errorSavingProject') });
    }
  };

  // Diff rendering helper
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

  const clientObj = effectiveProject?.client || null;

  // Header Actions
  const extraHeaderActions = (
    <>
      {diffRange && isView && (
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
              ? (t) => alpha(t.palette.primary.main, 0.12)
              : 'transparent',
            color: !showDiffView ? 'primary.main' : 'text.primary',
            '&.Mui-selected': {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.15),
              color: 'primary.main',
              borderColor: 'primary.main',
              fontWeight: 700,
              '&:hover': {
                bgcolor: (t) => alpha(t.palette.primary.main, 0.22),
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

      {effectiveProject && isView && (
        <Button
          color="inherit"
          variant="outlined"
          size="small"
          onClick={() => setIsHistoryOpen(true)}
          startIcon={<HistoryIcon />}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, height: 32 }}
        >
          {t('btnHistory')}
        </Button>
      )}

      {isEditable && (
        <Button
          color={(isView ? effectiveProject?.done : done) ? 'success' : 'inherit'}
          variant={(isView ? effectiveProject?.done : done) ? 'contained' : 'outlined'}
          size="small"
          disabled={isView && showDiffView}
          onClick={() => {
            if (isView && effectiveProject) {
              toggleDoneMutation.mutate({
                id: effectiveProject.id,
                isCompleting: !effectiveProject.done,
              });
            } else {
              const newDone = !done;
              setDone(newDone);
              if (newDone) setProgress(100);
            }
          }}
          startIcon={
            <Checkbox
              checked={Boolean(isView ? effectiveProject?.done : done)}
              size="small"
              sx={{
                p: 0,
                color: (isView ? effectiveProject?.done : done) ? 'inherit' : 'action.active',
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
            height: 32,
            bgcolor: (isView ? effectiveProject?.done : done) ? 'success.main' : 'transparent',
            color: (isView ? effectiveProject?.done : done) ? 'success.contrastText' : 'text.primary',
            borderColor: (isView ? effectiveProject?.done : done) ? 'success.main' : 'divider',
            '&:hover': {
              bgcolor: (isView ? effectiveProject?.done : done) ? 'success.dark' : 'action.hover',
              borderColor: (isView ? effectiveProject?.done : done) ? 'success.dark' : 'text.secondary',
            },
          }}
        >
          {t('btnMarkDone')}
        </Button>
      )}
    </>
  );

  return (
    <>
      <ViewEditModalBase
        open={isOpen}
        onClose={onClose}
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          if (newMode === 'edit' && effectiveProject && onEdit) {
            onEdit(effectiveProject);
          }
        }}
        title={(currentMode) => {
          if (currentMode === 'view') return t('modalViewProject');
          if (currentMode === 'edit') return t('modalEditProject');
          return t('modalNewProject');
        }}
        canEdit={isEditable}
        canDelete={isDeletable}
        onDelete={
          effectiveProject
            ? () => {
                wrappedOnDelete(effectiveProject.id);
                onClose();
              }
            : undefined
        }
        isSaving={isSaving}
        isLoading={Boolean(diffRange && isDiffFetching)}
        onSave={handleSubmit}
        extraHeaderActions={extraHeaderActions}
        editLabel={t('modalEditProject')}
      >
        <Grid container spacing={isView ? 1.25 : 2}>
          {/* PROJECT NAME */}
          <Grid size={{ xs: 12 }}>
            <ViewEditField
              mode={mode}
              label={t('lblProjectName')}
              value={effectiveProject?.name || name}
              diffBadge={renderFieldDiff('name')}
              editRender={() => (
                <TextField
                  fullWidth
                  label={t('lblProjectName')}
                  placeholder={t('phProjectName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  variant="outlined"
                  size="small"
                />
              )}
            />
          </Grid>

          {/* CLIENT */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <ViewEditField
              mode={mode}
              label={t('lblClient')}
              value={effectiveProject?.clientName || clientName}
              diffBadge={renderFieldDiff('clientName')}
              viewRender={(val) => (
                <>
                  {val || '—'}
                  {clientObj?.city && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                      ({clientObj.city})
                    </Typography>
                  )}
                </>
              )}
              editRender={() => (
                <ClientAutocomplete
                  value={clientId}
                  initialOption={
                    effectiveProject?.client ||
                    (clientId ? ({ id: clientId, name: clientName } as any) : null)
                  }
                  onChange={(id, opt) => handleClientSelectChange(id || '', opt)}
                  required
                  showCity
                />
              )}
            />
          </Grid>

          {/* RESPONSIBLE */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <ViewEditField
              mode={mode}
              label={getResponsibleLabel(effectiveProject?.responsibleUser || effectiveProject?.responsible || responsible)}
              value={effectiveProject?.responsible || responsible}
              diffBadge={renderFieldDiff('responsible', (r) => getResponsibleLabel(r))}
              editRender={() => (
                <UserAutocomplete
                  value={responsible}
                  initialOption={
                    effectiveProject?.responsibleUser ||
                    (responsible ? ({ id: effectiveProject?.responsibleId || responsible, name: responsible } as any) : null)
                  }
                  valueMode="name"
                  onChange={(val) => setResponsible(val || '')}
                  restrictedPermission="projects"
                />
              )}
            />
          </Grid>

          {/* SERVICE TYPE */}
          <Grid size={{ xs: 12, sm: isView ? 4 : 4 }}>
            <ViewEditField
              mode={mode}
              label={t('lblService')}
              value={effectiveProject?.serviceName || effectiveProject?.service?.name || getServiceLabel(effectiveProject?.type || type)}
              diffBadge={renderFieldDiff('type', (tp) => effectiveProject?.serviceName || getServiceLabel(tp))}
              editRender={() => (
                <ServiceAutocomplete
                  value={type}
                  initialOption={
                    effectiveProject?.service ||
                    (type ? ({ code: type, name: effectiveProject?.serviceName || getServiceLabel(type) } as any) : null)
                  }
                  valueMode="code"
                  onChange={(val) => setType(val || '')}
                  required
                />
              )}
            />
          </Grid>

          {/* DATES */}
          <Grid size={{ xs: 12, sm: isView ? 4 : 6 }}>
            <ViewEditField
              mode={mode}
              label={t('lblStartDate')}
              value={effectiveProject?.start || start}
              diffBadge={renderFieldDiff('start')}
              editRender={() => (
                <TextField
                  fullWidth
                  type="date"
                  label={t('lblStartDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  size="small"
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: isView ? 4 : 6 }}>
            <ViewEditField
              mode={mode}
              label={t('lblDeadlineDate')}
              value={effectiveProject?.deadline || deadline}
              diffBadge={renderFieldDiff('deadline')}
              editRender={() => (
                <TextField
                  fullWidth
                  type="date"
                  label={t('lblDeadlineDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  size="small"
                />
              )}
            />
          </Grid>

          {/* PROGRESS SLIDER */}
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
                  value={isView ? (effectiveProject?.progress || 0) : progress}
                  label={t('progress')}
                  disabled={isView && (!isEditable || showDiffView)}
                  onChangeCommitted={(val) => {
                    if (isView) {
                      handleProgressChange(val);
                    } else {
                      setProgress(val);
                      if (val >= 100) setDone(true);
                      else if (val < 100 && done) setDone(false);
                    }
                  }}
                  compact
                />
              </Box>
              {isView && showDiffView && (fieldDiffs.progress || fieldDiffs.done) && (
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
                      {isView && showDiffView && diffRange && hasNoteChanges && (
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
                      {isView && showDiffView && updatesDiff?.invoices && updatesDiff.invoices.length > 0 && (
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
                      {isView && showDiffView && updatesDiff?.reminders && updatesDiff.reminders.length > 0 && (
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
                  {isView && showDiffView && diffRange && hasNoteChanges && (
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

              {isView && showDiffView && diffRange && hasNoteChanges ? (
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
                    const text = stripHtmlToText(token.text);
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
              ) : isView && !showDiffView && isEditable ? (
                <TipTapEditor
                  value={notes}
                  onChange={(val) => {
                    setNotes(val);
                    try {
                      if (targetProjectId) {
                        localStorage.setItem(`ekos_draft_notes_${targetProjectId}`, val);
                      }
                    } catch {}
                  }}
                  onAutoSave={handleAutoSaveNotes}
                  autoSaveEnabled={true}
                  placeholder={t('phProjectNotes')}
                  minHeight={150}
                />
              ) : isView ? (
                <TipTapEditor
                  value={notes}
                  readOnly={true}
                  autoSaveEnabled={false}
                  minHeight={150}
                />
              ) : (
                <TipTapEditor
                  value={notes}
                  onChange={setNotes}
                  placeholder={t('phProjectNotes')}
                  autoSaveEnabled={false}
                  minHeight={150}
                />
              )}
            </Paper>
          </Grid>

          {/* TAB 2: INVOICES */}
          <Grid size={{ xs: 12 }} sx={{ display: activeTab === 'invoices' ? 'block' : 'none' }}>
            <ProjectInvoiceSection
              projectToEdit={effectiveProject}
              projectName={effectiveProject?.name || name}
              clientId={effectiveProject?.clientId || clientId}
              clientName={effectiveProject?.clientName || clientName}
              invoices={isCreate ? invoiceState.stagedInvoices : (effectiveProject?.invoices || invoiceState.projectInvoices)}
              onSaveInvoice={onSaveInvoice}
              onDeleteInvoice={wrappedOnDeleteInvoice}
              onStatusChangeInvoice={onStatusChangeInvoice}
              setErrorDialogState={setErrorDialogState}
              disabled={isView && (!canEditProjectInvoices || showDiffView)}
              invoiceState={invoiceState}
            />
          </Grid>

          {/* TAB 3: REMINDERS */}
          <Grid size={{ xs: 12 }} sx={{ display: activeTab === 'reminders' ? 'block' : 'none' }}>
            {isView && showDiffView && updatesDiff?.reminders && updatesDiff.reminders.length > 0 && (
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
              projectToEdit={effectiveProject}
              projectName={effectiveProject?.name || name}
              clientId={effectiveProject?.clientId || clientId}
              clientName={effectiveProject?.clientName || clientName}
              responsible={effectiveProject?.responsible || responsible}
              reminders={isCreate ? reminderState.stagedReminders : (effectiveProject?.reminders || reminderState.projectReminders)}
              onSaveReminder={onSaveReminder}
              onDeleteReminder={wrappedOnDeleteReminder}
              onStatusChangeReminder={onStatusChangeReminder}
              setErrorDialogState={setErrorDialogState}
              disabled={isView && (!isEditable || showDiffView)}
              reminderState={reminderState}
            />
          </Grid>
        </Grid>
      </ViewEditModalBase>

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
          setDeleteConfirmState((prev) => ({ ...prev, open: false }));
        }}
        onClose={() => setDeleteConfirmState((prev) => ({ ...prev, open: false }))}
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

export default ProjectModal;
