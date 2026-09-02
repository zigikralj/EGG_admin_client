import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  Button,
  Grid,
  Typography,
  Box,
  Paper,
  Autocomplete,
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
import { DeleteIcon, SaveIcon, CloseIcon, NotesIcon } from './icons';
interface Props {
  isOpen: boolean;
  projectToEdit: Project | null;
  clients: Client[];
  users: User[];
  services: Service[];
  reminders?: Reminder[];
  invoices?: Invoice[];
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<SaveResult | void> | void;
  onDelete?: (id: string) => void;
  onToggleDone?: (id: string) => void;
  onSaveReminder?: (reminder: Partial<Reminder>) => Promise<SaveResult | void> | void;
  onDeleteReminder?: (id: string) => void;
  onStatusChangeReminder?: (id: string, status: string) => void;
  onSaveInvoice?: (invoice: Partial<Invoice>) => Promise<SaveResult | void> | void;
  onDeleteInvoice?: (id: string) => void;
  onStatusChangeInvoice?: (id: string, status: string, paymentDate?: string) => Promise<void> | void;
}

const ProjectModal: React.FC<Props> = ({
  isOpen,
  projectToEdit,
  clients,
  users,
  services,
  reminders = [],
  invoices = [],
  onClose,
  onSave,
  onDelete,
  onSaveReminder,
  onDeleteReminder,
  onStatusChangeReminder,
  onSaveInvoice,
  onDeleteInvoice,
  onStatusChangeInvoice,
}) => {
  const { t, getServiceLabel, getResponsibleLabel } = useLanguage();
  const { currentUser, canEditProject, isUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const { formState, reminderState, invoiceState, handleClientSelectChange } = useProjectForm({
    projectToEdit,
    clients,
    users,
    services,
    reminders,
    invoices,
    currentUser,
    isUser,
  });

  const {
    name, setName,
    clientId,
    clientName, setClientName,
    responsible, setResponsible,
    type, setType,
    start, setStart,
    deadline, setDeadline,
    progress, setProgress,
    done, setDone,
    notes, setNotes,
  } = formState;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!clientName.trim() && !clientId)) {
      setErrorDialogState({
        open: true,
        message: t('alertProjectValidation'),
      });
      return;
    }

    const finalResponsible = isUser ? (currentUser?.name || responsible) : responsible;
    const finalProgress = done ? 100 : Math.max(0, Math.min(100, Number(progress) || 0));

    setIsSaving(true);
    try {
      const res = await onSave({
        ...(projectToEdit ? { id: projectToEdit.id } : {}),
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
      });

      if (res && typeof res === 'object' && 'success' in res) {
        if (res.success) {
          onClose();
        } else {
          setErrorDialogState({
            open: true,
            message: res.error || t('errorSavingProject'),
          });
        }
      } else {
        onClose();
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

  if (!isOpen) return null;

  const isEditable = projectToEdit ? canEditProject(projectToEdit) : true;

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            component: 'form',
            onSubmit: handleSubmit,
            sx: {
              maxHeight: 'calc(100% - 64px)',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {projectToEdit ? t('modalEditProject') : t('modalNewProject')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {isEditable && (
              <Button
                color={done ? 'success' : 'inherit'}
                variant={done ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  const newDone = !done;
                  setDone(newDone);
                  if (newDone) setProgress(100);
                }}
                startIcon={
                  <Checkbox
                    checked={done}
                    size="small"
                    sx={{
                      p: 0,
                      color: done ? 'inherit' : 'action.active',
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
                  bgcolor: done ? 'success.main' : 'transparent',
                  color: done ? 'success.contrastText' : 'text.primary',
                  borderColor: done ? 'success.main' : 'divider',
                  '&:hover': {
                    bgcolor: done ? 'success.dark' : 'action.hover',
                    borderColor: done ? 'success.dark' : 'text.secondary',
                  },
                }}
              >
                {t('btnMarkDone')}
              </Button>
            )}

            {projectToEdit && isEditable && onDelete && (
              <Button
                color="error"
                variant="outlined"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  onDelete(projectToEdit.id);
                  onClose();
                }}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
              >
                {t('btnDelete')}
              </Button>
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
            <Grid container spacing={2}>
              {/* PROJECT NAME */}
              <Grid size={{ xs: 12 }}>
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
              </Grid>

              {/* CLIENT */}
              <Grid size={{ xs: 12, sm: 6 }}>
                {clients.length > 0 ? (
                  <Autocomplete
                    size="small"
                    options={clients}
                    getOptionLabel={(option) => `${option.name}${option.city ? ` (${option.city})` : ''}`}
                    value={clients.find((c) => c.id === clientId) || null}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        handleClientSelectChange(newValue.id);
                      }
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('lblClient')}
                        required
                      />
                    )}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label={t('lblClient')}
                    placeholder={t('phClient')}
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    size="small"
                  />
                )}
              </Grid>

              {/* RESPONSIBLE */}
              <Grid size={{ xs: 12, sm: 6 }}>
                {(() => {
                  const respLabel = getResponsibleLabel(responsible || (isUser ? currentUser?.name : ''), users);
                  const selectableUsers = users.filter((u) => {
                    const isSelected = Boolean(responsible) && u.name.trim().toLowerCase() === responsible.trim().toLowerCase();
                    if (isSelected) return true;
                    const isBlocked = u.status === 'BLOCKED' || u.status?.toLowerCase() === 'blocked' || (u.isApproved === false && u.status !== 'PENDING');
                    if (isBlocked) return false;
                    if (u.role === 'Administrator') return false;
                    return true;
                  });
                  return isUser ? (
                    <TextField
                      fullWidth
                      label={respLabel}
                      value={currentUser?.name || ''}
                      disabled
                      size="small"
                    />
                  ) : users.length > 0 ? (
                    <Autocomplete
                      key={respLabel}
                      size="small"
                      options={selectableUsers}
                      getOptionLabel={(u) => {
                        const isMe = currentUser?.name && u.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
                        return `${isMe ? `${t('lblMe')} (${u.name})` : u.name} (${u.role})`;
                      }}
                      value={selectableUsers.find((u) => u.name === responsible) || null}
                      onChange={(_, newValue) => {
                        setResponsible(newValue ? newValue.name : '');
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={respLabel}
                        />
                      )}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      label={respLabel}
                      placeholder={t('phResponsiblePerson')}
                      value={responsible}
                      onChange={(e) => setResponsible(e.target.value)}
                      size="small"
                    />
                  );
                })()}
              </Grid>

              {/* SERVICE TYPE */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  size="small"
                  options={services}
                  getOptionLabel={(option) => option.name || getServiceLabel(option.code, services)}
                  value={services.find((s) => s.code === type) || null}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setType(newValue.code);
                    }
                  }}
                  isOptionEqualToValue={(option, value) => option.code === value.code}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('lblService')}
                    />
                  )}
                />
              </Grid>

              {/* DATES */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('lblStartDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('lblDeadlineDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  size="small"
                />
              </Grid>

              {/* PROGRESS (100% WIDTH SLIDER) */}
              <Grid size={{ xs: 12 }}>
                <ProjectProgressSlider
                  value={progress}
                  label={t('progress')}
                  onChangeCommitted={(val) => {
                    setProgress(val);
                    if (val >= 100) setDone(true);
                    else if (val < 100 && done) setDone(false);
                  }}
                />
              </Grid>

              {/* REMINDERS SECTION */}
              <Grid size={{ xs: 12 }}>
                <ProjectReminderSection
                  projectToEdit={projectToEdit}
                  projectName={name}
                  clientId={clientId}
                  clientName={clientName}
                  responsible={responsible}
                  users={users}
                  reminders={reminders}
                  onSaveReminder={onSaveReminder}
                  onDeleteReminder={onDeleteReminder}
                  onStatusChangeReminder={onStatusChangeReminder}
                  setErrorDialogState={setErrorDialogState}
                  reminderState={reminderState}
                />
              </Grid>

              {/* INVOICES SECTION */}
              <Grid size={{ xs: 12 }}>
                <ProjectInvoiceSection
                  projectToEdit={projectToEdit}
                  projectName={name}
                  clientId={clientId}
                  clientName={clientName}
                  invoices={invoices}
                  onSaveInvoice={onSaveInvoice}
                  onDeleteInvoice={onDeleteInvoice}
                  onStatusChangeInvoice={onStatusChangeInvoice}
                  setErrorDialogState={setErrorDialogState}
                  invoiceState={invoiceState}
                />
              </Grid>

              {/* PROJECT NOTES RICH TEXT EDITOR */}
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <NotesIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('lblProjectNotes')}
                    </Typography>
                  </Box>
                  <RichTextEditor
                    value={notes}
                    onChange={setNotes}
                    users={users}
                    placeholder={t('phProjectNotes')}
                    minHeight={150}
                  />
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose} variant="outlined" color="inherit" disabled={isSaving}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={isSaving}>
              {isSaving ? '...' : t('btnSave')}
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

export default ProjectModal;
