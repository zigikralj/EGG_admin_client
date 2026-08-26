import React, { useState } from 'react';
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
} from '@mui/material';

import type { Project, Client, User, Service, Reminder, SaveResult, Invoice } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ErrorDialog } from './ErrorDialog';
import { RichTextEditor } from './RichTextEditor';
import { ProjectProgressSlider } from './project/ProjectProgressSlider';
import { ProjectReminderSection } from './project/ProjectReminderSection';
import { ProjectInvoiceSection } from './project/ProjectInvoiceSection';
import { useProjectForm } from '../hooks/useProjectForm';
import { SaveIcon, EditIcon, CloseIcon, NotesIcon } from './icons';
interface Props {
  isOpen: boolean;
  project: Project | null;
  clients: Client[];
  users: User[];
  services: Service[];
  reminders?: Reminder[];
  invoices?: Invoice[];
  onClose: () => void;
  onEdit: (project: Project) => void;
  onSave?: (data: Partial<Project>) => Promise<SaveResult | void> | void;
  onToggleDone?: (id: string) => void;
  onSaveReminder?: (reminder: Partial<Reminder>) => Promise<SaveResult | void> | void;
  onDeleteReminder?: (id: string) => void;
  onStatusChangeReminder?: (id: string, status: string) => void;
  onSaveInvoice?: (invoice: Partial<Invoice>) => Promise<SaveResult | void> | void;
  onDeleteInvoice?: (id: string) => void;
  onStatusChangeInvoice?: (id: string, status: string, paymentDate?: string) => Promise<void> | void;
}

const ProjectViewModal: React.FC<Props> = ({
  isOpen,
  project,
  clients,
  users,
  services,
  reminders = [],
  invoices = [],
  onClose,
  onEdit,
  onSave,
  onToggleDone,
  onSaveReminder,
  onDeleteReminder,
  onStatusChangeReminder,
  onSaveInvoice,
  onDeleteInvoice,
  onStatusChangeInvoice,
}) => {
  const { t, getServiceLabel, getResponsibleLabel } = useLanguage();
  const { currentUser, canEditProject, canManageInvoices } = useAuth();
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Local state for editable notes
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesModified, setNotesModified] = useState(false);

  const { reminderState, invoiceState } = useProjectForm({
    projectToEdit: project,
    clients,
    users,
    services,
    reminders,
    invoices,
    currentUser,
    isUser: false,
  });


  if (!isOpen || !project) return null;

  const clientObj = clients.find((c) => c.id === project.clientId || c.name === project.clientName);

  const isEditable = project ? canEditProject(project) : false;
  const canEditProjectInvoices = canManageInvoices;

  const handleProgressChange = async (val: number) => {
    if (!project || !onSave) return;
    const newDone = val >= 100;
    try {
      const res = await onSave({ ...project, progress: val, done: newDone });
      if (res && !res.success) {
        setErrorDialogState({ open: true, message: res.error || t('errorSavingProject') });
      }
    } catch (err: any) {
      setErrorDialogState({ open: true, message: err?.message || t('errorSavingProject') });
    }
  };

  const handleSaveNotes = async () => {
    if (!project || !onSave) return;
    setIsSavingNotes(true);
    try {
      const res = await onSave({ ...project, notes });
      if (res && !res.success) {
        setErrorDialogState({ open: true, message: res.error || t('errorSavingProject') });
      } else {
        setNotesModified(false);
      }
    } catch (err: any) {
      setErrorDialogState({ open: true, message: err?.message || t('errorSavingProject') });
    } finally {
      setIsSavingNotes(false);
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
                onDeleteReminder={onDeleteReminder}
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
                onDeleteInvoice={onDeleteInvoice}
                onStatusChangeInvoice={onStatusChangeInvoice}
                setErrorDialogState={setErrorDialogState}
                disabled={!canEditProjectInvoices}
                invoiceState={invoiceState}
              />
            </Grid>

            {/* PROJECT NOTES - RICH TEXT WITH DIRECT EDIT/SAVE */}
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotesIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('lblProjectNotes')}
                    </Typography>
                  </Box>
                  {isEditable && notesModified && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      sx={{ textTransform: 'none', fontWeight: 600, py: 0.25, px: 1.5 }}
                    >
                      {isSavingNotes ? '...' : t('btnSave')}
                    </Button>
                  )}
                </Box>
                {isEditable ? (
                  <RichTextEditor
                    value={notes}
                    onChange={(val) => {
                      setNotes(val);
                      setNotesModified(true);
                    }}
                    placeholder={t('phProjectNotes')}
                    minHeight={150}
                  />
                ) : (
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      minHeight: 80,
                      maxHeight: 250,
                      overflowY: 'auto',
                      fontSize: '0.875rem',
                      '& p': { m: 0, mb: 0.5 },
                      '& ul, & ol': { m: 0, pl: 2.5 },
                      '& blockquote': { m: 0, pl: 1.5, borderLeft: '3px solid', borderColor: 'primary.main' },
                    }}
                    dangerouslySetInnerHTML={{ __html: notes || `<span style="color: grey; font-style: italic;">${t('noProjectNotes')}</span>` }}
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
        onClose={() => setErrorDialogState((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
};

export default ProjectViewModal;
