import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import type { Reminder, Project, Client, Permit, User } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export interface ReminderModalProps {
  open: boolean;
  onClose: () => void;
  editingReminder: Reminder | null;
  projects: Project[];
  clients: Client[];
  permits: Permit[];
  users: User[];
  canCreate: boolean;
  canEdit: boolean;
  isRestricted: boolean;
  currentUser: User | null;
  onSave: (reminderData: Partial<Reminder>) => Promise<boolean | void>;
  isSaving?: boolean;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  open,
  onClose,
  editingReminder,
  projects,
  clients,
  permits,
  users,
  canCreate,
  canEdit,
  isRestricted,
  currentUser,
  onSave,
  isSaving = false,
}) => {
  const { t, getResponsibleLabel } = useLanguage();

  const [title, setTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedPermitId, setSelectedPermitId] = useState('');
  const [permitNumber, setPermitNumber] = useState('');
  const [selectedResponsibleId, setSelectedResponsibleId] = useState('');
  const [responsible, setResponsible] = useState('');
  const [status, setStatus] = useState('Pending');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title || '');
      setSelectedProjectId(editingReminder.projectId || '');
      setProjectName(editingReminder.projectName || '');
      setSelectedClientId(editingReminder.clientId || '');
      setClientName(editingReminder.clientName || '');
      setSelectedPermitId(editingReminder.permitId || '');
      setPermitNumber(editingReminder.permitNumber || '');
      setSelectedResponsibleId(editingReminder.responsibleId || '');
      setResponsible(editingReminder.responsible || '');
      setStatus(editingReminder.status || 'Pending');
      setDueDate(editingReminder.dueDate ? editingReminder.dueDate.split('T')[0] : '');
      setNotes(editingReminder.notes || '');
    } else {
      setTitle('');
      setSelectedProjectId('');
      setProjectName('');
      setSelectedClientId('');
      setClientName('');
      setSelectedPermitId('');
      setPermitNumber('');
      if (isRestricted && currentUser) {
        setSelectedResponsibleId(currentUser.id || '');
        setResponsible(currentUser.name || '');
      } else {
        setSelectedResponsibleId('');
        setResponsible('');
      }
      setStatus('Pending');
      setDueDate('');
      setNotes('');
    }
  }, [editingReminder, open, isRestricted, currentUser]);

  const handleProjectSelect = (pId: string) => {
    setSelectedProjectId(pId);
    const p = projects.find((proj) => proj.id === pId);
    if (p) {
      setProjectName(p.name);
      if (p.clientId && !selectedClientId) {
        setSelectedClientId(p.clientId);
        setClientName(p.clientName);
      }
    }
  };

  const handleClientSelect = (cId: string) => {
    setSelectedClientId(cId);
    const c = clients.find((cli) => cli.id === cId);
    if (c) setClientName(c.name);
  };

  const handleResponsibleSelect = (uId: string) => {
    setSelectedResponsibleId(uId);
    const u = users.find((usr) => usr.id === uId);
    if (u) setResponsible(u.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    await onSave({
      id: editingReminder ? editingReminder.id : undefined,
      title: title.trim(),
      projectId: selectedProjectId || null,
      projectName: projectName.trim() || null,
      clientId: selectedClientId || null,
      clientName: clientName.trim() || null,
      permitId: selectedPermitId || null,
      permitNumber: permitNumber.trim() || null,
      responsibleId: selectedResponsibleId || null,
      responsible: responsible.trim() || null,
      status,
      dueDate: dueDate || null,
      notes: notes.trim() || null,
    });
  };

  const respLabel = getResponsibleLabel(selectedResponsibleId || responsible, users);
  const selectableUsers = users.filter((u) => {
    const isMe = Boolean(currentUser?.name) && u.name.trim().toLowerCase() === currentUser?.name?.trim().toLowerCase();
    if (isRestricted) return isMe;
    const isSelected =
      (Boolean(selectedResponsibleId) && u.id === selectedResponsibleId) ||
      (Boolean(responsible) && u.name.trim().toLowerCase() === responsible.trim().toLowerCase());
    if (isSelected) return true;
    const isBlocked = u.status === 'BLOCKED' || u.status?.toLowerCase() === 'blocked' || (u.isApproved === false && u.status !== 'PENDING');
    if (isBlocked) return false;
    if (u.role === 'Administrator' || u.roleEntity?.isSystemAdmin) return false;
    return true;
  });

  const isResponsibleDisabled = isRestricted || (!editingReminder ? !canCreate : !canEdit);

  return (
    <Dialog open={open} onClose={() => !isSaving && onClose()} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{editingReminder ? t('modalEditReminder') : t('modalNewReminder')}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {/* Reminder Title */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label={t('lblReminderTitle')}
                placeholder={t('phReminderTitle')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </Grid>

            {/* Project Selection / Custom Name */}
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                freeSolo
                size="small"
                options={projects}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.name} (${option.clientName})`;
                }}
                value={
                  selectedProjectId
                    ? projects.find((p) => p.id === selectedProjectId) || projectName
                    : projectName
                }
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    setSelectedProjectId('');
                    setProjectName(newValue);
                  } else if (newValue) {
                    handleProjectSelect(newValue.id);
                  } else {
                    setSelectedProjectId('');
                    setProjectName('');
                  }
                }}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === 'input') {
                    setSelectedProjectId('');
                    setProjectName(newInputValue);
                  }
                }}
                renderInput={(params) => <TextField {...params} label={t('colProject')} />}
              />
            </Grid>

            {/* Client Selection / Custom Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                size="small"
                options={clients}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.name;
                }}
                value={
                  selectedClientId
                    ? clients.find((c) => c.id === selectedClientId) || clientName
                    : clientName
                }
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    setSelectedClientId('');
                    setClientName(newValue);
                  } else if (newValue) {
                    handleClientSelect(newValue.id);
                  } else {
                    setSelectedClientId('');
                    setClientName('');
                  }
                }}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === 'input') {
                    setSelectedClientId('');
                    setClientName(newInputValue);
                  }
                }}
                renderInput={(params) => <TextField {...params} label={t('colClient')} />}
              />
            </Grid>

            {/* Permit Selection (Optional) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                size="small"
                options={selectedClientId ? permits.filter((p) => p.clientId === selectedClientId) : permits}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.permitNumber} (${option.indexNumber})`;
                }}
                value={
                  selectedPermitId
                    ? permits.find((p) => p.id === selectedPermitId) || permitNumber
                    : permitNumber
                }
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    setSelectedPermitId('');
                    setPermitNumber(newValue);
                  } else if (newValue) {
                    setSelectedPermitId(newValue.id);
                    setPermitNumber(newValue.permitNumber);
                    if (newValue.clientId && !selectedClientId) {
                      setSelectedClientId(newValue.clientId);
                      const c = clients.find((cli) => cli.id === newValue.clientId);
                      if (c) setClientName(c.name);
                    }
                  } else {
                    setSelectedPermitId('');
                    setPermitNumber('');
                  }
                }}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === 'input') {
                    setSelectedPermitId('');
                    setPermitNumber(newInputValue);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label={t('lblPermit')} placeholder={t('phSelectPermit')} />
                )}
              />
            </Grid>

            {/* Responsible Selection / Custom Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                key={respLabel}
                freeSolo
                size="small"
                disabled={isResponsibleDisabled}
                options={selectableUsers}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.name;
                }}
                value={
                  selectedResponsibleId
                    ? selectableUsers.find((u) => u.id === selectedResponsibleId) || responsible
                    : responsible
                }
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    setSelectedResponsibleId('');
                    setResponsible(newValue);
                  } else if (newValue) {
                    handleResponsibleSelect(newValue.id);
                  } else {
                    setSelectedResponsibleId('');
                    setResponsible('');
                  }
                }}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === 'input') {
                    setSelectedResponsibleId('');
                    setResponsible(newInputValue);
                  }
                }}
                renderInput={(params) => <TextField {...params} label={respLabel} />}
              />
            </Grid>

            {/* Status & Due Date */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('lblStatus')}</InputLabel>
                <Select value={status} label={t('lblStatus')} onChange={(e) => setStatus(e.target.value)}>
                  <MenuItem value="Pending">{t('statusPending')}</MenuItem>
                  <MenuItem value="In Progress">{t('statusInProgress')}</MenuItem>
                  <MenuItem value="Completed">{t('statusCompleted')}</MenuItem>
                  <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('lblDueDate')}
                slotProps={{ inputLabel: { shrink: true } }}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Grid>

            {/* Notes */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                label={t('lblNotes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>
            {t('btnCancel')}
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
            {isSaving ? '...' : t('btnSave')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
