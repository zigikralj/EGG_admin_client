import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Button,
  Grid,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import type { Project, Client, User, Service } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  projectToEdit: Project | null;
  clients: Client[];
  users: User[];
  services: Service[];
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
  onDelete?: (id: string) => void;
  onToggleDone?: (id: string) => void;
  onMarkSampled?: (id: string) => void;
}

export const ProjectModal: React.FC<Props> = ({
  isOpen,
  projectToEdit,
  clients,
  users,
  services,
  onClose,
  onSave,
  onDelete,
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { currentUser, isUser, canEditProject } = useAuth();
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
  const [nextSample, setNextSample] = useState('');
  const [markSampledChecked, setMarkSampledChecked] = useState(false);

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
      setNextSample(projectToEdit.nextSample || '');
      setMarkSampledChecked(false);
    } else {
      setName('');
      setClientId(clients.length > 0 ? clients[0].id : '');
      setClientName(clients.length > 0 ? clients[0].name : '');
      setResponsible(isUser ? (currentUser?.name || '') : (users.length > 0 ? users[0].name : ''));
      setType(services.length > 0 ? services[0].code : 'waste-management');
      setStart(todayStr);
      setDeadline('');
      setProgress(0);
      setDone(false);
      setNextSample('');
      setMarkSampledChecked(false);
    }
  }, [projectToEdit, isOpen, clients, users, services, currentUser, isUser]);

  const currentService = services.find((s) => s.code === type);
  const hintText = currentService && currentService.frequency > 0
    ? t('periodicReminderHint', { freq: currentService.frequency })
    : '';

  const handleClientSelectChange = (id: string) => {
    setClientId(id);
    const found = clients.find((c) => c.id === id);
    if (found) setClientName(found.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!clientName.trim() && !clientId)) {
      alert(t('alertProjectValidation'));
      return;
    }

    const finalResponsible = isUser ? (currentUser?.name || responsible) : responsible;
    const finalProgress = done ? 100 : Math.max(0, Math.min(100, Number(progress) || 0));

    onSave({
      name: name.trim(),
      clientId: clientId || null,
      clientName: clientName || '',
      responsible: finalResponsible.trim() || null,
      type,
      start: start || null,
      deadline: deadline || null,
      progress: finalProgress,
      done,
      nextSample: nextSample || null,
    });
  };

  const isEditable = projectToEdit ? canEditProject(projectToEdit) : true;

  return (
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
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblClient')}</InputLabel>
                  <Select
                    value={clientId}
                    label={t('lblClient')}
                    onChange={(e) => handleClientSelectChange(e.target.value as string)}
                  >
                    {clients.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name} ({c.city || t('hqLocation')})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              {isUser ? (
                <TextField
                  fullWidth
                  label={t('lblResponsiblePerson')}
                  value={currentUser?.name || ''}
                  disabled
                  size="small"
                />
              ) : users.length > 0 ? (
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblResponsiblePerson')}</InputLabel>
                  <Select
                    value={responsible}
                    label={t('lblResponsiblePerson')}
                    onChange={(e) => setResponsible(e.target.value as string)}
                  >
                    {users.map((u) => {
                      const isMe = currentUser?.name && u.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
                      return (
                        <MenuItem key={u.id} value={u.name}>
                          {isMe ? `${t('lblMe')} (${u.name})` : u.name} ({u.role})
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label={t('lblResponsiblePerson')}
                  placeholder={t('phResponsiblePerson')}
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  size="small"
                />
              )}
            </Grid>

            {/* SERVICE TYPE */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('lblService')}</InputLabel>
                <Select
                  value={type}
                  label={t('lblService')}
                  onChange={(e) => setType(e.target.value as string)}
                >
                  {services.map((s) => (
                    <MenuItem key={s.id} value={s.code}>
                      {s.name || getServiceLabel(s.code)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {hintText && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {hintText}
                </Typography>
              )}
            </Grid>

            {/* REMINDER BOX */}
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <NotificationsActiveIcon color="warning" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('reminderBoxTitle')}
                  </Typography>
                </Box>
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label={t('lblNextSamplingDate')}
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={nextSample}
                      onChange={(e) => setNextSample(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={markSampledChecked}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setMarkSampledChecked(isChecked);
                            if (isChecked) {
                              const freq = currentService && currentService.frequency > 0 ? currentService.frequency : 3;
                              const d = new Date();
                              d.setMonth(d.getMonth() + freq);
                              setNextSample(d.toISOString().slice(0, 10));
                            }
                          }}
                          color="primary"
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{t('btnSampled')}</Typography>}
                    />
                  </Grid>
                </Grid>
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
          <Button onClick={onClose} variant="outlined" color="inherit">
            {t('btnCancel')}
          </Button>
          <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />}>
            {t('btnSave')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
