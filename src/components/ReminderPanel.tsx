import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
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
  isFullHeight?: boolean;
}

interface ReminderItem {
  id: string;
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
  isFullHeight = false,
}) => {
  const { t } = useLanguage();
  const { currentUser, isAdmin, isManager } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [selectedReminder, setSelectedReminder] = useState<ReminderItem | null>(null);

  // Form states for details / edit dialog
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
        projectName: r.projectName,
        clientName: r.clientName,
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
    if (!projectName.trim() || !clientName.trim()) {
      alert(t('alertProjectAndClientRequired'));
      return;
    }
    if (onSaveReminder && selectedReminder) {
      onSaveReminder({
        id: selectedReminder.id,
        projectId: selectedReminder.projectId || null,
        projectName,
        clientName,
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

  const paginatedItems = sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          mt: 1,
        }}
      >
        {/* NOTCHED TITLE */}
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

        <CardContent sx={{ p: 2, pt: 2, pb: '8px !important', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ maxHeight: isFullHeight ? 'none' : 235, overflowY: isFullHeight ? 'visible' : 'auto', flex: 1 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>{t('colProject')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>{t('colClient')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>{t('colResponsible')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>{t('lblDueDate')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                    {t('colActions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {t('emptyReminders')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => {
                    const itemCanEdit =
                      isAdmin ||
                      isManager ||
                      (currentUser &&
                        item.responsible &&
                        item.responsible.trim().toLowerCase() === (currentUser.name || '').trim().toLowerCase());

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{item.projectName}</TableCell>
                        <TableCell>{item.clientName}</TableCell>
                        <TableCell>{item.responsible}</TableCell>
                        <TableCell>{fmtDate(item.dueDate)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title={itemCanEdit ? t('btnEdit') : t('btnDetails')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDetails(item)}
                            >
                              {itemCanEdit ? <EditIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[15, 25, 50]}
            component="div"
            count={sortedItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: 1, borderColor: 'divider', mt: 'auto' }}
          />
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
              {/* Project Name */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('colProject') + ' *'}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={!canEdit}
                  required
                />
              </Grid>

              {/* Client Name */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('colClient') + ' *'}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={!canEdit}
                  required
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

