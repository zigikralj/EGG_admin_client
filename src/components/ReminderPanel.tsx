import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Paper,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import type { Project, Reminder, Client, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface Props {
  projects?: Project[];
  reminders?: Reminder[];
  clients?: Client[];
  users?: User[];
  onMarkSampled?: (id: string) => void;
  onSaveReminder?: (reminder: Partial<Reminder>) => void;
  onDeleteReminder?: (id: string) => void;
  onStatusChangeReminder?: (id: string, status: string) => void;
  isFullHeight?: boolean;
  hideNotch?: boolean;
}

interface ReminderItem {
  id: string;
  title?: string | null;
  projectName: string;
  clientName: string;
  responsible: string;
  dueDate: string | null;
  status?: string;
  notes?: string | null;
  projectId?: string | null;
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const clean = d.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${day}.${m}.${y}.`;
  }
  return d;
}

export const ReminderPanel: React.FC<Props> = ({
  projects = [],
  reminders = [],
  onSaveReminder,
  onDeleteReminder,
  onStatusChangeReminder,
  isFullHeight = false,
  hideNotch = false,
}) => {
  const { t } = useLanguage();
  const { currentUser, isAdmin, isManager } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedReminder, setSelectedReminder] = useState<ReminderItem | null>(null);

  // Form states for details / edit dialog
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [responsible, setResponsible] = useState('');
  const [status, setStatus] = useState('Pending');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const items: ReminderItem[] = useMemo(() => {
    if (reminders && reminders.length > 0) {
      return reminders.map((r) => ({
        id: r.id,
        title: r.title || null,
        projectName: r.projectName || '',
        clientName: r.clientName || '',
        responsible: r.responsible || '—',
        dueDate: r.dueDate || null,
        status: r.status,
        notes: r.notes || null,
        projectId: r.projectId,
      }));
    }
    return projects
      .filter((p) => p.nextSample && !p.done)
      .map((p) => ({
        id: p.id,
        title: p.name,
        projectName: p.name,
        clientName: p.clientName,
        responsible: p.responsible || '—',
        dueDate: p.nextSample,
        status: 'Pending',
        notes: null,
        projectId: p.id,
      }));
  }, [reminders, projects]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aDone = a.status?.toLowerCase() === 'completed' || a.status === 'Završeno' || a.status === 'Завршено';
      const bDone = b.status?.toLowerCase() === 'completed' || b.status === 'Završeno' || b.status === 'Завршено';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [items]);

  const canEdit = useMemo(() => {
    if (!selectedReminder) return false;
    if (isAdmin || isManager) return true;
    if (!currentUser) return false;
    const respName = (selectedReminder.responsible || '').trim().toLowerCase();
    const curName = (currentUser.name || '').trim().toLowerCase();
    return respName !== '' && respName === curName;
  }, [isAdmin, isManager, currentUser, selectedReminder]);

  const handleOpenDetails = (item: ReminderItem) => {
    setSelectedReminder(item);
    setTitle(item.title || item.projectName || '');
    setProjectName(item.projectName);
    setClientName(item.clientName);
    setResponsible(item.responsible === '—' ? '' : item.responsible);
    setStatus(item.status || 'Pending');
    setDueDate(item.dueDate ? item.dueDate.split('T')[0] : '');
    setNotes(item.notes || '');
  };

  const handleCloseDetails = () => {
    setSelectedReminder(null);
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const finalTitle = title.trim() || projectName.trim();
    if (!finalTitle) {
      alert(t('alertReminderTitleRequired'));
      return;
    }
    if (onSaveReminder && selectedReminder) {
      onSaveReminder({
        id: selectedReminder.id,
        title: finalTitle,
        projectId: selectedReminder.projectId || null,
        projectName: projectName.trim() || null,
        clientName: clientName.trim() || null,
        responsible: responsible || null,
        status,
        dueDate: dueDate || null,
        notes: notes || null,
      });
    }
    handleCloseDetails();
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const paginatedItems = sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          position: 'relative',
          height: '100%',
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          mt: hideNotch ? 0 : 1,
          boxSizing: 'border-box',
        }}
      >
        {/* NOTCHED TITLE */}
        {!hideNotch && (
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: -8,
              left: 20,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              px: 0.75,
              py: 0.1,
              color: 'text.secondary',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.4px',
              lineHeight: 1,
              zIndex: 1,
            }}
          >
            {t('remindersTitle')}
          </Typography>
        )}

        <CardContent sx={{ p: 2, pt: hideNotch ? 2 : 2.25, pb: '4px !important', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <Box
            sx={{
              maxHeight: isFullHeight ? 'none' : 320,
              overflowY: isFullHeight ? 'visible' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              width: '100%',
              flex: 1,
              pb: 1,
            }}
          >
            {sortedItems.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('emptyReminders')}
                </Typography>
              </Paper>
            ) : (
              paginatedItems.map((item) => {
                const isCompleted =
                  item.status?.toLowerCase() === 'completed' || item.status === 'Završeno' || item.status === 'Завршено';

                const itemCanEdit =
                  isAdmin ||
                  isManager ||
                  (currentUser &&
                    item.responsible &&
                    item.responsible.trim().toLowerCase() === (currentUser.name || '').trim().toLowerCase());

                return (
                  <Box
                    key={item.id}
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
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, flexWrap: 'wrap' }}>
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
                          {item.title || item.projectName || '—'}
                        </Typography>
                        {item.clientName && (
                          <Chip
                            label={item.clientName}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', color: 'text.secondary', fontSize: '0.75rem' }}>
                        {item.dueDate && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <CalendarTodayIcon sx={{ fontSize: '0.8rem' }} />
                            {fmtDate(item.dueDate)}
                          </Typography>
                        )}
                        {item.responsible && item.responsible !== '—' && (
                          <Typography variant="caption" color="text.secondary">
                            • {item.responsible}
                          </Typography>
                        )}
                        {getStatusChip(item.status)}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, flexShrink: 0 }}>
                      <Tooltip title={isCompleted ? t('statusPending') : t('statusCompleted')}>
                        <IconButton
                          size="small"
                          color={isCompleted ? 'default' : 'success'}
                          onClick={() => {
                            if (onStatusChangeReminder) {
                              onStatusChangeReminder(item.id, isCompleted ? 'Pending' : 'Completed');
                            } else if (onSaveReminder) {
                              onSaveReminder({ id: item.id, status: isCompleted ? 'Pending' : 'Completed' });
                            }
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={itemCanEdit ? t('btnEdit') : t('btnDetails')}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDetails(item)}
                        >
                          {itemCanEdit ? <EditIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      {onDeleteReminder && itemCanEdit && (
                        <Tooltip title={t('btnDelete')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteReminder(item.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          {sortedItems.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={sortedItems.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ borderTop: 1, borderColor: 'divider', mt: 0.5, flexShrink: 0 }}
            />
          )}
        </CardContent>
      </Card>

      {/* REMINDER DETAILS / EDIT DIALOG */}
      <Dialog open={Boolean(selectedReminder)} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmitDetails}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {canEdit ? t('modalEditReminder') : t('modalReminderDetails')}
          </DialogTitle>
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
                  disabled={!canEdit}
                  required
                  autoFocus
                />
              </Grid>

              {/* Project Name */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('colProject')}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={!canEdit}
                />
              </Grid>

              {/* Client Name */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('colClient')}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={!canEdit}
                />
              </Grid>

              {/* Responsible Person */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('colResponsible')}
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  disabled={!canEdit}
                />
              </Grid>

              {/* Status & Due Date */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" disabled={!canEdit}>
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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            {canEdit ? (
              <>
                <Button onClick={handleCloseDetails} color="inherit">
                  {t('btnCancel')}
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  {t('btnSave')}
                </Button>
              </>
            ) : (
              <Button onClick={handleCloseDetails} color="primary" variant="contained">
                {t('btnClose')}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};
