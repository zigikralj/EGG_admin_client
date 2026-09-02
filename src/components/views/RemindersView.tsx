import React, { useState, useEffect, useMemo } from 'react';
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
  Autocomplete,
} from '@mui/material';







import type { Reminder, Project, Client, User, SaveResult, TableViewProps } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TableOptionsSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';
import { DateRangeFilter } from '../DateRangeFilter';
import { TableSearchInput } from '../TableSearchInput';
import { ErrorDialog } from '../ErrorDialog';
import { useTableView } from '../../hooks/useTableView';
import { AddIcon, EditIcon, DeleteIcon, CheckIcon, ArrowUpwardIcon, ArrowDownwardIcon, RefreshIcon } from '../icons';

interface Props extends TableViewProps {
  reminders: Reminder[];
  projects: Project[];
  clients: Client[];
  users: User[];
  onSaveReminder: (reminder: Partial<Reminder>) => Promise<SaveResult | void> | void;
  onDeleteReminder: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  quickFilter?: 'all' | 'my' | 'pending';
  onQuickFilterChange?: (val: 'all' | 'my' | 'pending') => void;
}

const DEFAULT_COLUMNS = ['title', 'project', 'client', 'responsible', 'status', 'notes'];

const RemindersView: React.FC<Props> = ({
  reminders,
  projects,
  clients,
  users,
  onSaveReminder,
  onDeleteReminder,
  onStatusChange,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  sortState,
  onSortChange,
  quickFilter: quickFilterProp,
  onQuickFilterChange,
  onRefresh,
}) => {
  const { t, getResponsibleLabel } = useLanguage();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const {
    activeCols,
    setCols,
    activeRowsPerPage,
    activeRowsPerPageOptions,
    setRowsPerPageValue,
    setRowsPerPageOptionsValue,
    page,
    setPage,
    sortColumn,
    sortDirection,
    handleSort,
    handleSortColumnChange,
    handleToggleSortDirection,
    resetSort,
    isRefreshing,
    handleRefresh,
    isSaving,
    setIsSaving,
    errorDialogState,
    setErrorDialogState,
  } = useTableView({
    defaultColumns: DEFAULT_COLUMNS,
    visibleColumns,
    onVisibleColumnsChange,
    rowsPerPageProp,
    onRowsPerPageChange,
    rowsPerPageOptionsProp,
    onRowsPerPageOptionsChange,
    sortState,
    onSortChange,
    onRefresh,
    defaultSortField: 'title',
    defaultSortDirection: 'asc',
  });
  const [searchQuery, setSearchQuery] = useState('');



  // Quick Filter state ('all' | 'my' | 'pending')
  const [quickFilter, setQuickFilter] = useState<'all' | 'my' | 'pending'>(
    quickFilterProp || 'all'
  );

  // Popover Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('dueDate');

  useEffect(() => {
    if (quickFilterProp !== undefined) {
      setQuickFilter(quickFilterProp);
      if (quickFilterProp === 'my' && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      } else if (quickFilterProp === 'pending') {
        setFilterStatus('Pending');
      } else if (quickFilterProp === 'all') {
        if (currentUser?.name && filterResponsible === currentUser.name) {
          setFilterResponsible('all');
        }
        if (filterStatus === 'Pending') {
          setFilterStatus('all');
        }
      }
    }
  }, [quickFilterProp, currentUser?.name]);

  const handleQuickFilterChange = (val: 'all' | 'my' | 'pending') => {
    setQuickFilter(val);
    onQuickFilterChange?.(val);
    if (val === 'my') {
      if (currentUser?.name) setFilterResponsible(currentUser.name);
      if (filterStatus === 'Pending') setFilterStatus('all');
    } else if (val === 'pending') {
      setFilterStatus('Pending');
      if (currentUser?.name && filterResponsible === currentUser.name) setFilterResponsible('all');
    } else if (val === 'all') {
      if (currentUser?.name && filterResponsible === currentUser.name) setFilterResponsible('all');
      if (filterStatus === 'Pending') setFilterStatus('all');
    }
  };

  const handleFilterResponsibleChange = (val: string) => {
    setFilterResponsible(val);
    if (currentUser?.name && val === currentUser.name) {
      if (quickFilter !== 'pending') {
        setQuickFilter('my');
        onQuickFilterChange?.('my');
      }
    } else if (quickFilter === 'my') {
      setQuickFilter('all');
      onQuickFilterChange?.('all');
    }
  };

  const handleFilterStatusChange = (val: string) => {
    setFilterStatus(val);
    if (val === 'Pending') {
      setQuickFilter('pending');
      onQuickFilterChange?.('pending');
    } else if (quickFilter === 'pending') {
      setQuickFilter('all');
      onQuickFilterChange?.('all');
    }
  };



  const activeFilterCount =
    (quickFilter === 'pending' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterResponsible !== 'all' ? 1 : 0) +
    (filterDateFrom || filterDateTo ? 1 : 0) +
    (sortColumn !== 'title' || sortDirection !== 'asc' ? 1 : 0);

  const clearFilters = () => {
    setQuickFilter('all');
    onQuickFilterChange?.('all');
    setFilterStatus('all');
    setFilterClient('all');
    setFilterResponsible('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('dueDate');
    resetSort();
  };

  // Form states
  const [title, setTitle] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [selectedResponsibleId, setSelectedResponsibleId] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');
  const [status, setStatus] = useState<string>('Pending');
  const [notes, setNotes] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');



  const columnDefs: ColumnDef[] = [
    { id: 'title', label: t('colTitle') },
    { id: 'project', label: t('colProject') },
    { id: 'client', label: t('colClient') },
    { id: 'responsible', label: t('colResponsible') },
    { id: 'status', label: t('colStatus') },
    { id: 'notes', label: t('colNotes') },
  ];

  const handleOpenNew = () => {
    setEditingReminder(null);
    setTitle('');
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
    setTitle(rem.title || rem.projectName || '');
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
      if (!title) {
        setTitle(proj.name);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || projectName.trim();
    if (!finalTitle) {
      setErrorDialogState({
        open: true,
        message: t('alertReminderTitleRequired'),
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await onSaveReminder({
        id: editingReminder?.id,
        title: finalTitle,
        projectId: selectedProjectId || null,
        projectName: projectName.trim() || null,
        clientId: selectedClientId || null,
        clientName: clientName.trim() || null,
        responsibleId: selectedResponsibleId || null,
        responsible: responsible || null,
        status,
        notes: notes || null,
        dueDate: dueDate || null,
      });

      if (res && typeof res === 'object' && 'success' in res) {
        if (res.success) {
          setIsOpen(false);
        } else {
          setErrorDialogState({
            open: true,
            message: res.error || t('errorSavingReminder'),
          });
        }
      } else {
        setIsOpen(false);
      }
    } catch (err: any) {
      setErrorDialogState({
        open: true,
        message: err?.message || t('errorSavingReminder'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const uniqueClients = Array.from(
    new Set(reminders.map((r) => r.clientName).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b));

  const otherResponsibles = Array.from(
    new Set(reminders.map((r) => r.responsible).filter(Boolean) as string[])
  )
    .filter((r) => !currentUser?.name || r.trim().toLowerCase() !== currentUser.name.trim().toLowerCase())
    .sort((a, b) => a.localeCompare(b));

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
    if (filterClient !== 'all' && rem.clientName !== filterClient) return false;
    if (filterResponsible !== 'all') {
      const isMyName =
        currentUser?.name &&
        filterResponsible === currentUser.name &&
        ((rem.responsible && rem.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
          (rem.responsibleId && rem.responsibleId === currentUser.id));
      if (!isMyName && rem.responsible !== filterResponsible) return false;
    }

    // Date range filter
    if (filterDateFrom || filterDateTo) {
      let rawDate: string | null | undefined = null;
      if (filterDateField === 'createdAt') {
        rawDate = rem.createdAt;
      } else {
        rawDate = rem.dueDate;
      }
      const dateVal = rawDate ? rawDate.slice(0, 10) : '';
      if (dateVal) {
        if (filterDateFrom && dateVal < filterDateFrom) return false;
        if (filterDateTo && dateVal > filterDateTo) return false;
      } else {
        return false;
      }
    }

    return true;
  });

  // 2. Search among filtered items
  const searchedReminders = filteredReminders.filter((rem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (rem.title && rem.title.toLowerCase().includes(q)) ||
      (rem.projectName && rem.projectName.toLowerCase().includes(q)) ||
      (rem.clientName && rem.clientName.toLowerCase().includes(q)) ||
      (rem.responsible && rem.responsible.toLowerCase().includes(q)) ||
      (rem.status && rem.status.toLowerCase().includes(q)) ||
      (rem.notes && rem.notes.toLowerCase().includes(q))
    );
  });

  // 3. Sort final dataset
  const sortedReminders = [...searchedReminders].sort((a, b) => {
    let res = 0;
    switch (sortColumn) {
      case 'title':
        res = (a.title || a.projectName || '').localeCompare(b.title || b.projectName || '');
        break;
      case 'project':
        res = (a.projectName || '').localeCompare(b.projectName || '');
        break;
      case 'client':
        res = (a.clientName || '').localeCompare(b.clientName || '');
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
      case 'dueDate':
        res = (a.dueDate ? new Date(a.dueDate).getTime() : 0) - (b.dueDate ? new Date(b.dueDate).getTime() : 0);
        break;
      case 'createdAt':
        res = (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        break;
      default:
        res = 0;
    }
    return sortDirection === 'asc' ? res : -res;
  });

  useEffect(() => {
    setPage(0);
  }, [searchQuery, quickFilter, filterStatus, filterClient, filterResponsible, setPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

  const paginatedReminders = sortedReminders.slice(page * activeRowsPerPage, page * activeRowsPerPage + activeRowsPerPage);

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
      case 'kasni':
      case 'касни':
        return <Chip label={t('statusOverdue')} color="error" size="small" sx={{ fontWeight: 600 }} />;
      case 'pending':
      case 'na čekanju':
      case 'на чекању':
      default:
        return <Chip label={t('statusPending')} color="warning" size="small" sx={{ fontWeight: 600 }} />;
    }
  };

  const responsibleOptions = useMemo(() => {
    const list: string[] = [];
    if (currentUser?.name) list.push(currentUser.name);
    list.push(...otherResponsibles);
    return list;
  }, [currentUser?.name, otherResponsibles]);

  const sortOptions = useMemo(() => [
    { value: 'title', label: t('colTitle') },
    { value: 'project', label: t('colProject') },
    { value: 'client', label: t('colClient') },
    { value: 'responsible', label: t('colResponsible') },
    { value: 'status', label: t('colStatus') },
    { value: 'dueDate', label: t('lblDueDate') },
    { value: 'createdAt', label: t('lblCreatedDate') },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: 'Pending', label: t('statusPending') },
    { value: 'In Progress', label: t('statusInProgress') },
    { value: 'Completed', label: t('statusCompleted') },
    { value: 'Overdue', label: t('statusOverdue') },
  ], [t]);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('remindersAllTitle', { count: sortedReminders.length })}
            </Typography>
            {onRefresh && (
              <Tooltip title={t('btnRefresh')}>
                <IconButton
                  size="small"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  color="primary"
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 0.7,
                  }}
                >
                  <RefreshIcon
                    fontSize="small"
                    sx={{
                      animation: isRefreshing ? 'spin 1s linear infinite' : undefined,
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            {/* SEARCH INPUT FIELD */}
            <TableSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
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
            <TableFilterSelector
              activeCount={activeFilterCount}
              onClear={clearFilters}
              sortingContent={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    disableClearable
                    options={sortOptions}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, val) => option.value === val.value}
                    value={sortOptions.find((o) => o.value === sortColumn) || sortOptions[0]}
                    onChange={(_, newValue) => {
                      if (newValue) handleSortColumnChange(newValue.value as any);
                    }}
                    renderInput={(params) => <TextField {...params} label={t('lblSortBy')} size="small" />}
                  />
                  <IconButton
                    size="small"
                    onClick={handleToggleSortDirection}
                    title={sortDirection === 'asc' ? t('sortAscending') : t('sortDescending')}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.75 }}
                  >
                    {sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                  </IconButton>
                </Box>
              }
              dateRangeContent={
                <DateRangeFilter
                  startDate={filterDateFrom}
                  endDate={filterDateTo}
                  onDateChange={({ startDate, endDate }) => {
                    setFilterDateFrom(startDate);
                    setFilterDateTo(endDate);
                  }}
                  dateField={filterDateField}
                  dateFieldOptions={[
                    { value: 'dueDate', label: t('lblDueDate') },
                    { value: 'createdAt', label: t('lblCreatedDate') },
                  ]}
                  onDateFieldChange={setFilterDateField}
                />
              }
              filteringContent={
                <>
                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={statusOptions}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, val) => option.value === val.value}
                    value={statusOptions.find((o) => o.value === filterStatus) || null}
                    onChange={(_, newValue) => handleFilterStatusChange(newValue ? newValue.value : 'all')}
                    renderInput={(params) => <TextField {...params} label={t('colStatus')} size="small" />}
                  />

                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={uniqueClients}
                    value={filterClient === 'all' ? null : filterClient}
                    onChange={(_, newValue) => setFilterClient(newValue || 'all')}
                    renderInput={(params) => <TextField {...params} label={t('colClient')} size="small" />}
                  />

                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={responsibleOptions}
                    getOptionLabel={(option) => {
                      if (currentUser?.name && option === currentUser.name) {
                        return `${t('lblMe')} (${currentUser.name})`;
                      }
                      return option;
                    }}
                    value={filterResponsible === 'all' ? null : filterResponsible}
                    onChange={(_, newValue) => handleFilterResponsibleChange(newValue || 'all')}
                    renderInput={(params) => <TextField {...params} label={t('colResponsible')} size="small" />}
                  />
                </>
              }
            />

            {/* TABLE OPTIONS SELECTOR */}
            <TableOptionsSelector
              columns={columnDefs}
              visibleColumns={activeCols}
              onChange={setCols}
              rowsPerPageOptions={activeRowsPerPageOptions}
              onRowsPerPageOptionsChange={setRowsPerPageOptionsValue}
              rowsPerPage={activeRowsPerPage}
              onRowsPerPageChange={setRowsPerPageValue}
            />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <Table stickyHeader sx={{ width: '100%', minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {activeCols.includes('title') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'title'}
                      direction={sortColumn === 'title' ? sortDirection : 'asc'}
                      onClick={() => handleSort('title')}
                    >
                      {t('colTitle')}
                    </TableSortLabel>
                  </TableCell>
                )}
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
                    {activeCols.includes('title') && (
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {rem.title || rem.projectName || '—'}
                        </Typography>
                        {rem.dueDate && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {t('lblDueDate')}: {rem.dueDate}
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    {activeCols.includes('project') && (
                      <TableCell>
                        {rem.projectName || '—'}
                      </TableCell>
                    )}
                    {activeCols.includes('client') && <TableCell>{rem.clientName || '—'}</TableCell>}
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
          rowsPerPageOptions={activeRowsPerPageOptions}
          component="div"
          count={sortedReminders.length}
          rowsPerPage={activeRowsPerPage}
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
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('colProject')}
                    />
                  )}
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
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('colClient')}
                    />
                  )}
                />
              </Grid>

              {/* Responsible Selection / Custom Name */}
              {(() => {
                const respLabel = getResponsibleLabel(selectedResponsibleId || responsible, users);
                const selectableUsers = users.filter((u) => {
                  const isSelected =
                    (Boolean(selectedResponsibleId) && u.id === selectedResponsibleId) ||
                    (Boolean(responsible) && u.name.trim().toLowerCase() === responsible.trim().toLowerCase());
                  if (isSelected) return true;
                  const isBlocked = u.status === 'BLOCKED' || u.status?.toLowerCase() === 'blocked' || (u.isApproved === false && u.status !== 'PENDING');
                  if (isBlocked) return false;
                  if (u.role === 'Administrator') return false;
                  return true;
                });
                return (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      key={respLabel}
                      freeSolo
                      size="small"
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
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={respLabel}
                        />
                      )}
                    />
                  </Grid>
                );
              })()}

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
            <Button onClick={() => setIsOpen(false)} color="inherit" disabled={isSaving}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
              {isSaving ? '...' : t('btnSave')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default RemindersView;
