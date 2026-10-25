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
  Tabs,
  Tab,
  Chip,
  useTheme,
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
  DeleteIcon,
  SaveIcon,
  CloseIcon,
  NotesIcon,
  ReceiptLongIcon,
  NotificationsActiveIcon,
} from '../icons';
import { ConfirmDialog } from '../dialogs/ConfirmDialog';
import { useClientsSummaryQuery, useUsersSummaryQuery, useServicesQuery, useRemindersQuery, useInvoicesQuery, useProjectsMutations, useRemindersMutations, useInvoicesMutations, useProjectDetailsQuery } from '../../queries';

interface Props {
  isOpen: boolean;
  projectToEdit: Project | null;
  onClose: () => void;
}

const ProjectModal: React.FC<Props> = ({
  isOpen,
  projectToEdit,
  onClose,
}) => {
  const { data: clients = [] } = useClientsSummaryQuery({ enabled: isOpen });
  const { data: users = [] } = useUsersSummaryQuery({ enabled: isOpen });
  const { data: services = [] } = useServicesQuery({ enabled: isOpen });
  const { data: reminders = [] } = useRemindersQuery({ enabled: isOpen });
  const { data: invoices = [] } = useInvoicesQuery({ enabled: isOpen });
  const { handleSave: onSave, handleDelete: onDelete } = useProjectsMutations();
  const { handleSave: onSaveReminder, handleDelete: onDeleteReminder, handleStatusChangeReminder: onStatusChangeReminder } = useRemindersMutations();
  const { handleSave: onSaveInvoice, handleDelete: onDeleteInvoice, handleUpdateInvoiceStatus: _onStatusChangeInvoice } = useInvoicesMutations();

  const { data: projectDetails } = useProjectDetailsQuery(
    projectToEdit?.id,
    isOpen && Boolean(projectToEdit?.id)
  );

  const effectiveProjectToEdit = React.useMemo(() => {
    if (!projectToEdit) return null;
    return projectDetails ? { ...projectToEdit, ...projectDetails } : projectToEdit;
  }, [projectToEdit, projectDetails]);

  const onStatusChangeInvoice = async (id: string, status: string, paymentDate?: string) => {
    await _onStatusChangeInvoice(id, status, paymentDate);
  };

  const { t, getServiceLabel, getResponsibleLabel } = useLanguage();
  const { currentUser, canEditProject, canDeleteProject, isRestrictedToOwn } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const wrapDelete = (delFn: (id: string, confirm: (msg: string, cb: () => void) => void) => void) => (id: string) => {
    delFn(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));
  };

  const wrappedOnDelete = wrapDelete(onDelete);
  const wrappedOnDeleteReminder = wrapDelete(onDeleteReminder);
  const wrappedOnDeleteInvoice = wrapDelete(onDeleteInvoice);

  const { formState, reminderState, invoiceState, handleClientSelectChange } = useProjectForm({
    projectToEdit: effectiveProjectToEdit,
    clients,
    reminders,
    invoices,
    currentUser,
  });

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState<'notes' | 'invoices' | 'reminders'>('notes');

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('notes');
    }
  }, [isOpen, projectToEdit?.id]);

  const invoiceCount = invoiceState.projectInvoices?.length || 0;
  const reminderCount = reminderState.projectReminders?.length || 0;

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
      }, { silent: true });

      if (res && typeof res === 'object' && 'success' in res) {
        if (res.success) {
          const createdProjectId = res.id || (res.data && res.data.id) || (projectToEdit ? projectToEdit.id : null);

          if (!projectToEdit && createdProjectId) {
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
                } catch (e) {
                  console.error('Error saving staged reminder:', e);
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
                } catch (e) {
                  console.error('Error saving staged invoice:', e);
                }
              }
            }
          }

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
  const isDeletable = projectToEdit ? canDeleteProject(projectToEdit) : false;

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
              height: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
              maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, pb: 1, flexShrink: 0 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
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

            {projectToEdit && isDeletable && (
              <Button
                color="error"
                variant="outlined"
                size="small"
                onClick={() => {
                  wrappedOnDelete(projectToEdit.id);
                  onClose();
                }}
                startIcon={<DeleteIcon />}
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

          <DialogContent dividers sx={{ pt: 2, flex: 1, overflowY: 'auto' }}>
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
                      handleClientSelectChange(newValue ? newValue.id : '');
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('lblClient')}
                        placeholder={t('phClient')}
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
                  const respLabel = getResponsibleLabel(responsible || currentUser?.name || '', users);
                  const isUserProjectRestricted = isRestrictedToOwn('projects') || isRestrictedToOwn('tracker_projects');
                  const selectableUsers = users.filter((u) => {
                    const isMe = Boolean(currentUser?.name) && u.name.trim().toLowerCase() === currentUser?.name?.trim().toLowerCase();
                    if (isUserProjectRestricted) return isMe;
                    const isSelected = Boolean(responsible) && u.name.trim().toLowerCase() === responsible.trim().toLowerCase();
                    if (isSelected || isMe) return true;
                    const isBlocked = u.status === 'BLOCKED' || u.status?.toLowerCase() === 'blocked' || (u.isApproved === false && u.status !== 'PENDING');
                    if (isBlocked) return false;
                    if (u.role === 'Administrator' || u.roleEntity?.isSystemAdmin) return false;
                    return true;
                  });
                  return users.length > 0 ? (
                    <Autocomplete
                      key={respLabel}
                      size="small"
                      disabled={isUserProjectRestricted}
                      options={selectableUsers}
                      getOptionLabel={(u) => {
                        const isMe = currentUser?.name && u.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
                        return `${isMe ? `${t('lblMe')} (${u.name})` : u.name} (${u.role})`;
                      }}
                      value={selectableUsers.find((u) => u.name === responsible) || (isUserProjectRestricted && currentUser ? selectableUsers.find((u) => u.name === currentUser.name) || null : null)}
                      onChange={(_, newValue) => {
                        setResponsible(newValue ? newValue.name : '');
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={respLabel}
                          placeholder={currentUser?.name || ''}
                        />
                      )}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      disabled={isUserProjectRestricted}
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
                    setType(newValue ? newValue.code : '');
                  }}
                  isOptionEqualToValue={(option, value) => option.code === value.code}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('lblService')}
                      required
                    />
                  )}
                />
              </Grid>

              {/* DATES */}
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
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

              {/* PROGRESS (COMPACT SLIDER) */}
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
                    minHeight: 38,
                  }}
                >
                  <ProjectProgressSlider
                    value={progress}
                    label={t('progress')}
                    onChangeCommitted={(val) => {
                      setProgress(val);
                      if (val >= 100) setDone(true);
                      else if (val < 100 && done) setDone(false);
                    }}
                    compact
                  />
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
                      label={t('lblProjectNotes')}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <NotesIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('lblProjectNotes')}
                    </Typography>
                  </Box>
                  <TipTapEditor
                    value={notes}
                    onChange={setNotes}
                    placeholder={t('phProjectNotes')}
                    autoSaveEnabled={false}
                    minHeight={150}
                  />
                </Paper>
              </Grid>

              {/* TAB 2: INVOICES */}
              <Grid size={{ xs: 12 }} sx={{ display: activeTab === 'invoices' ? 'block' : 'none' }}>
                <ProjectInvoiceSection
                  projectToEdit={projectToEdit}
                  projectName={name}
                  clientId={clientId}
                  clientName={clientName}
                  invoices={invoices}
                  onSaveInvoice={onSaveInvoice}
                  onDeleteInvoice={wrappedOnDeleteInvoice}
                  onStatusChangeInvoice={onStatusChangeInvoice}
                  setErrorDialogState={setErrorDialogState}
                  invoiceState={invoiceState}
                />
              </Grid>

              {/* TAB 3: REMINDERS */}
              <Grid size={{ xs: 12 }} sx={{ display: activeTab === 'reminders' ? 'block' : 'none' }}>
                <ProjectReminderSection
                  projectToEdit={projectToEdit}
                  projectName={name}
                  clientId={clientId}
                  clientName={clientName}
                  responsible={responsible}
                  reminders={reminders}
                  onSaveReminder={onSaveReminder}
                  onDeleteReminder={wrappedOnDeleteReminder}
                  onStatusChangeReminder={onStatusChangeReminder}
                  setErrorDialogState={setErrorDialogState}
                  reminderState={reminderState}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, flexShrink: 0 }}>
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
    </>
  );
};

export default ProjectModal;
