import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Grid,
  Typography,
  Box,
  Paper,
  Autocomplete,
  IconButton,
  Tooltip,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotesIcon from '@mui/icons-material/Notes';
import type { Project, Client, User, Service, Reminder, SaveResult } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ErrorDialog } from './ErrorDialog';
import { RichTextEditor } from './RichTextEditor';

interface Props {
  isOpen: boolean;
  projectToEdit: Project | null;
  clients: Client[];
  users: User[];
  services: Service[];
  reminders?: Reminder[];
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<SaveResult | void> | void;
  onDelete?: (id: string) => void;
  onToggleDone?: (id: string) => void;
  onSaveReminder?: (reminder: Partial<Reminder>) => Promise<SaveResult | void> | void;
  onDeleteReminder?: (id: string) => void;
  onStatusChangeReminder?: (id: string, status: string) => void;
}

export const ProjectModal: React.FC<Props> = ({
  isOpen,
  projectToEdit,
  clients,
  users,
  services,
  reminders = [],
  onClose,
  onSave,
  onDelete,
  onSaveReminder,
  onDeleteReminder,
  onStatusChangeReminder,
}) => {
  const { t, getServiceLabel, getResponsibleLabel } = useLanguage();
  const { currentUser, canEditProject, isUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const todayStr = new Date().toISOString().slice(0, 10);

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [responsible, setResponsible] = useState('');
  const [type, setType] = useState(services.length > 0 ? services[0].code : 'waste-management');
  const [start, setStart] = useState(todayStr);
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [notes, setNotes] = useState('');

  // Project Reminders management state
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [addReminderMode, setAddReminderMode] = useState<'new' | 'existing'>('new');
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderResponsible, setNewReminderResponsible] = useState('');
  const [newReminderNotes, setNewReminderNotes] = useState('');
  const [selectedExistingReminderId, setSelectedExistingReminderId] = useState('');

  // Editing existing reminder in list
  const [editingProjectReminder, setEditingProjectReminder] = useState<Reminder | null>(null);
  const [editReminderTitle, setEditReminderTitle] = useState('');
  const [editReminderDate, setEditReminderDate] = useState('');
  const [editReminderStatus, setEditReminderStatus] = useState('Pending');
  const [editReminderResponsible, setEditReminderResponsible] = useState('');
  const [editReminderNotes, setEditReminderNotes] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setClientId(projectToEdit.clientId || '');
      setClientName(projectToEdit.clientName);
      setResponsible(projectToEdit.responsible || currentUser?.name || '');
      setType(projectToEdit.type);
      setStart(projectToEdit.start || '');
      setDeadline(projectToEdit.deadline || '');
      setProgress(projectToEdit.progress);
      setDone(projectToEdit.done || false);
      setNotes(projectToEdit.notes || '');
      setIsAddingReminder(false);
      setEditingProjectReminder(null);
    } else {
      const firstEligible = users.find((u) => {
        const isBlocked = u.status === 'BLOCKED' || u.status?.toLowerCase() === 'blocked' || (u.isApproved === false && u.status !== 'PENDING');
        return u.role !== 'Administrator' && !isBlocked;
      });
      setName('');
      setClientId(clients.length > 0 ? clients[0].id : '');
      setClientName(clients.length > 0 ? clients[0].name : '');
      setResponsible(isUser ? (currentUser?.name || '') : (firstEligible ? firstEligible.name : ''));
      setType(services.length > 0 ? services[0].code : 'waste-management');
      setStart(todayStr);
      setDeadline('');
      setProgress(0);
      setDone(false);
      setNotes('');
      setIsAddingReminder(false);
      setEditingProjectReminder(null);
    }
  }, [projectToEdit, isOpen, clients, users, services, currentUser, isUser, todayStr]);

  const handleClientSelectChange = (id: string) => {
    setClientId(id);
    const found = clients.find((c) => c.id === id);
    if (found) setClientName(found.name);
  };

  const projectReminders = useMemo(() => {
    if (!projectToEdit || !reminders) return [];
    return reminders.filter((r) => {
      if (r.projectId && r.projectId === projectToEdit.id) return true;
      if (!r.projectId && r.projectName && r.projectName.trim().toLowerCase() === projectToEdit.name.trim().toLowerCase()) return true;
      return false;
    });
  }, [reminders, projectToEdit]);

  const availableExistingReminders = useMemo(() => {
    if (!reminders) return [];
    const projectReminderIds = new Set(projectReminders.map((r) => r.id));
    const targetClientId = clientId || projectToEdit?.clientId;
    const targetClientName = (clientName || projectToEdit?.clientName || '').trim().toLowerCase();

    const isMatchClient = (r: Reminder) => {
      if (targetClientId && r.clientId && r.clientId === targetClientId) return true;
      if (targetClientName && r.clientName && r.clientName.trim().toLowerCase() === targetClientName) return true;
      return false;
    };

    return reminders
      .filter((r) => !projectReminderIds.has(r.id))
      .sort((a, b) => {
        const aClientMatch = isMatchClient(a);
        const bClientMatch = isMatchClient(b);

        // 1. Client matches come first
        if (aClientMatch && !bClientMatch) return -1;
        if (!aClientMatch && bClientMatch) return 1;

        // 2. Then sort by due date if available
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;

        // 3. Finally sort alphabetically by title/name
        const aTitle = a.title || a.projectName || '';
        const bTitle = b.title || b.projectName || '';
        return aTitle.localeCompare(bTitle);
      });
  }, [reminders, projectReminders, clientId, clientName, projectToEdit]);

  const handleCreateProjectReminder = () => {
    if (!newReminderTitle.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertReminderTitleRequired'),
      });
      return;
    }
    if (onSaveReminder && projectToEdit) {
      onSaveReminder({
        title: newReminderTitle.trim(),
        projectId: projectToEdit.id,
        projectName: name.trim() || projectToEdit.name,
        clientId: clientId || projectToEdit.clientId || null,
        clientName: clientName.trim() || projectToEdit.clientName,
        responsible: newReminderResponsible || responsible || null,
        dueDate: newReminderDate || null,
        notes: newReminderNotes || null,
        status: 'Pending',
      });
      setIsAddingReminder(false);
      setNewReminderTitle('');
      setNewReminderDate('');
      setNewReminderNotes('');
    }
  };

  const handleLinkExistingReminder = () => {
    if (!selectedExistingReminderId) return;
    const existing = reminders.find((r) => r.id === selectedExistingReminderId);
    if (existing && onSaveReminder && projectToEdit) {
      onSaveReminder({
        id: existing.id,
        projectId: projectToEdit.id,
        projectName: name.trim() || projectToEdit.name,
        clientId: clientId || projectToEdit.clientId || existing.clientId || null,
        clientName: clientName.trim() || projectToEdit.clientName || existing.clientName,
      });
      setIsAddingReminder(false);
      setSelectedExistingReminderId('');
    }
  };

  const handleStartEditReminder = (rem: Reminder) => {
    setEditingProjectReminder(rem);
    setEditReminderTitle(rem.title || rem.projectName || '');
    setEditReminderDate(rem.dueDate || '');
    setEditReminderStatus(rem.status || 'Pending');
    setEditReminderResponsible(rem.responsible || '');
    setEditReminderNotes(rem.notes || '');
  };

  const handleSaveEditedReminder = () => {
    if (!editReminderTitle.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertReminderTitleRequired'),
      });
      return;
    }
    if (onSaveReminder && editingProjectReminder && projectToEdit) {
      onSaveReminder({
        id: editingProjectReminder.id,
        title: editReminderTitle.trim(),
        projectId: projectToEdit.id,
        projectName: name.trim() || projectToEdit.name,
        clientId: clientId || projectToEdit.clientId || null,
        clientName: clientName.trim() || projectToEdit.clientName,
        responsible: editReminderResponsible || null,
        dueDate: editReminderDate || null,
        status: editReminderStatus || 'Pending',
        notes: editReminderNotes || null,
      });
      setEditingProjectReminder(null);
    }
  };

  const getStatusChip = (st?: string) => {
    if (!st) return null;
    switch (st.toLowerCase()) {
      case 'completed':
      case 'završeno':
      case 'завршено':
        return <Chip label={t('statusCompleted')} color="success" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
      case 'in progress':
      case 'u toku':
      case 'у току':
        return <Chip label={t('statusInProgress')} color="info" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
      case 'overdue':
      case 'prekoračeno':
      case 'прекорачено':
        return <Chip label={t('statusOverdue')} color="error" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
      case 'pending':
      case 'na čekanju':
      case 'на чекању':
      default:
        return <Chip label={t('statusPending')} color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
    }
  };

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
      <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {projectToEdit ? t('modalEditProject') : t('modalNewProject')}
            </Typography>

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
              >
                {t('btnDelete')}
              </Button>
            )}
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
              <Grid size={{ xs: 12 }}>
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
                    placeholder={t('phProjectNotes')}
                    minHeight={150}
                  />
                </Paper>
              </Grid>

              {/* REMINDERS SECTION */}
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotificationsActiveIcon color="warning" fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('reminderBoxTitle')} {projectReminders.length > 0 && `(${projectReminders.length})`}
                      </Typography>
                    </Box>
                    {projectToEdit && (
                      <Button
                        size="small"
                        variant={isAddingReminder ? 'outlined' : 'contained'}
                        color={isAddingReminder ? 'inherit' : 'primary'}
                        startIcon={isAddingReminder ? <CloseIcon /> : <AddIcon />}
                        onClick={() => {
                          setIsAddingReminder(!isAddingReminder);
                          setAddReminderMode('new');
                          setNewReminderTitle('');
                          setNewReminderDate('');
                          setNewReminderResponsible(responsible || currentUser?.name || '');
                          setNewReminderNotes('');
                          setSelectedExistingReminderId('');
                        }}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                      >
                        {isAddingReminder ? t('btnCancel') : t('btnAddReminder')}
                      </Button>
                    )}
                  </Box>

                  {/* ADD REMINDER PANEL */}
                  {isAddingReminder && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                        <ToggleButtonGroup
                          size="small"
                          value={addReminderMode}
                          exclusive
                          onChange={(_, val) => {
                            if (val) setAddReminderMode(val);
                          }}
                          color="primary"
                        >
                          <ToggleButton value="new" sx={{ textTransform: 'none', fontWeight: 600, px: 1.5, py: 0.5 }}>
                            {t('btnCreateNewReminder')}
                          </ToggleButton>
                          <ToggleButton value="existing" sx={{ textTransform: 'none', fontWeight: 600, px: 1.5, py: 0.5 }}>
                            {t('btnLinkExistingReminder')}
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Box>

                      {addReminderMode === 'new' ? (
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={t('lblReminderTitle')}
                              placeholder={t('phReminderTitle')}
                              value={newReminderTitle}
                              onChange={(e) => setNewReminderTitle(e.target.value)}
                              required
                              autoFocus
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="date"
                              label={t('lblDueDate')}
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={newReminderDate}
                              onChange={(e) => setNewReminderDate(e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            {(() => {
                              const respLabel = getResponsibleLabel(newReminderResponsible, users);
                              const selectableUsers = users.filter((u) => {
                                const isSelected = Boolean(newReminderResponsible) && u.name.trim().toLowerCase() === newReminderResponsible.trim().toLowerCase();
                                if (isSelected) return true;
                                const isBlocked = u.status === 'BLOCKED' || u.status?.toLowerCase() === 'blocked' || (u.isApproved === false && u.status !== 'PENDING');
                                if (isBlocked) return false;
                                if (u.role === 'Administrator') return false;
                                return true;
                              });
                              return (
                                <Autocomplete
                                  freeSolo
                                  size="small"
                                  options={selectableUsers}
                                  getOptionLabel={(u) => (typeof u === 'string' ? u : u.name)}
                                  value={newReminderResponsible}
                                  onChange={(_, val) => {
                                    if (typeof val === 'string') setNewReminderResponsible(val);
                                    else if (val) setNewReminderResponsible(val.name);
                                    else setNewReminderResponsible('');
                                  }}
                                  onInputChange={(_, val, reason) => {
                                    if (reason === 'input') setNewReminderResponsible(val);
                                  }}
                                  renderInput={(params) => <TextField {...params} label={respLabel} />}
                                />
                              );
                            })()}
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={t('lblNotes')}
                              value={newReminderNotes}
                              onChange={(e) => setNewReminderNotes(e.target.value)}
                              multiline
                              rows={2}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
                            <Button size="small" variant="outlined" color="inherit" onClick={() => setIsAddingReminder(false)}>
                              {t('btnCancel')}
                            </Button>
                            <Button size="small" variant="contained" color="primary" onClick={handleCreateProjectReminder}>
                              {t('btnAddReminder')}
                            </Button>
                          </Grid>
                        </Grid>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Autocomplete
                            size="small"
                            options={availableExistingReminders}
                            groupBy={(r) => {
                              const targetClientId = clientId || projectToEdit?.clientId;
                              const targetClientName = (clientName || projectToEdit?.clientName || '').trim().toLowerCase();
                              const isMatch =
                                Boolean(targetClientId && r.clientId === targetClientId) ||
                                Boolean(targetClientName && r.clientName && r.clientName.trim().toLowerCase() === targetClientName);
                              return isMatch ? `${t('colClient')}: ${clientName || projectToEdit?.clientName || ''}` : t('other');
                            }}
                            getOptionLabel={(r) =>
                              `${r.title || r.projectName || t('tabReminders')}${r.dueDate ? ` (${r.dueDate})` : ''}${r.clientName ? ` - ${r.clientName}` : ''}`
                            }
                            value={availableExistingReminders.find((r) => r.id === selectedExistingReminderId) || null}
                            onChange={(_, val) => setSelectedExistingReminderId(val ? val.id : '')}
                            renderOption={(props, r) => {
                              const { key, ...otherProps } = props as any;
                              const targetClientId = clientId || projectToEdit?.clientId;
                              const targetClientName = (clientName || projectToEdit?.clientName || '').trim().toLowerCase();
                              const isMatch =
                                Boolean(targetClientId && r.clientId === targetClientId) ||
                                Boolean(targetClientName && r.clientName && r.clientName.trim().toLowerCase() === targetClientName);

                              return (
                                <li key={key || r.id} {...otherProps}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', py: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: isMatch ? 700 : 500 }}>
                                        {r.title || r.projectName || '—'}
                                      </Typography>
                                      {isMatch && (
                                        <Chip
                                          label={t('colClient')}
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                                        />
                                      )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.75rem', mt: 0.25 }}>
                                      {r.clientName && <span>{r.clientName}</span>}
                                      {r.dueDate && <span>• {r.dueDate}</span>}
                                      {r.status && <span>• {r.status}</span>}
                                    </Box>
                                  </Box>
                                </li>
                              );
                            }}
                            renderInput={(params) => (
                              <TextField {...params} placeholder={t('phSelectExistingReminder')} label={t('tabReminders')} />
                            )}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button size="small" variant="outlined" color="inherit" onClick={() => setIsAddingReminder(false)}>
                              {t('btnCancel')}
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              disabled={!selectedExistingReminderId}
                              onClick={handleLinkExistingReminder}
                            >
                              {t('btnLink')}
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* LIST OF PROJECT REMINDERS */}
                  {projectToEdit ? (
                    projectReminders.length === 0 && !isAddingReminder ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 1.5, textAlign: 'center' }}>
                        {t('noProjectReminders')}
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {projectReminders.map((rem) => {
                          const isCompleted =
                            rem.status?.toLowerCase() === 'completed' || rem.status === 'Završeno' || rem.status === 'Завршено';
                          return (
                            <Box
                              key={rem.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1.25,
                                px: 1.5,
                                bgcolor: 'background.paper',
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                opacity: isCompleted ? 0.75 : 1,
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    textDecoration: isCompleted ? 'line-through' : 'none',
                                    color: isCompleted ? 'text.secondary' : 'text.primary',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {rem.title || rem.projectName || '—'}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.25 }}>
                                  {rem.dueDate && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                    >
                                      <CalendarTodayIcon sx={{ fontSize: '0.8rem' }} />
                                      {rem.dueDate}
                                    </Typography>
                                  )}
                                  {rem.responsible && (
                                    <Typography variant="caption" color="text.secondary">
                                      • {rem.responsible}
                                    </Typography>
                                  )}
                                  {getStatusChip(rem.status)}
                                </Box>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                                <Tooltip title={isCompleted ? t('statusPending') : t('statusCompleted')}>
                                  <IconButton
                                    size="small"
                                    color={isCompleted ? 'default' : 'success'}
                                    onClick={() => {
                                      if (onStatusChangeReminder) {
                                        onStatusChangeReminder(rem.id, isCompleted ? 'Pending' : 'Completed');
                                      } else if (onSaveReminder) {
                                        onSaveReminder({ id: rem.id, status: isCompleted ? 'Pending' : 'Completed' });
                                      }
                                    }}
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('btnEdit')}>
                                  <IconButton size="small" color="primary" onClick={() => handleStartEditReminder(rem)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {onDeleteReminder && (
                                  <Tooltip title={t('btnDelete')}>
                                    <IconButton size="small" color="error" onClick={() => onDeleteReminder(rem.id)}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
                      {t('newProjectRemindersHint')}
                    </Typography>
                  )}
                </Paper>
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

              {/* PROGRESS & DONE */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('lblProgressPct')}
                  slotProps={{ htmlInput: { min: 0, max: 100 } }}
                  value={progress}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setProgress(val);
                    if (val >= 100) setDone(true);
                    else if (val < 100 && done) setDone(false);
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={done}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setDone(isChecked);
                        if (isChecked) setProgress(100);
                      }}
                      color="success"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{t('btnMarkDone')}</Typography>}
                />
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
        </form>
      </Dialog>

      {/* EDIT REMINDER DIALOG */}
      {editingProjectReminder && (
        <Dialog
          open={Boolean(editingProjectReminder)}
          onClose={() => setEditingProjectReminder(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {t('modalEditReminder')}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblReminderTitle')}
                  value={editReminderTitle}
                  onChange={(e) => setEditReminderTitle(e.target.value)}
                  required
                  autoFocus
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('lblDueDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={editReminderDate}
                  onChange={(e) => setEditReminderDate(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblStatus')}</InputLabel>
                  <Select
                    value={editReminderStatus}
                    label={t('lblStatus')}
                    onChange={(e) => setEditReminderStatus(e.target.value)}
                  >
                    <MenuItem value="Pending">{t('statusPending')}</MenuItem>
                    <MenuItem value="In Progress">{t('statusInProgress')}</MenuItem>
                    <MenuItem value="Completed">{t('statusCompleted')}</MenuItem>
                    <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                {(() => {
                  const respLabel = getResponsibleLabel(editReminderResponsible, users);
                  const selectableUsers = users.filter((u) => {
                    const isSelected =
                      Boolean(editReminderResponsible) &&
                      u.name.trim().toLowerCase() === editReminderResponsible.trim().toLowerCase();
                    if (isSelected) return true;
                    const isBlocked =
                      u.status === 'BLOCKED' ||
                      u.status?.toLowerCase() === 'blocked' ||
                      (u.isApproved === false && u.status !== 'PENDING');
                    if (isBlocked) return false;
                    if (u.role === 'Administrator') return false;
                    return true;
                  });
                  return (
                    <Autocomplete
                      freeSolo
                      size="small"
                      options={selectableUsers}
                      getOptionLabel={(u) => (typeof u === 'string' ? u : u.name)}
                      value={editReminderResponsible}
                      onChange={(_, val) => {
                        if (typeof val === 'string') setEditReminderResponsible(val);
                        else if (val) setEditReminderResponsible(val.name);
                        else setEditReminderResponsible('');
                      }}
                      onInputChange={(_, val, reason) => {
                        if (reason === 'input') setEditReminderResponsible(val);
                      }}
                      renderInput={(params) => <TextField {...params} label={respLabel} />}
                    />
                  );
                })()}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblNotes')}
                  value={editReminderNotes}
                  onChange={(e) => setEditReminderNotes(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingProjectReminder(null)} color="inherit">
              {t('btnCancel')}
            </Button>
            <Button variant="contained" color="primary" onClick={handleSaveEditedReminder}>
              {t('btnSave')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
};
