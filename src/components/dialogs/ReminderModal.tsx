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
} from '@mui/material';
import type { Reminder, Project, Client, Permit, User } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  ProjectAutocomplete,
  ClientAutocomplete,
  PermitAutocomplete,
  UserAutocomplete,
} from '../common/autocomplete';

export interface ReminderModalProps {
  open: boolean;
  onClose: () => void;
  editingReminder: Reminder | null;
  projects?: Project[];
  clients?: Client[];
  permits?: Permit[];
  users?: User[];
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
  projects: _projects = [],
  clients: _clients = [],
  permits: _permits = [],
  users: _users = [],
  canCreate,
  canEdit,
  isRestricted,
  currentUser,
  onSave,
  isSaving = false,
}) => {
  const { t } = useLanguage();

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
    if (!open) return;
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
  }, [editingReminder, open]);

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

  const isResponsibleDisabled = isRestricted || (!editingReminder ? !canCreate : !canEdit);

  return (
    <Dialog
      open={open}
      onClose={() => !isSaving && onClose()}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          sx: {
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <DialogTitle sx={{ flexShrink: 0 }}>{editingReminder ? t('modalEditReminder') : t('modalNewReminder')}</DialogTitle>
      <DialogContent dividers sx={{ flex: 1, overflowY: 'auto' }}>
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
              <ProjectAutocomplete
                freeSolo
                size="small"
                value={
                  selectedProjectId
                    ? { id: selectedProjectId, name: projectName }
                    : projectName || null
                }
                initialOption={
                  selectedProjectId ? ({ id: selectedProjectId, name: projectName } as any) : null
                }
                onChange={(newValue, opt) => {
                  if (typeof newValue === 'string') {
                    setSelectedProjectId('');
                    setProjectName(newValue);
                  } else if (opt) {
                    setSelectedProjectId(opt.id || '');
                    setProjectName(opt.name || (opt as any).projectName || '');
                    if (opt.clientId) {
                      setSelectedClientId(opt.clientId);
                      if (opt.clientName) setClientName(opt.clientName);
                    }
                  } else {
                    setSelectedProjectId('');
                    setProjectName('');
                  }
                }}
                label={t('colProject')}
                placeholder={t('phProjectName')}
              />
            </Grid>

            {/* Client Selection / Custom Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <ClientAutocomplete
                freeSolo
                size="small"
                value={
                  selectedClientId
                    ? { id: selectedClientId, name: clientName }
                    : clientName || null
                }
                initialOption={
                  selectedClientId ? ({ id: selectedClientId, name: clientName } as any) : null
                }
                onChange={(newValue, opt) => {
                  if (typeof newValue === 'string') {
                    setSelectedClientId('');
                    setClientName(newValue);
                  } else if (opt) {
                    setSelectedClientId(opt.id || '');
                    setClientName(opt.name || '');
                  } else {
                    setSelectedClientId('');
                    setClientName('');
                  }
                }}
                label={t('lblClient')}
                placeholder={t('phClient')}
              />
            </Grid>

            {/* Permit Selection (Optional) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <PermitAutocomplete
                freeSolo
                size="small"
                clientId={selectedClientId || undefined}
                value={
                  selectedPermitId
                    ? { id: selectedPermitId, permitNumber }
                    : permitNumber || null
                }
                initialOption={
                  selectedPermitId ? ({ id: selectedPermitId, permitNumber } as any) : null
                }
                onChange={(newValue, opt) => {
                  if (typeof newValue === 'string') {
                    setSelectedPermitId('');
                    setPermitNumber(newValue);
                  } else if (opt) {
                    setSelectedPermitId(opt.id || '');
                    setPermitNumber(opt.permitNumber || '');
                    if (opt.clientId && !selectedClientId) {
                      setSelectedClientId(opt.clientId);
                      if (opt.clientName) setClientName(opt.clientName);
                    }
                  } else {
                    setSelectedPermitId('');
                    setPermitNumber('');
                  }
                }}
                label={t('lblPermit')}
                placeholder={t('phSelectPermit')}
              />
            </Grid>

            {/* Responsible Selection / Custom Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <UserAutocomplete
                freeSolo
                size="small"
                disabled={isResponsibleDisabled}
                value={
                  selectedResponsibleId
                    ? { id: selectedResponsibleId, name: responsible }
                    : responsible || null
                }
                initialOption={
                  selectedResponsibleId ? ({ id: selectedResponsibleId, name: responsible } as any) : null
                }
                valueMode="name"
                onChange={(val, opt) => {
                  if (typeof val === 'string') {
                    setResponsible(val);
                    setSelectedResponsibleId(opt?.id || '');
                  } else if (opt) {
                    setSelectedResponsibleId(opt.id || '');
                    setResponsible(opt.name || '');
                  } else {
                    setSelectedResponsibleId('');
                    setResponsible('');
                  }
                }}
                placeholder={currentUser?.name || ''}
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
        <DialogActions sx={{ p: 2, flexShrink: 0 }}>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>
            {t('btnCancel')}
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
            {isSaving ? '...' : t('btnSave')}
          </Button>
        </DialogActions>
    </Dialog>
  );
};
