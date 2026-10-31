import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Tooltip,
  Autocomplete,
} from '@mui/material';







import type { Reminder, TableViewProps } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TableOptionsSelector, type ColumnDef } from '../../components/common/ColumnSelector';
import { TableFilterSelector } from '../../components/common/TableFilterSelector';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { TableQuickFilters, type QuickFilterItem } from '../../components/common/TableQuickFilters';
import { ErrorDialog } from '../../components/common/dialogs/ErrorDialog';
import { ReminderModal } from '../../components/reminder';
import type { ModalMode } from '../../components/common/modal/ViewEditModalBase';
import { useTableView } from '../../hooks/useTableView';
import { AddIcon, EditIcon, DeleteIcon, CheckIcon, ArrowUpwardIcon, ArrowDownwardIcon, RefreshIcon } from '../../components/icons';

interface Props extends Partial<TableViewProps> {
  quickFilters?: string[];
  onQuickFiltersChange?: (val: string[]) => void;
  quickFilter?: any;
  onQuickFilterChange?: (val: any) => void;
}

const DEFAULT_COLUMNS = ['title', 'project', 'client', 'responsible', 'status', 'notes'];

import {
  usePaginatedRemindersQuery,
  useRemindersMutations,
  useTablePreferences,
} from '../../queries';
import { useDebounce } from '../../hooks/useDebounce';
import { ConfirmDialog } from '../../components/common/dialogs/ConfirmDialog';
import { ClientAutocomplete, UserAutocomplete } from '../../components/common/autocomplete';

const RemindersPage: React.FC<Props> = ({
  visibleColumns: visibleColumnsProp,
  onVisibleColumnsChange: onVisibleColumnsChangeProp,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange: onRowsPerPageOptionsChangeProp,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange: onRowsPerPageChangeProp,
  sortState: sortStateProp,
  onSortChange: onSortChangeProp,
  quickFilters: quickFiltersProp,
  onQuickFiltersChange: onQuickFiltersChangeProp,
  quickFilter: quickFilterProp,
  onQuickFilterChange: onQuickFilterChangeProp,
}) => {
  const tablePrefs = useTablePreferences('reminders');
  const visibleColumns = visibleColumnsProp ?? tablePrefs.visibleColumns ?? DEFAULT_COLUMNS;
  const onVisibleColumnsChange = onVisibleColumnsChangeProp ?? tablePrefs.onVisibleColumnsChange;
  const rowsPerPageOptions = rowsPerPageOptionsProp ?? tablePrefs.rowsPerPageOptions;
  const onRowsPerPageOptionsChange = onRowsPerPageOptionsChangeProp ?? tablePrefs.onRowsPerPageOptionsChange;
  const rowsPerPage = rowsPerPageProp ?? tablePrefs.rowsPerPage;
  const onRowsPerPageChange = onRowsPerPageChangeProp ?? tablePrefs.onRowsPerPageChange;
  const sortState = sortStateProp ?? tablePrefs.sortState;
  const onSortChange = onSortChangeProp ?? tablePrefs.onSortChange;
  const { t } = useLanguage();
  const { hasPermission, currentUser, isRestrictedToOwn } = useAuth();
  const isRemindersRestricted = isRestrictedToOwn('reminders') || isRestrictedToOwn('tracker_reminders');
  const canCreate = hasPermission('reminders', 'create');
  const canEdit = hasPermission('reminders', 'edit');
  const canDelete = hasPermission('reminders', 'delete');
  const hasAnyRowAction = canEdit || canDelete;

  const getItemPermissions = useCallback((rem: Reminder) => {
    let canEditRem = canEdit;
    let canDeleteRem = canDelete;
    const isItemRestricted = isRestrictedToOwn('reminders') || isRestrictedToOwn('tracker_reminders');
    if (isItemRestricted && currentUser) {
      const isMyName = rem.responsible && currentUser.name && rem.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
      const isMyId = rem.responsibleId && rem.responsibleId === currentUser.id;
      if (!isMyName && !isMyId) {
        canEditRem = false;
        canDeleteRem = false;
      }
    }
    return { canEdit: canEditRem, canDelete: canDeleteRem };
  }, [canEdit, canDelete, isRestrictedToOwn, currentUser]);

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
    rowsPerPageProp: rowsPerPage,
    onRowsPerPageChange,
    rowsPerPageOptionsProp: rowsPerPageOptions,
    onRowsPerPageOptionsChange,
    sortState,
    onSortChange,
    onRefresh: () => {
      refetchPaginatedReminders();
    },
    defaultSortField: 'title',
    defaultSortDirection: 'asc',
  });

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('dueDate');

  const { handleSave, handleDelete, handleStatusChangeReminder: handleStatusChange } = useRemindersMutations();

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const onDeleteReminder = (id: string) => {
    if (!canDelete) return;
    handleDelete(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));
  };

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const prefQuickFilters = Array.isArray(tablePrefs.quickFilters)
    ? tablePrefs.quickFilters
    : (tablePrefs.quickFilters && tablePrefs.quickFilters !== 'all' ? [tablePrefs.quickFilters] : []);

  // Quick Filter state
  const [quickFilters, setQuickFilters] = useState<string[]>(() => {
    let initial: string[] = [];
    if (Array.isArray(quickFiltersProp)) initial = quickFiltersProp;
    else if (typeof quickFilterProp === 'string' && quickFilterProp !== 'all') initial = [quickFilterProp];
    else if (prefQuickFilters.length > 0) initial = prefQuickFilters;
    return isRemindersRestricted ? initial.filter((k) => k !== 'my') : initial;
  });

  const {
    data: paginatedData,
    refetch: refetchPaginatedReminders,
  } = usePaginatedRemindersQuery({
    page,
    rowsPerPage: activeRowsPerPage,
    sortBy: sortColumn,
    sortOrder: sortDirection,
    search: debouncedSearchQuery,
    status: quickFilters.includes('overdue')
      ? 'overdue'
      : quickFilters.includes('approaching')
      ? 'approaching'
      : quickFilters.includes('pending')
      ? 'pending'
      : quickFilters.includes('completed')
      ? 'completed'
      : (filterStatus !== 'all' ? filterStatus : undefined),
    clientId: filterClient !== 'all' ? filterClient : undefined,
    responsible: isRemindersRestricted
      ? (currentUser?.name || undefined)
      : (quickFilters.includes('my') && currentUser?.name ? currentUser.name : (filterResponsible !== 'all' ? filterResponsible : undefined)),
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
    dateField: filterDateField,
  });

  const rawReminders = paginatedData?.items || [];
  const totalReminders = paginatedData?.total ?? rawReminders.length;
  const displayedReminders = rawReminders;

  useEffect(() => {
    if (Array.isArray(quickFiltersProp)) {
      setQuickFilters(isRemindersRestricted ? quickFiltersProp.filter((k) => k !== 'my') : quickFiltersProp);
    } else if (typeof quickFilterProp === 'string') {
      const initial = quickFilterProp === 'all' ? [] : [quickFilterProp];
      setQuickFilters(isRemindersRestricted ? initial.filter((k) => k !== 'my') : initial);
    }
  }, [quickFiltersProp, quickFilterProp, isRemindersRestricted]);

  useEffect(() => {
    if (isRemindersRestricted) {
      setQuickFilters((prev) => prev.filter((k) => k !== 'my'));
    }
  }, [isRemindersRestricted]);

  const notifyQuickFiltersChange = (keys: string[]) => {
    if (onQuickFiltersChangeProp) {
      onQuickFiltersChangeProp(keys);
    } else {
      tablePrefs.onQuickFiltersChange(keys);
    }
    onQuickFilterChangeProp?.((keys[0] as any) || 'all');
  };

  const handleToggleFilter = (filterKey: string, checked: boolean) => {
    const updated = checked
      ? [...quickFilters, filterKey]
      : quickFilters.filter((k) => k !== filterKey);
    setQuickFilters(updated);
    notifyQuickFiltersChange(updated);

    if (filterKey === 'my') {
      if (checked && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      } else if (!checked && currentUser?.name && filterResponsible === currentUser.name) {
        setFilterResponsible('all');
      }
    } else if (filterKey === 'pending') {
      if (checked) {
        setFilterStatus('Pending');
      } else if (!checked && filterStatus === 'Pending') {
        setFilterStatus('all');
      }
    }
  };

  const reminderQuickFilterOptions: QuickFilterItem[] = useMemo(() => [
    { key: 'my', label: t('quickFilterMyReminders'), hidden: !currentUser || isRemindersRestricted, color: 'primary' },
    { key: 'pending', label: t('statusPending'), color: 'primary' },
  ], [t, currentUser, isRemindersRestricted]);

  const handleQuickFiltersChange = (newKeys: string[]) => {
    const added = newKeys.find((k) => !quickFilters.includes(k));
    const removed = quickFilters.find((k) => !newKeys.includes(k));
    if (added) handleToggleFilter(added, true);
    else if (removed) handleToggleFilter(removed, false);
    else {
      setQuickFilters(newKeys);
      notifyQuickFiltersChange(newKeys);
    }
  };

  const handleFilterResponsibleChange = (val: string) => {
    setFilterResponsible(val);
    if (currentUser?.name && val === currentUser.name) {
      if (!quickFilters.includes('my')) {
        const updated = [...quickFilters, 'my'];
        setQuickFilters(updated);
        notifyQuickFiltersChange(updated);
      }
    } else if (quickFilters.includes('my')) {
      const updated = quickFilters.filter((k) => k !== 'my');
      setQuickFilters(updated);
      notifyQuickFiltersChange(updated);
    }
  };

  const handleFilterStatusChange = (val: string) => {
    setFilterStatus(val);
    if (val === 'Pending') {
      if (!quickFilters.includes('pending')) {
        const updated = [...quickFilters, 'pending'];
        setQuickFilters(updated);
        notifyQuickFiltersChange(updated);
      }
    } else if (quickFilters.includes('pending')) {
      const updated = quickFilters.filter((k) => k !== 'pending');
      setQuickFilters(updated);
      notifyQuickFiltersChange(updated);
    }
  };

  const activeFilterCount =
    quickFilters.length +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterResponsible !== 'all' ? 1 : 0) +
    (filterDateFrom || filterDateTo ? 1 : 0) +
    (sortColumn !== 'title' || sortDirection !== 'asc' ? 1 : 0);

  const clearFilters = () => {
    setQuickFilters([]);
    notifyQuickFiltersChange([]);
    setFilterStatus('all');
    setFilterClient('all');
    setFilterResponsible('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('dueDate');
    resetSort();
  };

  const columnDefs: ColumnDef[] = [
    { id: 'title', label: t('colTitle') },
    { id: 'project', label: t('colProject') },
    { id: 'client', label: t('colClient') },
    { id: 'permit', label: t('lblPermit') },
    { id: 'responsible', label: t('colResponsible') },
    { id: 'status', label: t('colStatus') },
    { id: 'notes', label: t('colNotes') },
  ];

  const [modalMode, setModalMode] = useState<ModalMode>('view');

  const handleOpenNew = () => {
    if (!canCreate) return;
    setEditingReminder(null);
    setModalMode('create');
    setIsOpen(true);
  };

  const handleOpenEdit = (rem: Reminder) => {
    if (!getItemPermissions(rem).canEdit) return;
    setEditingReminder(rem);
    setModalMode('edit');
    setIsOpen(true);
  };

  const handleOpenView = (rem: Reminder) => {
    setEditingReminder(rem);
    setModalMode('view');
    setIsOpen(true);
  };

  const handleSaveReminder = async (reminderData: Partial<Reminder>) => {
    if (editingReminder && !getItemPermissions(editingReminder).canEdit) return;
    if (!editingReminder && !canCreate) return;
    const finalTitle = reminderData.title?.trim() || reminderData.projectName?.trim();
    if (!finalTitle) {
      setErrorDialogState({
        open: true,
        message: t('alertReminderTitleRequired'),
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await handleSave({
        ...reminderData,
        title: finalTitle,
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

  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, quickFilters, filterStatus, filterClient, filterResponsible, filterDateFrom, filterDateTo, setPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

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
      {canCreate && (
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
      )}

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
              {t('remindersAllTitle', { count: totalReminders })}
            </Typography>
              <Tooltip title={t('btnRefresh')}>
                <span>
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
                </span>
              </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            {/* SEARCH INPUT FIELD */}
            <TableSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
            />

            {/* QUICK FILTERS */}
            <TableQuickFilters
              options={reminderQuickFilterOptions}
              selectedKeys={quickFilters}
              onChange={handleQuickFiltersChange}
            />

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

                  <ClientAutocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    value={filterClient === 'all' ? null : filterClient}
                    valueMode="id"
                    onChange={(val) => setFilterClient(val || 'all')}
                    label={t('colClient')}
                  />

                  <UserAutocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    value={filterResponsible === 'all' ? null : filterResponsible}
                    valueMode="name"
                    restrictedPermission="reminders"
                    onChange={(val) => handleFilterResponsibleChange(val || 'all')}
                    label={t('colResponsible')}
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
                {hasAnyRowAction && <TableCell align="right">{t('colActions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedReminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + (hasAnyRowAction ? 1 : 0)} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {t('emptyReminders')}
                  </TableCell>
                </TableRow>
              ) : (
                displayedReminders.map((rem) => {
                  const { canEdit: itemCanEdit, canDelete: itemCanDelete } = getItemPermissions(rem);
                  return (
                    <TableRow key={rem.id} hover onClick={() => handleOpenView(rem)} sx={{ cursor: 'pointer' }}>
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
                    {activeCols.includes('permit') && (
                      <TableCell>
                        {rem.permitNumber ? (
                          <Chip label={rem.permitNumber} size="small" variant="outlined" color="primary" />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    )}
                    {activeCols.includes('responsible') && <TableCell>{rem.responsible || '—'}</TableCell>}
                    {activeCols.includes('status') && <TableCell>{getStatusChip(rem.status)}</TableCell>}
                    {activeCols.includes('notes') && (
                      <TableCell sx={{ maxWidth: 260, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {rem.notes || '—'}
                      </TableCell>
                    )}
                    {hasAnyRowAction && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {itemCanEdit && rem.status !== 'Completed' && (
                            <Tooltip title={t('statusCompleted')}>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await handleStatusChange(rem.id, 'Completed');
                                }}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {itemCanEdit && (
                            <Tooltip title={t('btnEdit')}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(rem);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {itemCanDelete && (
                            <Tooltip title={t('btnDelete')}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteReminder(rem.id);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={activeRowsPerPageOptions}
          component="div"
          count={totalReminders}
          rowsPerPage={activeRowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* CREATE / EDIT / VIEW DIALOG */}
      <ReminderModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        editingReminder={editingReminder}
        initialMode={modalMode}
        canCreate={canCreate}
        canEdit={editingReminder ? getItemPermissions(editingReminder).canEdit : canCreate}
        canDelete={editingReminder ? getItemPermissions(editingReminder).canDelete : false}
        onDelete={(id) => {
          setIsOpen(false);
          onDeleteReminder(id);
        }}
        onStatusChange={handleStatusChange}
        isRestricted={isRemindersRestricted}
        currentUser={currentUser}
        onSave={handleSaveReminder}
        isSaving={isSaving}
      />

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState((prev) => ({ ...prev, open: false }))}
      />
      <ConfirmDialog
        open={deleteConfirmState.open}
        title={t('confirmDeleteTitle')}
        message={deleteConfirmState.message}
        confirmLabel={t('btnDelete')}
        onConfirm={deleteConfirmState.onConfirm}
        onClose={() => setDeleteConfirmState((prev) => ({ ...prev, open: false }))}
        confirmColor="warning"
      />
    </Box>
  );
};

export default RemindersPage;
