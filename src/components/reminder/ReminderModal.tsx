import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import type { Reminder, Project, Client, Permit, User } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { CheckIcon } from '../icons';
import {
  ProjectAutocomplete,
  ClientAutocomplete,
  PermitAutocomplete,
  UserAutocomplete,
} from '../common/autocomplete';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';

export interface ReminderModalProps {
  open: boolean;
  onClose: () => void;
  editingReminder?: Reminder | (Partial<Reminder> & { id: string }) | null;
  projects?: Project[];
  clients?: Client[];
  permits?: Permit[];
  users?: User[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => Promise<any> | void;
  isRestricted?: boolean;
  currentUser?: User | null;
  onSave: (reminderData: Partial<Reminder>) => Promise<boolean | void>;
  isSaving?: boolean;
  initialMode?: ModalMode;
  mode?: ModalMode;
  onModeChange?: (mode: ModalMode) => void;
  // Backward compatibility
  isViewMode?: boolean;
  onToggleEditMode?: () => void;
}

const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  const clean = d.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${day}.${m}.${y}.`;
  }
  return d;
};

export const ReminderModal: React.FC<ReminderModalProps> = ({
  open,
  onClose,
  editingReminder = null,
  projects: _projects = [],
  clients: _clients = [],
  permits: _permits = [],
  users: _users = [],
  canCreate = true,
  canEdit = true,
  canDelete = false,
  onDelete,
  onStatusChange,
  isRestricted = false,
  currentUser = null,
  onSave,
  isSaving = false,
  initialMode,
  mode: controlledMode,
  onModeChange: onModeChangeProp,
  isViewMode,
  onToggleEditMode,
}) => {
  const { t } = useLanguage();

  // Mode state: 'view' | 'edit' | 'create'
  const [internalMode, setInternalMode] = useState<ModalMode>(() => {
    if (controlledMode) return controlledMode;
    if (initialMode) return initialMode;
    if (isViewMode !== undefined) return isViewMode ? 'view' : 'edit';
    return editingReminder ? 'view' : 'create';
  });

  const currentMode = controlledMode || internalMode;
  const isView = currentMode === 'view';

  const handleModeChange = (newMode: ModalMode) => {
    setInternalMode(newMode);
    onModeChangeProp?.(newMode);
    if (onToggleEditMode && ((isView && newMode === 'edit') || (!isView && newMode === 'view'))) {
      onToggleEditMode();
    }
  };

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

  // Reset / populate form on modal open or editingReminder / initialMode change
  useEffect(() => {
    if (!open) return;

    if (controlledMode) {
      setInternalMode(controlledMode);
    } else if (initialMode) {
      setInternalMode(initialMode);
    } else if (isViewMode !== undefined) {
      setInternalMode(isViewMode ? 'view' : 'edit');
    } else {
      setInternalMode(editingReminder ? 'view' : 'create');
    }

    if (editingReminder) {
      setTitle(editingReminder.title || editingReminder.projectName || '');
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
  }, [editingReminder, open, initialMode, controlledMode, isViewMode, isRestricted, currentUser]);

  const resetToEditingReminder = () => {
    if (editingReminder) {
      setTitle(editingReminder.title || editingReminder.projectName || '');
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
    }
  };

  const handleCancel = () => {
    if (currentMode === 'edit' && editingReminder) {
      resetToEditingReminder();
      handleModeChange('view');
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isView) return;
    const finalTitle = title.trim() || projectName.trim();
    if (!finalTitle || isSaving) return;

    const res = await onSave({
      id: editingReminder ? editingReminder.id : undefined,
      title: finalTitle,
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

    if (res !== false) {
      if (editingReminder && currentMode === 'edit') {
        handleModeChange('view');
      }
    }
  };

  const isResponsibleDisabled = isRestricted || (!editingReminder ? !canCreate : !canEdit);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const isCompleted = status.toLowerCase() === 'completed' || status.toLowerCase() === 'završeno';

  const getStatusChip = (st?: string) => {
    if (!st) return null;
    const lower = st.toLowerCase();
    if (lower === 'completed' || lower === 'završeno' || lower === 'завршено') {
      return <Chip label={t('statusCompleted')} color="success" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
    }
    if (lower === 'in progress' || lower === 'u toku' || lower === 'у току') {
      return <Chip label={t('statusInProgress')} color="info" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
    }
    if (lower === 'overdue' || lower === 'prekoračeno' || lower === 'прекорачено' || lower === 'kasni' || lower === 'касни') {
      return <Chip label={t('statusOverdue')} color="error" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
    }
    return <Chip label={t('statusPending')} color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
  };

  const handleToggleStatus = async () => {
    if (!editingReminder?.id || !canEdit || isUpdatingStatus) return;
    const nextStatus = isCompleted ? 'Pending' : 'Completed';
    setIsUpdatingStatus(true);
    try {
      if (onStatusChange) {
        await onStatusChange(editingReminder.id, nextStatus);
        setStatus(nextStatus);
      } else {
        const res = await onSave({
          id: editingReminder.id,
          status: nextStatus,
        });
        if (res !== false) {
          setStatus(nextStatus);
        }
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const modalTitle = (m: ModalMode) => {
    if (m === 'create') return t('modalNewReminder');
    if (m === 'edit') return t('modalEditReminder');
    return title || t('modalReminderDetails');
  };

  return (
    <ViewEditModalBase
      open={open}
      onClose={() => !isSaving && onClose()}
      mode={currentMode}
      onModeChange={handleModeChange}
      title={modalTitle}
      onComplete={isView && Boolean(editingReminder?.id) && canEdit ? handleToggleStatus : undefined}
      isCompleted={isCompleted}
      isCompleting={isUpdatingStatus}
      completeLabel={isCompleted ? t('statusCompleted') : t('btnMarkDone')}
      maxWidth="md"
      canEdit={canEdit}
      canDelete={canDelete && Boolean(editingReminder?.id)}
      onDelete={onDelete && editingReminder ? () => onDelete(editingReminder.id) : undefined}
      onSave={handleSubmit}
      onCancel={handleCancel}
      isSaving={isSaving}
    >
      <Grid container spacing={2}>
        {/* Reminder Title */}
        <Grid size={{ xs: 12 }}>
          <ViewEditField
            label={t('lblReminderTitle')}
            isViewMode={isView}
            viewValue={
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {title || '—'}
              </Typography>
            }
          >
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
          </ViewEditField>
        </Grid>

        {/* Project Selection / Custom Name */}
        <Grid size={{ xs: 12 }}>
          <ViewEditField
            label={t('colProject')}
            isViewMode={isView}
            viewValue={projectName}
          >
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
          </ViewEditField>
        </Grid>

        {/* Client Selection / Custom Name */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            label={t('colClient')}
            isViewMode={isView}
            viewValue={clientName}
          >
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
          </ViewEditField>
        </Grid>

        {/* Permit Selection (Optional) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            label={t('lblPermit')}
            isViewMode={isView}
            viewValue={
              permitNumber ? (
                <Chip label={permitNumber} size="small" variant="outlined" color="primary" />
              ) : undefined
            }
          >
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
          </ViewEditField>
        </Grid>

        {/* Responsible Selection / Custom Name */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            label={t('colResponsible')}
            isViewMode={isView}
            viewValue={responsible}
          >
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
              label={t('colResponsible')}
              placeholder={currentUser?.name || ''}
            />
          </ViewEditField>
        </Grid>

        {/* Status */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            label={t('lblStatus')}
            isViewMode={isView}
            viewValue={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusChip(status)}
                {isView && canEdit && Boolean(editingReminder?.id) && (
                  <Button
                    size="small"
                    variant="text"
                    color={isCompleted ? 'inherit' : 'success'}
                    startIcon={
                      isUpdatingStatus ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <CheckIcon fontSize="small" />
                      )
                    }
                    onClick={handleToggleStatus}
                    disabled={isUpdatingStatus}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', py: 0 }}
                  >
                    {isCompleted ? t('statusPending') : t('btnMarkDone')}
                  </Button>
                )}
              </Box>
            }
          >
            <FormControl fullWidth size="small">
              <InputLabel>{t('lblStatus')}</InputLabel>
              <Select value={status} label={t('lblStatus')} onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="Pending">{t('statusPending')}</MenuItem>
                <MenuItem value="In Progress">{t('statusInProgress')}</MenuItem>
                <MenuItem value="Completed">{t('statusCompleted')}</MenuItem>
                <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
              </Select>
            </FormControl>
          </ViewEditField>
        </Grid>

        {/* Due Date */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            label={t('lblDueDate')}
            isViewMode={isView}
            viewValue={dueDate ? fmtDate(dueDate) : undefined}
          >
            <TextField
              fullWidth
              size="small"
              type="date"
              label={t('lblDueDate')}
              slotProps={{ inputLabel: { shrink: true } }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </ViewEditField>
        </Grid>

        {/* Notes */}
        <Grid size={{ xs: 12 }}>
          <ViewEditField
            label={t('lblNotes')}
            isViewMode={isView}
            viewValue={
              notes ? (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {notes}
                </Typography>
              ) : undefined
            }
          >
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              label={t('lblNotes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </ViewEditField>
        </Grid>
      </Grid>
    </ViewEditModalBase>
  );
};
