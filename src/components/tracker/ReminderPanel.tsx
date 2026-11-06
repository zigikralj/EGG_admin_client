import React, { useState, useMemo, useEffect } from 'react';
import {
  Typography,
  IconButton,
  Tooltip,
  Box,
  Chip,
  Button,
  TextField,
  Autocomplete,
} from '@mui/material';
import type { Project, Reminder, Client, User, SaveResult } from '../../types';
import { REMINDER_STATUSES, isReminderCompleted, TIME_MS } from '../../constants';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TableFilterSelector } from '../common/TableFilterSelector';
import { TableOptionsSelector } from '../common/ColumnSelector';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { ErrorDialog } from '../common/dialogs/ErrorDialog';
import { NotificationsActiveIcon, EditIcon, DeleteIcon, CheckIcon, CalendarTodayIcon, AddIcon, ArrowUpwardIcon, ArrowDownwardIcon, VisibilityIcon } from '../icons';
import { DashboardPanelSkeleton } from '../common/DashboardPanelSkeleton';
import { useTableView } from '../../hooks/useTableView';
import { useDebounce } from '../../hooks/useDebounce';
import { usePaginatedRemindersQuery } from '../../queries';
import {
  ClientAutocomplete,
  UserAutocomplete,
} from '../common/autocomplete';
import { ReminderModal } from '../reminder';

interface Props {
  projects?: Project[];
  reminders?: Reminder[];
  clients?: Client[];
  users?: User[];
  onSaveReminder?: (reminder: Partial<Reminder>) => Promise<SaveResult | void> | void;
  onDeleteReminder?: (id: string) => void;
  onStatusChangeReminder?: (id: string, status: string) => void;
  onTotalCountChange?: (total: number) => void;
  isFullHeight?: boolean;
  hideNotch?: boolean;
  openNewReminderTrigger?: number;
  onNewReminderTriggerHandled?: () => void;
  myRemindersOnly?: boolean;
  onMyRemindersOnlyChange?: (val: boolean) => void;
  quickFilters?: string[] | boolean;
  onQuickFiltersChange?: (keys: string[]) => void;
  rowsPerPageOptions?: number[];
  onRowsPerPageOptionsChange?: (options: number[]) => void;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
  clientId?: string | null;
  responsibleId?: string | null;
  createdAt?: string;
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

const isCompletedStatus = (status?: string): boolean => isReminderCompleted(status);

const isOverdueItem = (item: ReminderItem): boolean => {
  if (isCompletedStatus(item.status)) return false;
  if (!item.status) return false;
  const s = item.status.toLowerCase();
  if (s === REMINDER_STATUSES.OVERDUE || s === 'overdue' || s === 'prekoračeno' || s === 'прекорачено' || s === 'kasni' || s === 'касни') return true;
  if (!item.dueDate) return false;
  const due = new Date(item.dueDate.split('T')[0]);
  const today = new Date(new Date().toDateString());
  return due < today;
};

const isApproachingItem = (item: ReminderItem): boolean => {
  if (isCompletedStatus(item.status) || isOverdueItem(item)) return false;
  if (!item.dueDate) return false;
  const due = new Date(item.dueDate.split('T')[0]);
  const today = new Date(new Date().toDateString());
  const diffTime = due.getTime() - today.getTime();
  const diffDays = diffTime / TIME_MS.ONE_DAY;
  return diffDays >= 0 && diffDays <= 10;
};

export const ReminderPanel: React.FC<Props> = ({
  projects = [],
  reminders = [],
  clients = [],
  users = [],
  onSaveReminder,
  onDeleteReminder,
  onStatusChangeReminder,
  onTotalCountChange,
  isFullHeight = false,
  hideNotch = false,
  openNewReminderTrigger,
  onNewReminderTriggerHandled,
  myRemindersOnly: myRemindersOnlyProp = false,
  onMyRemindersOnlyChange,
  quickFilters: quickFiltersProp,
  onQuickFiltersChange,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  onRefresh,
  isRefreshing,
}) => {
  const { t } = useLanguage();
  const { currentUser, hasPermission, isRestrictedToOwn } = useAuth();
  const isRemindersRestricted = isRestrictedToOwn('reminders') || isRestrictedToOwn('tracker_reminders');

  const canCreate = hasPermission('reminders', 'create') || hasPermission('tracker_reminders', 'create');

  // Filters and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [myRemindersOnly, setMyRemindersOnly] = useState(() => {
    if (isRemindersRestricted) return false;
    if (Array.isArray(quickFiltersProp)) return quickFiltersProp.includes('my');
    if (typeof quickFiltersProp === 'boolean') return quickFiltersProp;
    return Boolean(myRemindersOnlyProp);
  });
  const [notCompletedOnly, setNotCompletedOnly] = useState(() => {
    if (Array.isArray(quickFiltersProp)) {
      return quickFiltersProp.includes('not_completed') || quickFiltersProp.includes('active');
    }
    return true;
  });

  useEffect(() => {
    if (Array.isArray(quickFiltersProp)) {
      const nextMy = !isRemindersRestricted && quickFiltersProp.includes('my');
      const nextNotCompleted = quickFiltersProp.includes('not_completed') || quickFiltersProp.includes('active');
      setMyRemindersOnly(nextMy);
      setNotCompletedOnly(nextNotCompleted);
      if (nextMy && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      } else if (!nextMy && currentUser?.name) {
        setFilterResponsible((prev) => (prev === currentUser.name ? 'all' : prev));
      }
      return;
    }
    if (typeof quickFiltersProp === 'boolean') {
      const nextMy = !isRemindersRestricted && quickFiltersProp;
      setMyRemindersOnly(nextMy);
      setNotCompletedOnly(true);
      if (nextMy && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      } else if (!nextMy && currentUser?.name) {
        setFilterResponsible((prev) => (prev === currentUser.name ? 'all' : prev));
      }
      return;
    }
    if (isRemindersRestricted) {
      setMyRemindersOnly(false);
      return;
    }
    if (myRemindersOnlyProp !== undefined) {
      setMyRemindersOnly(myRemindersOnlyProp);
      if (myRemindersOnlyProp && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      } else if (!myRemindersOnlyProp && currentUser?.name) {
        setFilterResponsible((prev) => (prev === currentUser.name ? 'all' : prev));
      }
    }
  }, [quickFiltersProp, myRemindersOnlyProp, currentUser?.name, isRemindersRestricted]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const {
    activeRowsPerPage,
    activeRowsPerPageOptions,
    setRowsPerPageValue,
    setRowsPerPageOptionsValue,
    page,
    setPage,
    sortColumn: sortOption,
    sortDirection,
    handleSortColumnChange,
    handleToggleSortDirection,
    resetSort,
  } = useTableView({
    defaultColumns: [],
    rowsPerPageProp,
    onRowsPerPageChange,
    rowsPerPageOptionsProp,
    onRowsPerPageOptionsChange,
    defaultSortField: 'dueDate',
    defaultSortDirection: 'asc',
  });

  // Modal / Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<ReminderItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, myRemindersOnly, notCompletedOnly, filterStatus, filterClient, filterResponsible, filterDateFrom, filterDateTo, sortOption, sortDirection]);

  useEffect(() => {
    if (openNewReminderTrigger && openNewReminderTrigger > 0) {
      handleOpenNew();
      if (onNewReminderTriggerHandled) onNewReminderTriggerHandled();
    }
  }, [openNewReminderTrigger]);

  const notifyQuickFilters = (nextMy: boolean, nextNotCompleted: boolean) => {
    const keys: string[] = [];
    if (!isRemindersRestricted && nextMy) keys.push('my');
    if (nextNotCompleted) keys.push('not_completed');
    onQuickFiltersChange?.(keys);
    onMyRemindersOnlyChange?.(nextMy);
  };

  const handleQuickFiltersChange = (keys: string[]) => {
    const nextMy = !isRemindersRestricted && keys.includes('my');
    const nextNotCompleted = keys.includes('not_completed');
    setMyRemindersOnly(nextMy);
    setNotCompletedOnly(nextNotCompleted);
    notifyQuickFilters(nextMy, nextNotCompleted);

    if (nextMy && currentUser?.name) {
      setFilterResponsible(currentUser.name);
    } else if (!nextMy && currentUser?.name && filterResponsible === currentUser.name) {
      setFilterResponsible('all');
    }

    if (nextNotCompleted && filterStatus === REMINDER_STATUSES.COMPLETED) {
      setFilterStatus('all');
    }
  };

  const handleFilterStatusChange = (val: string) => {
    setFilterStatus(val);
    if (val === REMINDER_STATUSES.COMPLETED && notCompletedOnly) {
      setNotCompletedOnly(false);
      notifyQuickFilters(myRemindersOnly, false);
    }
  };

  const handleFilterResponsibleChange = (val: string) => {
    setFilterResponsible(val);
    if (currentUser?.name && val === currentUser.name) {
      setMyRemindersOnly(true);
      notifyQuickFilters(true, notCompletedOnly);
    } else if (myRemindersOnly) {
      setMyRemindersOnly(false);
      notifyQuickFilters(false, notCompletedOnly);
    }
  };

  const handleClearAllFilters = () => {
    setMyRemindersOnly(false);
    setNotCompletedOnly(false);
    notifyQuickFilters(false, false);
    setFilterStatus('all');
    setFilterClient('all');
    setFilterResponsible('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchQuery('');
    resetSort();
  };

  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const isServerPaginated = reminders.length === 0;

  const effectiveStatusFilter =
    filterStatus !== 'all'
      ? filterStatus
      : notCompletedOnly
      ? 'not_completed'
      : undefined;

  const {
    data: paginatedData,
  } = usePaginatedRemindersQuery(
    {
      page,
      rowsPerPage: activeRowsPerPage,
      sortBy: sortOption,
      sortOrder: sortDirection,
      search: debouncedSearchQuery,
      status: effectiveStatusFilter,
      clientId: filterClient === 'all' ? undefined : filterClient,
      responsible: isRemindersRestricted
        ? (currentUser?.name || undefined)
        : (filterResponsible !== 'all' ? filterResponsible : undefined),
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    },
    isServerPaginated
  );

  const rawItems: ReminderItem[] = useMemo(() => {
    const list = !isServerPaginated
      ? reminders
      : (paginatedData?.items || []);

    return list.map((r) => ({
      id: r.id,
      title: r.title || null,
      projectName: r.projectName || '',
      clientName: r.clientName || '',
      responsible: r.responsible || '—',
      dueDate: r.dueDate || null,
      status: r.status || 'Pending',
      notes: r.notes || null,
      projectId: r.projectId || null,
      clientId: r.clientId || null,
      responsibleId: r.responsibleId || null,
      createdAt: r.createdAt,
    }));
  }, [reminders, isServerPaginated, paginatedData?.items]);

  const sortOptions = useMemo(() => [
    { value: 'dueDate', label: t('lblDueDate') },
    { value: 'title', label: t('colTitle') },
    { value: 'project', label: t('colProject') },
    { value: 'client', label: t('colClient') },
    { value: 'responsible', label: t('colResponsible') },
    { value: 'status', label: t('colStatus') },
    { value: 'createdAt', label: t('lblCreatedDate') },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filterAll') },
    { value: REMINDER_STATUSES.PENDING, label: t('statusPending') },
    { value: REMINDER_STATUSES.IN_PROGRESS, label: t('statusInProgress') },
    { value: REMINDER_STATUSES.COMPLETED, label: t('statusCompleted') },
    { value: REMINDER_STATUSES.OVERDUE, label: t('statusOverdue') },
  ], [t]);


  const filteredAndSortedItems = useMemo(() => {
    if (isServerPaginated) {
      return rawItems;
    }
    return rawItems
      .filter((item) => {
        if (notCompletedOnly && isCompletedStatus(item.status)) return false;

        // Restriction to own reminders
        if (isRemindersRestricted && currentUser) {
          const isMyName =
            item.responsible &&
            item.responsible !== '—' &&
            currentUser.name &&
            item.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
          const isMyId = item.responsibleId && item.responsibleId === currentUser.id;
          if (!isMyName && !isMyId) return false;
        }

        // Quick filter: My Reminders
        if (!isRemindersRestricted && myRemindersOnly && currentUser) {
          const isMyName =
            item.responsible &&
            item.responsible !== '—' &&
            currentUser.name &&
            item.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
          const isMyId = item.responsibleId && item.responsibleId === currentUser.id;
          if (!isMyName && !isMyId) return false;
        }

        const isLate = isOverdueItem(item);

        // Popover dropdown filters
        if (filterStatus !== 'all') {
          if (filterStatus === REMINDER_STATUSES.OVERDUE && !isLate) return false;
          if (filterStatus === REMINDER_STATUSES.PENDING && (item.status?.toLowerCase() !== REMINDER_STATUSES.PENDING && item.status !== 'Pending' && item.status !== 'Na čekanju' && item.status !== 'На чекању')) {
            return false;
          }
          if (filterStatus === REMINDER_STATUSES.IN_PROGRESS && (item.status?.toLowerCase() !== REMINDER_STATUSES.IN_PROGRESS && item.status?.toLowerCase() !== 'in progress' && item.status !== 'U toku' && item.status !== 'У току')) {
            return false;
          }
          if (filterStatus === REMINDER_STATUSES.COMPLETED && !isCompletedStatus(item.status)) {
            return false;
          }
        }

        if (filterClient !== 'all' && item.clientName !== filterClient) return false;
        if (filterResponsible !== 'all') {
          const isMyName =
            currentUser?.name &&
            filterResponsible === currentUser.name &&
            ((item.responsible &&
              item.responsible !== '—' &&
              currentUser.name &&
              item.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
              (item.responsibleId && item.responsibleId === currentUser.id));
          if (!isMyName && item.responsible !== filterResponsible) return false;
        }

        // Date range filter
        if (filterDateFrom || filterDateTo) {
          const dateVal = item.dueDate ? item.dueDate.slice(0, 10) : '';
          if (dateVal) {
            if (filterDateFrom && dateVal < filterDateFrom) return false;
            if (filterDateTo && dateVal > filterDateTo) return false;
          } else {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = item.title && item.title.toLowerCase().includes(q);
          const matchesProject = item.projectName && item.projectName.toLowerCase().includes(q);
          const matchesClient = item.clientName && item.clientName.toLowerCase().includes(q);
          const matchesResp = item.responsible && item.responsible.toLowerCase().includes(q);
          const matchesNotes = item.notes && item.notes.toLowerCase().includes(q);
          const matchesStatus = item.status && item.status.toLowerCase().includes(q);
          if (!matchesTitle && !matchesProject && !matchesClient && !matchesResp && !matchesNotes && !matchesStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let res = 0;
        switch (sortOption) {
          case 'dueDate': {
            const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            res = aTime - bTime;
            break;
          }
          case 'title': {
            const aTitle = a.title || a.projectName || '';
            const bTitle = b.title || b.projectName || '';
            res = aTitle.localeCompare(bTitle);
            break;
          }
          case 'project': {
            res = (a.projectName || '').localeCompare(b.projectName || '');
            break;
          }
          case 'client': {
            res = (a.clientName || '').localeCompare(b.clientName || '');
            break;
          }
          case 'responsible': {
            const aResp = a.responsible === '—' ? '' : a.responsible;
            const bResp = b.responsible === '—' ? '' : b.responsible;
            res = aResp.localeCompare(bResp);
            break;
          }
          case 'status': {
            res = (a.status || '').localeCompare(b.status || '');
            break;
          }
          case 'createdAt': {
            const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            res = aCreated - bCreated;
            break;
          }
          default:
            res = 0;
        }
        return sortDirection === 'asc' ? res : -res;
      });
  }, [rawItems, isServerPaginated, myRemindersOnly, notCompletedOnly, filterStatus, filterClient, filterResponsible, filterDateFrom, filterDateTo, searchQuery, sortOption, sortDirection, currentUser]);

  const activeFilterCount =
    (myRemindersOnly ? 1 : 0) +
    (notCompletedOnly ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterResponsible !== 'all' ? 1 : 0) +
    (filterDateFrom || filterDateTo ? 1 : 0) +
    (sortOption !== 'dueDate' || sortDirection !== 'asc' ? 1 : 0);

  const canEditSelected = useMemo(() => {
    if (!selectedReminder) return canCreate; // new reminder
    if (!hasPermission('reminders', 'edit') && !hasPermission('tracker_reminders', 'edit')) return false;
    if (isRestrictedToOwn('reminders') || isRestrictedToOwn('tracker_reminders')) {
      if (!currentUser) return false;
      const respName = (selectedReminder.responsible || '').trim().toLowerCase();
      const curName = (currentUser.name || '').trim().toLowerCase();
      const isIdMatch = Boolean(selectedReminder.responsibleId && selectedReminder.responsibleId === currentUser.id);
      return (respName !== '' && respName === curName) || isIdMatch;
    }
    return true;
  }, [hasPermission, isRestrictedToOwn, currentUser, selectedReminder, canCreate]);

  const canDeleteSelected = useMemo(() => {
    if (!selectedReminder || !onDeleteReminder) return false;
    if (!hasPermission('reminders', 'delete') && !hasPermission('tracker_reminders', 'delete')) return false;
    if (isRestrictedToOwn('reminders') || isRestrictedToOwn('tracker_reminders')) {
      if (!currentUser) return false;
      const respName = (selectedReminder.responsible || '').trim().toLowerCase();
      const curName = (currentUser.name || '').trim().toLowerCase();
      const isIdMatch = Boolean(selectedReminder.responsibleId && selectedReminder.responsibleId === currentUser.id);
      return (respName !== '' && respName === curName) || isIdMatch;
    }
    return true;
  }, [hasPermission, isRestrictedToOwn, currentUser, selectedReminder, onDeleteReminder]);

  const handleOpenNew = () => {
    setSelectedReminder(null);
    setIsDialogOpen(true);
  };

  const handleOpenDetails = (item: ReminderItem) => {
    setSelectedReminder(item);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedReminder(null);
  };

  const handleSaveReminder = async (reminderData: Partial<Reminder>) => {
    const finalTitle = reminderData.title?.trim() || reminderData.projectName?.trim();
    if (!finalTitle) {
      setErrorDialogState({
        open: true,
        message: t('alertReminderTitleRequired'),
      });
      return false;
    }
    if (onSaveReminder) {
      setIsSaving(true);
      try {
        const res = await onSaveReminder(reminderData);

        if (res && typeof res === 'object' && 'success' in res) {
          if (res.success) {
            handleCloseDialog();
            return true;
          } else {
            setErrorDialogState({
              open: true,
              message: res.error || t('errorSavingReminder'),
            });
            return false;
          }
        } else {
          handleCloseDialog();
          return true;
        }
      } catch (err: any) {
        setErrorDialogState({
          open: true,
          message: err?.message || t('errorSavingReminder'),
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    } else {
      handleCloseDialog();
      return true;
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

  const getStatusChip = (st?: string) => {
    if (!st) return null;
    const lower = st.toLowerCase();
    if (lower === REMINDER_STATUSES.COMPLETED) {
      return <Chip label={t('statusCompleted')} color="success" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
    }
    if (lower === REMINDER_STATUSES.IN_PROGRESS || lower === 'in progress') {
      return <Chip label={t('statusInProgress')} color="info" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
    }
    if (lower === REMINDER_STATUSES.OVERDUE) {
      return <Chip label={t('statusOverdue')} color="error" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
    }
    return <Chip label={t('statusPending')} color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
  };

  const paginatedItems = isServerPaginated
    ? rawItems
    : filteredAndSortedItems.slice(page * activeRowsPerPage, page * activeRowsPerPage + activeRowsPerPage);

  const totalCount = isServerPaginated ? (paginatedData?.total ?? 0) : filteredAndSortedItems.length;

  useEffect(() => {
    onTotalCountChange?.(totalCount);
  }, [totalCount, onTotalCountChange]);

  return (
    <>
      <DashboardPanelSkeleton
        title={t('remindersTitle')}
        icon={<NotificationsActiveIcon fontSize="small" sx={{ mr: 0.5 }} />}
        isFullHeight={isFullHeight}
        hideNotch={hideNotch}
        isEmpty={isServerPaginated ? (paginatedData?.items?.length === 0) : (filteredAndSortedItems.length === 0)}
        emptyMessage={t('emptyReminders')}
        paginationProps={{
          count: totalCount,
          page: page,
          rowsPerPage: activeRowsPerPage,
          rowsPerPageOptions: activeRowsPerPageOptions,
          onPageChange: handleChangePage,
          onRowsPerPageChange: handleChangeRowsPerPage,
        }}
        actionButton={
          onSaveReminder && canCreate && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenNew}
              size="small"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, py: 0.25 }}
            >
              {t('btnNewReminder')}
            </Button>
          )
        }
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
        }}
        quickFiltersProps={{
          options: [
            {
              key: 'my',
              label: t('quickFilterMyReminders'),
              hidden: !currentUser || isRemindersRestricted,
              color: 'primary',
            },
            {
              key: 'not_completed',
              label: t('quickFilterNotCompleted'),
              color: 'primary',
            },
          ],
          selectedKeys: [
            ...(!isRemindersRestricted && myRemindersOnly ? ['my'] : []),
            ...(notCompletedOnly ? ['not_completed'] : []),
          ],
          onChange: handleQuickFiltersChange,
        }}
        refreshProps={onRefresh ? { onRefresh, isRefreshing } : undefined}
        filterSelector={
          <TableFilterSelector
            activeCount={activeFilterCount}
            onClear={handleClearAllFilters}
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
                  value={sortOptions.find((o) => o.value === sortOption) || sortOptions[0]}
                  onChange={(_, newValue) => {
                    if (newValue) handleSortColumnChange(newValue.value);
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
                  valueMode="name"
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
        }
        tableOptions={
          <TableOptionsSelector
            rowsPerPageOptions={activeRowsPerPageOptions}
            onRowsPerPageOptionsChange={setRowsPerPageOptionsValue}
            rowsPerPage={activeRowsPerPage}
            onRowsPerPageChange={setRowsPerPageValue}
            defaultRowsPerPageOptions={[10, 20, 50]}
          />
        }
        listContent={
          paginatedItems.map((item) => {
            const isCompleted = isCompletedStatus(item.status);
            const isLate = isOverdueItem(item);
            const isApproaching = isApproachingItem(item);

            const isOwner =
              Boolean(
                currentUser &&
                  ((item.responsible &&
                    item.responsible.trim().toLowerCase() === (currentUser.name || '').trim().toLowerCase()) ||
                    (item.responsibleId && item.responsibleId === currentUser.id))
              );

            const isItemRestricted = isRestrictedToOwn('reminders') || isRestrictedToOwn('tracker_reminders');

            const itemCanEdit =
              (hasPermission('reminders', 'edit') || hasPermission('tracker_reminders', 'edit')) &&
              (!isItemRestricted ? true : isOwner);

            const itemCanDelete =
              (hasPermission('reminders', 'delete') || hasPermission('tracker_reminders', 'delete')) &&
              (!isItemRestricted ? true : isOwner);

            let cardBgColor = isLate ? 'error.lighter' : isApproaching ? 'warning.lighter' : 'background.paper';
            let borderColor = isLate ? 'error.light' : isApproaching ? '#ff9800' : 'divider';

            if (isCompleted) {
              cardBgColor = 'action.hover';
              borderColor = 'divider';
            }

            return (
              <Box
                key={item.id}
                onClick={() => handleOpenDetails(item)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.25,
                  px: 1.5,
                  bgcolor: cardBgColor,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: borderColor,
                  opacity: isCompleted ? 0.75 : 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isLate && !isCompleted ? 'error.lighter' : isCompleted ? 'action.selected' : 'action.hover',
                  },
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: isCompleted ? 'text.secondary' : 'text.primary',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      mb: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <NotificationsActiveIcon sx={{ fontSize: 16, color: isLate && !isCompleted ? 'error.main' : 'primary.main' }} />
                    {item.title}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: isLate && !isCompleted ? 'error.main' : 'text.secondary',
                        fontWeight: isLate && !isCompleted ? 700 : 400,
                      }}
                    >
                      <CalendarTodayIcon sx={{ fontSize: '0.8rem' }} />
                      {fmtDate(item.dueDate)}
                    </Typography>

                    {(item.clientName || item.projectName) && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>
                          {item.clientName || item.projectName}
                        </Typography>
                        {item.clientName && item.projectName && ` • ${item.projectName}`}
                      </Typography>
                    )}

                    {item.responsible && item.responsible !== '—' && (
                      <Typography variant="caption" color="text.secondary">
                        • {item.responsible}
                      </Typography>
                    )}
                    {getStatusChip(isLate && !isCompleted ? 'Overdue' : item.status)}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, flexShrink: 0 }}>
                  {itemCanEdit && (
                    <Tooltip title={isCompleted ? t('statusPending') : t('statusCompleted')}>
                      <IconButton
                        size="small"
                        color={isCompleted ? 'default' : 'success'}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStatusChangeReminder) {
                            onStatusChangeReminder(item.id, isCompleted ? REMINDER_STATUSES.PENDING : REMINDER_STATUSES.COMPLETED);
                          } else if (onSaveReminder) {
                            onSaveReminder({ id: item.id, status: isCompleted ? REMINDER_STATUSES.PENDING : REMINDER_STATUSES.COMPLETED });
                          }
                        }}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={itemCanEdit ? t('btnEdit') : t('btnDetails')}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(item);
                      }}
                    >
                      {itemCanEdit ? <EditIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  {onDeleteReminder && itemCanDelete && (
                    <Tooltip title={t('btnDelete')}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteReminder(item.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            );
          })
        }
      />

      {/* REMINDER DETAILS / EDIT / CREATE DIALOG */}
      <ReminderModal
        open={isDialogOpen}
        onClose={handleCloseDialog}
        editingReminder={selectedReminder}
        initialMode={selectedReminder ? 'view' : 'create'}
        canCreate={canCreate}
        canEdit={canEditSelected}
        canDelete={canDeleteSelected}
        onDelete={onDeleteReminder ? (id) => { handleCloseDialog(); onDeleteReminder(id); } : undefined}
        onStatusChange={onStatusChangeReminder}
        isRestricted={isRemindersRestricted}
        currentUser={currentUser}
        projects={projects}
        clients={clients}
        users={users}
        onSave={handleSaveReminder}
        isSaving={isSaving}
      />

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
};
