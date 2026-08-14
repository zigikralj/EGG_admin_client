import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableSortLabel,
  TextField,
  Button,
  IconButton,
  Chip,
  Box,
  Typography,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import type { Reminder, Project, Client, User } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ColumnSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';

interface Props {
  reminders: Reminder[];
  projects: Project[];
  clients: Client[];
  users: User[];
  onSaveReminder: (reminder: Partial<Reminder>) => void;
  onDeleteReminder: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  sortState?: { field: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
}

const DEFAULT_COLUMNS = ['project', 'client', 'responsible', 'status', 'notes'];

export const RemindersView: React.FC<Props> = ({
  reminders,
  projects,
  clients,
  users,
  onSaveReminder,
  onDeleteReminder,
  onStatusChange,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  sortState,
  onSortChange,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [localColumns, setLocalColumns] = useState<string[]>(visibleColumns);
  const [searchQuery, setSearchQuery] = useState('');

  const [sortColumn, setSortColumn] = useState<string>(sortState?.field || 'project');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(sortState?.direction || 'asc');

  useEffect(() => {
    if (sortState) {
      setSortColumn(sortState.field || 'project');
      setSortDirection(sortState.direction || 'asc');
    }
  }, [sortState]);

  const handleSort = (colId: string) => {
    let newDir: 'asc' | 'desc' = 'asc';
    if (sortColumn === colId) {
      newDir = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortColumn(colId);
    setSortDirection(newDir);
    if (onSortChange) {
      onSortChange({ field: colId, direction: newDir });
    }
  };

  // Quick Filter state ('all' | 'my' | 'pending')
  const [quickFilter, setQuickFilter] = useState<'all' | 'my' | 'pending'>('all');

  // Popover Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');

  const handleQuickFilterChange = (val: 'all' | 'my' | 'pending') => {
    setQuickFilter(val);
    if (val === 'my' && currentUser?.name) {
      setFilterResponsible(currentUser.name);
    } else if (val !== 'my' && currentUser?.name && filterResponsible === currentUser.name) {
      setFilterResponsible('all');
    }
  };

  const handleFilterResponsibleChange = (val: string) => {
    setFilterResponsible(val);
    if (currentUser?.name && val === currentUser.name) {
      if (quickFilter !== 'pending') {
        setQuickFilter('my');
      }
    } else if (quickFilter === 'my') {
      setQuickFilter('all');
    }
  };

  const activeFilterCount =
    (quickFilter === 'pending' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterResponsible !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setQuickFilter('all');
    setFilterStatus('all');
    setFilterResponsible('all');
  };

  // Form states
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [selectedResponsibleId, setSelectedResponsibleId] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');
  const [status, setStatus] = useState<string>('Pending');
  const [notes, setNotes] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');

  const activeCols = onVisibleColumnsChange ? visibleColumns : localColumns;
  const setCols = (cols: string[]) => {
    setLocalColumns(cols);
    if (onVisibleColumnsChange) onVisibleColumnsChange(cols);
  };

  const columnDefs: ColumnDef[] = [
    { id: 'project', label: t('colProject') },
    { id: 'client', label: t('colClient') },
    { id: 'responsible', label: t('colResponsible') },
    { id: 'status', label: t('colStatus') },
    { id: 'notes', label: t('colNotes') },
  ];

  const handleOpenNew = () => {
    setEditingReminder(null);
    setSelectedProjectId('');
    setProjectName('');
    setSelectedClientId('');
    setClientName('');
    setSelectedResponsibleId('');
    setResponsible('');
    setStatus('Pending');
    setNotes('');
    setDueDate('');
    setIsOpen(true);
  };

  const handleOpenEdit = (rem: Reminder) => {
    setEditingReminder(rem);
    setSelectedProjectId(rem.projectId || '');
    setProjectName(rem.projectName || '');
    setSelectedClientId(rem.clientId || '');
    setClientName(rem.clientName || '');
    setSelectedResponsibleId(rem.responsibleId || '');
    setResponsible(rem.responsible || '');
    setStatus(rem.status || 'Pending');
    setNotes(rem.notes || '');
    setDueDate(rem.dueDate || '');
    setIsOpen(true);
  };

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) return;
    const proj = projects.find((p) => p.id === projId);
    if (proj) {
      setProjectName(proj.name);
      if (proj.clientId) {
        setSelectedClientId(proj.clientId);
        setClientName(proj.clientName);
      } else {
        setClientName(proj.clientName || '');
      }
      if (proj.responsible) {
        setResponsible(proj.responsible);
        const usr = users.find((u) => u.name === proj.responsible);
        if (usr) setSelectedResponsibleId(usr.id);
      }
    }
  };

  const handleClientSelect = (cId: string) => {
    setSelectedClientId(cId);
    const cli = clients.find((c) => c.id === cId);
    if (cli) {
      setClientName(cli.name);
    }
  };

  const handleResponsibleSelect = (uId: string) => {
    setSelectedResponsibleId(uId);
    const usr = users.find((u) => u.id === uId);
    if (usr) {
      setResponsible(usr.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !clientName.trim()) {
      alert(t('alertProjectAndClientRequired'));
      return;
    }

    onSaveReminder({
      id: editingReminder?.id,
      projectId: selectedProjectId || null,
      projectName,
      clientId: selectedClientId || null,
      clientName,
      responsibleId: selectedResponsibleId || null,
      responsible: responsible || null,
      status,
      notes: notes || null,
      dueDate: dueDate || null,
    });

    setIsOpen(false);
  };

  const uniqueResponsibles = Array.from(
    new Set([
      ...(currentUser?.name ? [currentUser.name] : []),
      ...reminders.map((r) => r.responsible).filter(Boolean),
    ])
  ) as string[];

  // 1. Apply Quick & Popover Filters
  const filteredReminders = reminders.filter((rem) => {
    if (quickFilter === 'my' && currentUser) {
      const isMyName =
        rem.responsible &&
        currentUser.name &&
        rem.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
      const isMyId = rem.responsibleId && rem.responsibleId === currentUser.id;
      if (!isMyName && !isMyId) return false;
    }
    if (quickFilter === 'pending' && rem.status.toLowerCase() === 'completed') return false;

    if (filterStatus !== 'all' && rem.status !== filterStatus) return false;
    if (filterResponsible !== 'all' && rem.responsible !== filterResponsible) return false;
    return true;
  });

  // 2. Search among filtered items
  const searchedReminders = filteredReminders.filter((rem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rem.projectName.toLowerCase().includes(q) ||
      rem.clientName.toLowerCase().includes(q) ||
      (rem.responsible && rem.responsible.toLowerCase().includes(q)) ||
      (rem.status && rem.status.toLowerCase().includes(q)) ||
      (rem.notes && rem.notes.toLowerCase().includes(q))
    );
  });

  // 3. Sort final dataset
  const sortedReminders = [...searchedReminders].sort((a, b) => {
    let res = 0;
    switch (sortColumn) {
      case 'project':
        res = a.projectName.localeCompare(b.projectName);
        break;
      case 'client':
        res = a.clientName.localeCompare(b.clientName);
        break;
      case 'responsible':
        res = (a.responsible || '').localeCompare(b.responsible || '');
        break;
      case 'status':
        res = (a.status || '').localeCompare(b.status || '');
        break;
      case 'notes':
        res = (a.notes || '').localeCompare(b.notes || '');
        break;
      default:
        res = 0;
    }
    return sortDirection === 'asc' ? res : -res;
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, quickFilter, filterStatus, filterResponsible]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedReminders = sortedReminders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStatusChip = (st: string) => {
    switch (st.toLowerCase()) {
      case 'completed':
      case 'završeno':
      case 'завршено':
        return <Chip label={t('statusCompleted')} color="success" size="small" sx={{ fontWeight: 600 }} />;
      case 'in progress':
      case 'u toku':
      case 'у току':
        return <Chip label={t('statusInProgress')} color="info" size="small" sx={{ fontWeight: 600 }} />;
      case 'overdue':
      case 'prekoračeno':
      case 'прекорачено':
        return <Chip label={t('statusOverdue')} color="error" size="small" sx={{ fontWeight: 600 }} />;
      case 'pending':
      case 'na čekanju':
      case 'на чекању':
      default:
        return <Chip label={t('statusPending')} color="warning" size="small" sx={{ fontWeight: 600 }} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', flex: 1, minHeight: 0 }}>
      {/* TOP ACTION BAR */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, alignItems: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNew}
          sx={{ fontWeight: 600, borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
        >
          {t('btnNewReminder')}
        </Button>
      </Box>

      {/* TABLE CARD */}
      <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            width: '100%',
            flexWrap: 'wrap',
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('remindersAllTitle', { count: sortedReminders.length })}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            {/* SEARCH INPUT FIELD */}
            <TextField
              size="small"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: '100%', sm: 180 } }}
            />

            {/* QUICK FILTERS TOGGLE */}
            <ToggleButtonGroup
              size="small"
              value={quickFilter}
              exclusive
              onChange={(_, val) => {
                if (val) handleQuickFilterChange(val);
              }}
              color="primary"
              sx={{ bgcolor: 'background.paper', borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
            >
              <ToggleButton value="all" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>
                {t('quickFilterAll')}
              </ToggleButton>
              {currentUser && (
                <ToggleButton value="my" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>
                  {t('quickFilterMyReminders')}
                </ToggleButton>
              )}
              <ToggleButton value="pending" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>
                {t('statusPending')}
              </ToggleButton>
            </ToggleButtonGroup>

            {/* ADVANCED FILTER SELECTOR */}
            <TableFilterSelector activeCount={activeFilterCount} onClear={clearFilters}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('colStatus')}</InputLabel>
                <Select
                  value={filterStatus}
                  label={t('colStatus')}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">{t('filterAll')}</MenuItem>
                  <MenuItem value="Pending">{t('statusPending')}</MenuItem>
                  <MenuItem value="In Progress">{t('statusInProgress')}</MenuItem>
                  <MenuItem value="Completed">{t('statusCompleted')}</MenuItem>
                  <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>{t('colResponsible')}</InputLabel>
                <Select
                  value={filterResponsible}
                  label={t('colResponsible')}
                  onChange={(e) => handleFilterResponsibleChange(e.target.value)}
                >
                  <MenuItem value="all">{t('filterAll')}</MenuItem>
                  {uniqueResponsibles.map((resp) => (
                    <MenuItem key={resp} value={resp}>
                      {resp}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </TableFilterSelector>

            {/* COLUMN SELECTOR */}
            <ColumnSelector columns={columnDefs} visibleColumns={activeCols} onChange={setCols} />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <Table stickyHeader sx={{ width: '100%', minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {activeCols.includes('project') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'project'}
                      direction={sortColumn === 'project' ? sortDirection : 'asc'}
                      onClick={() => handleSort('project')}
                    >
                      {t('colProject')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('client') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'client'}
                      direction={sortColumn === 'client' ? sortDirection : 'asc'}
                      onClick={() => handleSort('client')}
                    >
                      {t('colClient')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('responsible') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'responsible'}
                      direction={sortColumn === 'responsible' ? sortDirection : 'asc'}
                      onClick={() => handleSort('responsible')}
                    >
                      {t('colResponsible')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('status') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'status'}
                      direction={sortColumn === 'status' ? sortDirection : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      {t('colStatus')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('notes') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'notes'}
                      direction={sortColumn === 'notes' ? sortDirection : 'asc'}
                      onClick={() => handleSort('notes')}
                    >
                      {t('colNotes')}
                    </TableSortLabel>
                  </TableCell>
                )}
                <TableCell align="right">{t('colActions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedReminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + 1} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {t('emptyReminders')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReminders.map((rem) => (
                  <TableRow key={rem.id} hover>
                    {activeCols.includes('project') && (
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {rem.projectName}
                        </Typography>
                        {rem.dueDate && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {t('lblDueDate')}: {rem.dueDate}
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    {activeCols.includes('client') && <TableCell>{rem.clientName}</TableCell>}
                    {activeCols.includes('responsible') && <TableCell>{rem.responsible || '—'}</TableCell>}
                    {activeCols.includes('status') && <TableCell>{getStatusChip(rem.status)}</TableCell>}
                    {activeCols.includes('notes') && (
                      <TableCell sx={{ maxWidth: 260, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {rem.notes || '—'}
                      </TableCell>
                    )}
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        {onStatusChange && rem.status !== 'Completed' && (
                          <Tooltip title={t('statusCompleted')}>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => onStatusChange(rem.id, 'Completed')}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={t('btnEdit')}>
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(rem)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('btnDelete')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteReminder(rem.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[15, 25, 50]}
          component="div"
          count={sortedReminders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingReminder ? t('modalEditReminder') : t('modalNewReminder')}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              {/* Project Selection / Custom Name */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('colProject')}</InputLabel>
                  <Select
                    value={selectedProjectId}
                    label={t('colProject')}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>-- Custom / Unlinked Project --</em>
                    </MenuItem>
                    {projects.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} ({p.clientName})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('colProject') + ' *'}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </Grid>

              {/* Client Selection / Custom Name */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('colClient')}</InputLabel>
                  <Select
                    value={selectedClientId}
                    label={t('colClient')}
                    onChange={(e) => handleClientSelect(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>-- Custom Client --</em>
                    </MenuItem>
                    {clients.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('colClient') + ' *'}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </Grid>

              {/* Responsible Selection / Custom Name */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('colResponsible')}</InputLabel>
                  <Select
                    value={selectedResponsibleId}
                    label={t('colResponsible')}
                    onChange={(e) => handleResponsibleSelect(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>-- Custom Person --</em>
                    </MenuItem>
                    {users.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('colResponsible')}
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
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
            <Button onClick={() => setIsOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
