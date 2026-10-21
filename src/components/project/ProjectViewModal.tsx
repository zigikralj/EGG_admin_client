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
  Tooltip,
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
import { EditIcon, CloseIcon, NotesIcon, HistoryIcon } from '../icons';
import { ConfirmDialog } from '../dialogs/ConfirmDialog';
import { HistoryTimelineModal } from '../history';
import { NoteHistoryDiffModal } from '../history/NoteHistoryDiffModal';
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
} from '../../queries';

interface Props {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onEdit: (project: Project) => void;
}

const ProjectViewModal: React.FC<Props> = ({
  isOpen,
  project,
  onClose,
  onEdit,
}) => {
  const { data: clients = [] } = useClientsQuery();
  const { data: users = [] } = useUsersQuery();
  const { data: services = [] } = useServicesQuery();
  const { data: reminders = [] } = useRemindersQuery();
  const { data: invoices = [] } = useInvoicesQuery();
  const { handleSave: onSave, handleSaveNotes: _handleSaveNotes, handleSaveNote, toggleDoneMutation } = useProjectsMutations();
  const { handleSave: onSaveReminder, handleDelete: onDeleteReminder, handleStatusChangeReminder: onStatusChangeReminder } = useRemindersMutations();
  const { handleSave: onSaveInvoice, handleDelete: onDeleteInvoice, handleUpdateInvoiceStatus: _onStatusChangeInvoice } = useInvoicesMutations();
  const [isNoteHistoryOpen, setIsNoteHistoryOpen] = useState(false);

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
        if (curr === lastSavedNotesRef.current) {
          lastSavedNotesRef.current = effectiveProjectNotes || '';
          return effectiveProjectNotes || '';
        }
        return curr;
      });
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
      <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('modalViewProject')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {isEditable && (
              <>
                <Button
                  color={project.done ? 'success' : 'inherit'}
                  variant={project.done ? 'contained' : 'outlined'}
                  size="small"
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

        <DialogContent dividers sx={{ pt: 2 }}>
          <Grid container spacing={1.25}>
            {/* PROJECT NAME */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {t('lblProjectName')}:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem' }}>
                  {project.name}
                </Typography>
              </Box>
            </Grid>

            {/* CLIENT */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {t('lblClient')}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {project.clientName || '—'}
                  {clientObj?.city && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                      ({clientObj.city})
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Grid>

            {/* RESPONSIBLE */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {getResponsibleLabel(project.responsible, users)}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {project.responsible || '—'}
                </Typography>
              </Box>
            </Grid>

            {/* SERVICE TYPE */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {t('lblService')}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {getServiceLabel(project.type, services)}
                </Typography>
              </Box>
            </Grid>

            {/* DATES */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {t('lblStartDate')}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {project.start || '—'}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ py: 0.75, px: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {t('lblDeadlineDate')}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: project.deadline ? 'text.primary' : 'text.secondary' }}>
                  {project.deadline || '—'}
                </Typography>
              </Box>
            </Grid>

            {/* PROGRESS (INTERACTIVE SLIDER) */}
            <Grid size={{ xs: 12 }}>
              <ProjectProgressSlider
                value={project.progress}
                label={t('progress')}
                disabled={!isEditable}
                onChangeCommitted={handleProgressChange}
              />
            </Grid>

            {/* REMINDERS SECTION */}
            <Grid size={{ xs: 12 }}>
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
                disabled={!isEditable}
                reminderState={reminderState}
              />
            </Grid>


            {/* INVOICES SECTION */}
            <Grid size={{ xs: 12 }}>
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
                disabled={!canEditProjectInvoices}
                invoiceState={invoiceState}
              />
            </Grid>

            {/* PROJECT NOTES - RICH TEXT WITH DIRECT AUTO-SAVE */}
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotesIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('lblProjectNotes')}
                    </Typography>
                  </Box>
                  <Tooltip title={t('noteHistoryAndDiff') || 'Istorija i poređenje beleški'}>
                    <IconButton
                      size="small"
                      onClick={() => setIsNoteHistoryOpen(true)}
                      sx={{
                        color: 'primary.main',
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(25, 118, 210, 0.08)',
                        '&:hover': {
                          bgcolor: (theme) =>
                            theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.24)' : 'rgba(25, 118, 210, 0.16)',
                        },
                      }}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {isEditable ? (
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
                    onOpenHistory={() => setIsNoteHistoryOpen(true)}
                    minHeight={160}
                  />
                ) : (
                  <TipTapEditor
                    value={notes}
                    readOnly
                    users={users}
                    onOpenHistory={() => setIsNoteHistoryOpen(true)}
                    minHeight={100}
                  />
                )}
              </Paper>
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

      {isNoteHistoryOpen && effectiveProjectId && (
        <NoteHistoryDiffModal
          open={isNoteHistoryOpen}
          onClose={() => setIsNoteHistoryOpen(false)}
          projectId={effectiveProjectId}
          projectName={effectiveProject?.name || ''}
        />
      )}
    </>
  );
};

export default ProjectViewModal;
