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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Tooltip,
  Select,
  MenuItem,
  Menu,
  FormControl,
  InputLabel,
} from '@mui/material';

import {
  PERMIT_TYPE_OPTIONS,
  type Client,
  type Permit,
  type Reminder,
  type TableViewProps,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTableView } from '../../hooks/useTableView';
import { TableOptionsSelector, type ColumnDef } from '../../components/common/ColumnSelector';
import { TableFilterSelector } from '../../components/common/TableFilterSelector';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { TableQuickFilters, type QuickFilterItem } from '../../components/common/TableQuickFilters';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { PermitModal } from '../../components/dialogs/PermitModal';
import { ErrorDialog } from '../../components/dialogs/ErrorDialog';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  CloseIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  RefreshIcon,
  NotificationsActiveIcon,
  CheckCircleIcon,
  WarningAmberIcon,
  ErrorIcon,
  FilterListIcon,
  HistoryIcon,
} from '../../components/icons';
import { HistoryTimelineModal } from '../../components/history';

interface Props extends TableViewProps {
  quickFilters?: string[];
  onQuickFiltersChange?: (val: string[]) => void;
  quickFilter?: any;
  onQuickFilterChange?: (val: any) => void;
}

const DEFAULT_COLUMNS = [
  'indexNumber',
  'permitNumber',
  'permitTypes',
  'client',
  'startDate',
  'endDate',
  'status',
  'reminders',
  'notes',
];

export const getPermitStatus = (
  endDateStr: string | null | undefined
): {
  status: 'expired' | 'expiring' | 'active' | 'none';
  daysLeft?: number;
} => {
  if (!endDateStr) return { status: 'none' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr.split('T')[0]);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', daysLeft: Math.abs(diffDays) };
  } else if (diffDays <= 30) {
    return { status: 'expiring', daysLeft: diffDays };
  } else {
    return { status: 'active', daysLeft: diffDays };
  }
};

import { usePermitsQuery, useClientsQuery, useRemindersQuery, usePermitsMutations, useRemindersMutations } from '../../queries';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';

const ExpandableChipList = ({ wcs, max = 2 }: { wcs: any[]; max?: number }) => {
  const [expanded, setExpanded] = React.useState(false);
  
  if (wcs.length <= max) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {wcs.map((wc, i) => (
          <Tooltip key={i} title={`${wc.code} - ${wc.description || ''}${wc.hazardListMark ? ` (${wc.hazardListMark})` : ''}`}>
            <Chip
              label={wc.code}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
            />
          </Tooltip>
        ))}
      </Box>
    );
  }

  const visibleWcs = expanded ? wcs : wcs.slice(0, max);
  
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
      {visibleWcs.map((wc, i) => (
        <Tooltip key={i} title={`${wc.code} - ${wc.description || ''}${wc.hazardListMark ? ` (${wc.hazardListMark})` : ''}`}>
          <Chip
            label={wc.code}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
          />
        </Tooltip>
      ))}
      <Chip
        label={expanded ? '−' : `+${wcs.length - max}`}
        size="small"
        color="default"
        variant="filled"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem', cursor: 'pointer', minWidth: 24 }}
      />
    </Box>
  );
};

const PermitsPage: React.FC<Props> = ({
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  sortState,
  onSortChange,
  quickFilters: quickFiltersProp,
  onQuickFiltersChange,
  quickFilter: quickFilterProp,
  onQuickFilterChange,
}) => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('permits', 'create');
  const canEdit = hasPermission('permits', 'edit');
  const canDelete = hasPermission('permits', 'delete');
  const canViewHistory = hasPermission('history', 'view');
  const hasAnyRowAction = canEdit || canDelete || canViewHistory;

  const canCreateReminder = hasPermission('reminders', 'create');
  const canEditReminder = hasPermission('reminders', 'edit');
  const canDeleteReminder = hasPermission('reminders', 'delete');

  const [isOpen, setIsOpen] = useState(false);
  const [editingPermit, setEditingPermit] = useState<Permit | null>(null);
  const [historyModalState, setHistoryModalState] = useState<{ open: boolean; permit: Permit | null }>({ open: false, permit: null });

  const { data: permits = [], refetch: refetchPermits } = usePermitsQuery();
  const { data: clients = [] } = useClientsQuery();
  const { data: reminders = [] } = useRemindersQuery();
  const { handleSave: handleSavePermit, handleDelete: handleDeletePermit } = usePermitsMutations();
  const { handleSave: handleSaveReminder, handleDelete: handleDeleteReminder } = useRemindersMutations();

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const onDeletePermit = (id: string) => handleDeletePermit(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));
  const onDeleteReminder = (id: string) => handleDeleteReminder(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));

  const getLinkedClient = useCallback((p: Permit | null | undefined): Client | null => {
    if (!p) return null;
    if (p.client) return p.client;
    if (p.clientId) {
      const found = clients.find((c) => c.id === p.clientId);
      if (found) return found;
    }
    if (p.clients && p.clients.length > 0) return p.clients[0];
    const foundInClients = clients.find(
      (c) =>
        c.permits?.some((cp) => cp.id === p.id) ||
        c.permitId === p.id ||
        c.extraData?.permitId === p.id
    );
    return foundInClients || null;
  }, [clients]);

  // Edit modal for existing reminders
  const [editingReminderModalItem, setEditingReminderModalItem] = useState<Reminder | null>(null);
  const [editReminderModalTitle, setEditReminderModalTitle] = useState('');
  const [editReminderModalDueDate, setEditReminderModalDueDate] = useState('');
  const [editReminderModalStatus, setEditReminderModalStatus] = useState('Pending');
  const [editReminderModalNotes, setEditReminderModalNotes] = useState('');

  // Quick reminder creation modal tied to permit from row action
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [targetPermitForReminder, setTargetPermitForReminder] = useState<Permit | null>(null);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDueDate, setNewReminderDueDate] = useState('');
  const [newReminderNotes, setNewReminderNotes] = useState('');

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
    onRefresh: () => { refetchPermits(); },
    defaultSortField: 'endDate',
    defaultSortDirection: 'asc',
  });

  // Quick Filter state
  const [quickFilters, setQuickFilters] = useState<string[]>(() => {
    if (Array.isArray(quickFiltersProp)) return quickFiltersProp;
    if (typeof quickFilterProp === 'string' && quickFilterProp !== 'all') return [quickFilterProp];
    return [];
  });

  useEffect(() => {
    if (Array.isArray(quickFiltersProp)) {
      setQuickFilters(quickFiltersProp);
    } else if (typeof quickFilterProp === 'string') {
      setQuickFilters(quickFilterProp === 'all' ? [] : [quickFilterProp]);
    }
  }, [quickFiltersProp, quickFilterProp]);

  const permitQuickFilterOptions: QuickFilterItem[] = useMemo(() => [
    { key: 'active', label: t('statusActivePermit'), color: 'primary' },
    { key: 'expiring', label: t('quickFilterExpiringPermits'), color: 'warning', labelColor: 'warning.main' },
    { key: 'expired', label: t('quickFilterExpiredPermits'), color: 'error', labelColor: 'error.main' },
  ], [t]);

  const handleQuickFiltersChange = (newKeys: string[]) => {
    setQuickFilters(newKeys);
    onQuickFiltersChange?.(newKeys);
    onQuickFilterChange?.((newKeys[0] as any) || 'all');
  };

  // Popover filter states
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPermitType, setFilterPermitType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('endDate');
  const [permitTypeHeaderAnchor, setPermitTypeHeaderAnchor] = useState<null | HTMLElement>(null);

  const activeFilterCount =
    quickFilters.length +
    (filterClient !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterPermitType !== 'all' ? 1 : 0) +
    (filterDateFrom || filterDateTo ? 1 : 0) +
    (sortColumn !== 'endDate' || sortDirection !== 'asc' ? 1 : 0);

  const clearFilters = () => {
    setQuickFilters([]);
    onQuickFiltersChange?.([]);
    onQuickFilterChange?.('all');
    setFilterClient('all');
    setFilterStatus('all');
    setFilterPermitType('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('endDate');
    resetSort();
  };

  const getPermitTypeLabel = useCallback(
    (type: string) => {
      switch (type) {
        case 'Sakupljanje':
          return t('permitTypeSakupljanje');
        case 'Transport':
          return t('permitTypeTransport');
        case 'Skladistenje':
          return t('permitTypeSkladistenje');
        case 'Tretman':
          return t('permitTypeTretman');
        case 'Odlaganje':
          return t('permitTypeOdlaganje');
        default:
          return type;
      }
    },
    [t]
  );

  const columnDefs: ColumnDef[] = [
    { id: 'indexNumber', label: t('colIndexNumber') },
    { id: 'permitNumber', label: t('colPermitNumber') },
    { id: 'permitTypes', label: t('colPermitType') },
    { id: 'client', label: t('colClientName') },
    { id: 'startDate', label: t('colStartDate') },
    { id: 'endDate', label: t('colEndDate') },
    { id: 'status', label: t('colStatus') },
    { id: 'reminders', label: t('linkedReminders') },
    { id: 'notes', label: t('colNotes') },
  ];

  const sortOptions = [
    { value: 'endDate', label: t('colEndDate') },
    { value: 'startDate', label: t('colStartDate') },
    { value: 'indexNumber', label: t('colIndexNumber') },
    { value: 'permitNumber', label: t('colPermitNumber') },
    { value: 'permitTypes', label: t('colPermitType') },
    { value: 'client', label: t('colClientName') },
  ];

  const [searchQuery, setSearchQuery] = useState('');

  const openNew = () => {
    if (!canCreate) return;
    setEditingPermit(null);
    setIsOpen(true);
  };

  const openEdit = (p: Permit) => {
    if (!canEdit) return;
    setEditingPermit(p);
    setIsOpen(true);
  };

  const handleOpenEditReminder = (rem: Reminder) => {
    setEditingReminderModalItem(rem);
    setEditReminderModalTitle(rem.title || '');
    setEditReminderModalDueDate(rem.dueDate ? rem.dueDate.split('T')[0] : '');
    setEditReminderModalStatus(rem.status || 'Pending');
    setEditReminderModalNotes(rem.notes || '');
  };

  const handleSaveEditedReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReminderModalItem) return;
    if (!editReminderModalTitle.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertReminderTitleRequired') || 'Naziv podsetnika je obavezan.',
      });
      return;
    }
    try {
      const res = await handleSaveReminder({
        id: editingReminderModalItem.id,
        title: editReminderModalTitle.trim(),
        dueDate: editReminderModalDueDate || null,
        status: editReminderModalStatus,
        notes: editReminderModalNotes.trim() || null,
      });
      if (res.success) setEditingReminderModalItem(null);
      else setErrorDialogState({ open: true, message: res.error || t('errorSavingProject') });
    } catch (err: any) {
      setErrorDialogState({ open: true, message: err?.message || t('errorSavingProject') });
    }
  };

  const handleUnlinkReminder = async (remId: string) => {
    try {
      await handleSaveReminder({
        id: remId,
        permitId: null,
        permitNumber: null,
      });
    } catch (err: any) {
      setErrorDialogState({ open: true, message: err?.message || t('errorSavingProject') });
    }
  };

  const openAddReminderForPermit = (p: Permit) => {
    setTargetPermitForReminder(p);
    const idxStr = p.indexNumber || p.wasteCatalog?.code || p.wasteCatalogs?.[0]?.code || '';
    setNewReminderTitle(`${t('lblPermit')}: ${p.permitNumber}${idxStr ? ` (${idxStr})` : ''}`);
    setNewReminderDueDate(p.endDate ? p.endDate.split('T')[0] : '');
    setNewReminderNotes('');
    setIsReminderModalOpen(true);
  };

  const handleSaveReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPermitForReminder) return;
    if (!newReminderTitle.trim()) return;

    const targetPermitClient = getLinkedClient(targetPermitForReminder);

    try {
      const res = await handleSaveReminder({
        title: newReminderTitle.trim(),
        clientId: targetPermitClient?.id || targetPermitForReminder.clientId || null,
        clientName:
          targetPermitClient?.name ||
          targetPermitForReminder.clientName ||
          null,
        permitId: targetPermitForReminder.id,
        permitNumber: targetPermitForReminder.permitNumber,
        dueDate: newReminderDueDate || null,
        notes: newReminderNotes.trim() || null,
        status: 'Pending',
      });
      if (res.success) {
        setIsReminderModalOpen(false);
        setTargetPermitForReminder(null);
      } else {
        setErrorDialogState({ open: true, message: res.error || t('errorSavingProject') });
      }
    } catch (err: any) {
      setErrorDialogState({ open: true, message: err?.message || t('errorSavingProject') });
    }
  };

  const handleSavePermitFromModal = async (
    permitData: any,
    stagedNewRems: Array<{ id: string; title: string; dueDate?: string; notes?: string }>,
    stagedLinkIds: string[]
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await handleSavePermit(permitData);
      const isSuccess = res.success;
      const targetPermitId = permitData.id || res.id;
      const targetPermitNumber = permitData.permitNumber;

      if (isSuccess && targetPermitId) {
        const foundClient = clients.find((c) => c.id === permitData.clientId);

        // Save staged reminders
        for (const rem of stagedNewRems) {
          await handleSaveReminder({
            title: rem.title,
            dueDate: rem.dueDate || null,
            notes: rem.notes || null,
            permitId: targetPermitId,
            permitNumber: targetPermitNumber,
            clientId: permitData.clientId || null,
            clientName: foundClient?.name || null,
            status: 'Pending',
          });
        }

        for (const remId of stagedLinkIds) {
          await handleSaveReminder({
            id: remId,
            permitId: targetPermitId,
            permitNumber: targetPermitNumber,
            clientId: permitData.clientId || null,
            clientName: foundClient?.name || null,
          });
        }

        setIsOpen(false);
        return true;
      } else if (!isSuccess) {
        setErrorDialogState({
          open: true,
          message: res.error || t('errorSavingProject'),
        });
        return false;
      } else {
        setIsOpen(false);
        return true;
      }
    } catch (err: any) {
      setErrorDialogState({
        open: true,
        message: err?.message || t('errorSavingProject'),
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Map reminders to permits
  const permitRemindersMap = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    reminders.forEach((r) => {
      if (r.permitId) {
        const existing = map.get(r.permitId) || [];
        existing.push(r);
        map.set(r.permitId, existing);
      }
    });
    return map;
  }, [reminders]);

  // Filter and sort permits
  const filteredPermits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return permits.filter((permit) => {
      // Search
      if (query) {
        const pClient = getLinkedClient(permit);
        const clientNames =
          pClient?.name ||
          (permit.clients?.length ? permit.clients.map((c) => c.name).join(' ') : '') ||
          permit.clientName ||
          '';
        const matchIndex =
          (permit.indexNumber || '').toLowerCase().includes(query) ||
          (permit.wasteCatalogs || []).some(
            (w) =>
              w.code.toLowerCase().includes(query) ||
              w.description.toLowerCase().includes(query)
          );
        const matchPermit = (permit.permitNumber || '').toLowerCase().includes(query);
        const matchClient = clientNames.toLowerCase().includes(query);
        const matchNotes = (permit.notes || '').toLowerCase().includes(query);
        const matchPermitTypes = (permit.permitTypes || []).some(
          (pt) =>
            pt.toLowerCase().includes(query) ||
            getPermitTypeLabel(pt).toLowerCase().includes(query)
        );

        if (!matchIndex && !matchPermit && !matchClient && !matchNotes && !matchPermitTypes) {
          return false;
        }
      }

      // Expiration status
      const statusObj = getPermitStatus(permit.endDate);

      // Quick filter
      if (quickFilters.length > 0) {
        const matchesAnyQuickFilter = quickFilters.some((qf) => {
          if (qf === 'expiring') return statusObj.status === 'expiring';
          if (qf === 'expired') return statusObj.status === 'expired';
          if (qf === 'active') return statusObj.status === 'active';
          return false;
        });
        if (!matchesAnyQuickFilter) return false;
      }

      // Popover Status Filter
      if (filterStatus !== 'all' && statusObj.status !== filterStatus) {
        return false;
      }

      // Permit Type filter
      if (filterPermitType !== 'all') {
        const types = (permit.permitTypes || []).map((t) => String(t).trim().toLowerCase());
        if (!types.includes(filterPermitType.trim().toLowerCase())) {
          return false;
        }
      }

      // Client filter
      if (filterClient !== 'all') {
        const pClient = getLinkedClient(permit);
        const isMatch =
          permit.clientId === filterClient ||
          pClient?.id === filterClient ||
          (permit.clients && permit.clients.some((c) => c.id === filterClient));
        if (!isMatch) return false;
      }

      // Date range filter
      if (filterDateFrom || filterDateTo) {
        const targetDateVal =
          filterDateField === 'startDate' ? permit.startDate : permit.endDate;
        if (!targetDateVal) return false;

        const d = targetDateVal.split('T')[0];
        if (filterDateFrom && d < filterDateFrom) return false;
        if (filterDateTo && d > filterDateTo) return false;
      }

      return true;
    });
  }, [
    permits,
    clients,
    searchQuery,
    quickFilters,
    filterStatus,
    filterClient,
    filterPermitType,
    filterDateFrom,
    filterDateTo,
    filterDateField,
    getPermitTypeLabel,
  ]);

  const sortedPermits = useMemo(() => {
    const result = [...filteredPermits];
    result.sort((a, b) => {
      let valA: string = '';
      let valB: string = '';

      if (sortColumn === 'indexNumber') {
        valA = a.indexNumber || a.wasteCatalogs?.map((w) => w.code).join(', ') || '';
        valB = b.indexNumber || b.wasteCatalogs?.map((w) => w.code).join(', ') || '';
      } else if (sortColumn === 'permitNumber') {
        valA = a.permitNumber || '';
        valB = b.permitNumber || '';
      } else if (sortColumn === 'client') {
        const cliA = getLinkedClient(a);
        const cliB = getLinkedClient(b);
        valA = cliA?.name || a.clientName || '';
        valB = cliB?.name || b.clientName || '';
      } else if (sortColumn === 'permitTypes') {
        valA = (a.permitTypes || []).map((pt) => getPermitTypeLabel(pt)).join(', ');
        valB = (b.permitTypes || []).map((pt) => getPermitTypeLabel(pt)).join(', ');
      } else if (sortColumn === 'startDate') {
        valA = a.startDate || '';
        valB = b.startDate || '';
      } else if (sortColumn === 'endDate') {
        valA = a.endDate || '';
        valB = b.endDate || '';
      }

      if (valA === valB) return 0;
      if (!valA) return 1;
      if (!valB) return -1;

      const comp = valA.localeCompare(valB, undefined, { numeric: true });
      return sortDirection === 'asc' ? comp : -comp;
    });
    return result;
  }, [filteredPermits, clients, sortColumn, sortDirection]);

  // Pagination
  const paginatedPermits = useMemo(() => {
    const start = page * activeRowsPerPage;
    return sortedPermits.slice(start, start + activeRowsPerPage);
  }, [sortedPermits, page, activeRowsPerPage]);

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '-';
    try {
      const parts = iso.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}.`;
      }
      return iso;
    } catch {
      return iso;
    }
  };

  const renderStatusBadge = (endDateStr: string | null | undefined) => {
    const statusObj = getPermitStatus(endDateStr);

    if (statusObj.status === 'expired') {
      return (
        <Chip
          icon={<ErrorIcon fontSize="small" />}
          label={`${t('statusExpired')}${statusObj.daysLeft ? ` (${statusObj.daysLeft} ${t('daysExpired')})` : ''}`}
          size="small"
          color="error"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    if (statusObj.status === 'expiring') {
      return (
        <Chip
          icon={<WarningAmberIcon fontSize="small" />}
          label={`${t('statusExpiring')}${statusObj.daysLeft !== undefined ? ` (${statusObj.daysLeft} ${t('daysRemaining')})` : ''}`}
          size="small"
          color="warning"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    if (statusObj.status === 'active') {
      return (
        <Chip
          icon={<CheckCircleIcon fontSize="small" />}
          label={t('statusActivePermit')}
          size="small"
          color="success"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    return (
      <Chip
        label="-"
        size="small"
        variant="outlined"
        sx={{ color: 'text.disabled' }}
      />
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', flex: 1, minHeight: 0 }}>
      {/* TOP ACTION BAR */}
      {canCreate && (
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openNew}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {t('btnNewPermit')}
          </Button>
        </Box>
      )}

      {/* TABLE CONTAINER CARD */}
      <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('permitsListTitle') || t('tabPermits')}
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            {/* QUICK FILTERS */}
            <TableQuickFilters
              options={permitQuickFilterOptions}
              selectedKeys={quickFilters}
              onChange={handleQuickFiltersChange}
            />

            {/* ACTIVE PERMIT TYPE FILTER CHIP */}
            {filterPermitType !== 'all' && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`${t('filterPermitType')}: ${getPermitTypeLabel(filterPermitType)}`}
                onDelete={() => {
                  setFilterPermitType('all');
                  setPage(0);
                }}
                sx={{ fontWeight: 600, height: 32 }}
              />
            )}

            {/* SEARCH FIELD */}
            <TableSearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setPage(0);
              }}
            />

            {/* POPOVER FILTERS */}
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
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 0.8,
                    }}
                  >
                    {sortDirection === 'asc' ? (
                      <ArrowUpwardIcon fontSize="small" />
                    ) : (
                      <ArrowDownwardIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              }
              dateRangeContent={
                <DateRangeFilter
                  startDate={filterDateFrom}
                  endDate={filterDateTo}
                  onDateChange={(range) => {
                    setFilterDateFrom(range.startDate);
                    setFilterDateTo(range.endDate);
                    setPage(0);
                  }}
                  dateField={filterDateField}
                  onDateFieldChange={(val) => {
                    setFilterDateField(val);
                    setPage(0);
                  }}
                  dateFieldOptions={[
                    { value: 'endDate', label: t('colEndDate') },
                    { value: 'startDate', label: t('colStartDate') },
                  ]}
                />
              }
              filteringContent={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Filter by Permit Type */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>{t('filterPermitType')}</InputLabel>
                    <Select
                      value={filterPermitType}
                      label={t('filterPermitType')}
                      onChange={(e) => {
                        setFilterPermitType(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="all">{t('quickFilterAll')}</MenuItem>
                      {PERMIT_TYPE_OPTIONS.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {getPermitTypeLabel(opt)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Filter by Client */}
                  <Autocomplete
                    size="small"
                    fullWidth
                    options={[{ id: 'all', name: t('quickFilterAll') }, ...clients]}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, val) => option.id === val.id}
                    value={
                      filterClient === 'all'
                        ? { id: 'all', name: t('quickFilterAll') }
                        : clients.find((c) => c.id === filterClient) || { id: 'all', name: t('quickFilterAll') }
                    }
                    onChange={(_, newValue) => {
                      setFilterClient(newValue ? newValue.id : 'all');
                      setPage(0);
                    }}
                    renderInput={(params) => <TextField {...params} label={t('lblClient')} size="small" />}
                  />

                  {/* Filter by Status */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>{t('colStatus')}</InputLabel>
                    <Select
                      value={filterStatus}
                      label={t('colStatus')}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="all">{t('filterAllStatus')}</MenuItem>
                      <MenuItem value="active">{t('statusActivePermit')}</MenuItem>
                      <MenuItem value="expiring">{t('statusExpiring')}</MenuItem>
                      <MenuItem value="expired">{t('statusExpired')}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              }
            />

            {/* TABLE OPTIONS SELECTOR (Columns, Rows per page) */}
            <TableOptionsSelector
              columns={columnDefs}
              visibleColumns={activeCols}
              onChange={setCols}
              onVisibleColumnsChange={setCols}
              rowsPerPage={activeRowsPerPage}
              onRowsPerPageChange={setRowsPerPageValue}
              rowsPerPageOptions={activeRowsPerPageOptions}
              onRowsPerPageOptionsChange={setRowsPerPageOptionsValue}
            />
          </Box>
        </Box>

        {/* TABLE */}
        <TableContainer sx={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <Table stickyHeader sx={{ width: '100%', minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {activeCols.includes('indexNumber') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'indexNumber'}
                      direction={sortColumn === 'indexNumber' ? sortDirection : 'asc'}
                      onClick={() => handleSort('indexNumber')}
                    >
                      {t('colIndexNumber')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('permitNumber') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'permitNumber'}
                      direction={sortColumn === 'permitNumber' ? sortDirection : 'asc'}
                      onClick={() => handleSort('permitNumber')}
                    >
                      {t('colPermitNumber')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('permitTypes') && (
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                      <TableSortLabel
                        active={sortColumn === 'permitTypes'}
                        direction={sortColumn === 'permitTypes' ? sortDirection : 'asc'}
                        onClick={() => handleSort('permitTypes')}
                      >
                        {t('colPermitType')}
                      </TableSortLabel>
                      <Tooltip
                        title={
                          filterPermitType !== 'all'
                            ? `${t('filterPermitType')}: ${getPermitTypeLabel(filterPermitType)}`
                            : t('filterPermitType')
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPermitTypeHeaderAnchor(e.currentTarget);
                          }}
                          color={filterPermitType !== 'all' ? 'primary' : 'default'}
                          sx={{
                            p: 0.4,
                            border: filterPermitType !== 'all' ? 1 : 0,
                            borderColor: 'primary.main',
                            bgcolor: filterPermitType !== 'all' ? 'action.selected' : 'transparent',
                          }}
                        >
                          <FilterListIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                )}
                {activeCols.includes('client') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'client'}
                      direction={sortColumn === 'client' ? sortDirection : 'asc'}
                      onClick={() => handleSort('client')}
                    >
                      {t('colClientName')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('startDate') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'startDate'}
                      direction={sortColumn === 'startDate' ? sortDirection : 'asc'}
                      onClick={() => handleSort('startDate')}
                    >
                      {t('colStartDate')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('endDate') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'endDate'}
                      direction={sortColumn === 'endDate' ? sortDirection : 'asc'}
                      onClick={() => handleSort('endDate')}
                    >
                      {t('colEndDate')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('status') && (
                  <TableCell>
                    {t('colStatus')}
                  </TableCell>
                )}
                {activeCols.includes('reminders') && (
                  <TableCell>
                    {t('linkedReminders')}
                  </TableCell>
                )}
                {activeCols.includes('notes') && (
                  <TableCell>
                    {t('colNotes')}
                  </TableCell>
                )}
                {hasAnyRowAction && (
                  <TableCell align="right" sx={{ width: 120 }}>
                    {t('colActions')}
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPermits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + (hasAnyRowAction ? 1 : 0)} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      {t('emptyPermits')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPermits.map((permit) => {
                  const linkedClient = getLinkedClient(permit);
                  const clientDisplay = linkedClient?.name || (permit.clients?.length ? permit.clients.map((c) => c.name).join(', ') : null) || permit.clientName || '—';
                  const linkedRems = permitRemindersMap.get(permit.id) || [];

                  return (
                    <TableRow
                      key={permit.id}
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        cursor: 'pointer',
                      }}
                      onClick={() => openEdit(permit)}
                    >
                      {activeCols.includes('indexNumber') && (
                        <TableCell>
                          {(() => {
                            const wcs = permit.wasteCatalogs?.length ? permit.wasteCatalogs : (permit.wasteCatalog ? [permit.wasteCatalog] : []);
                            if (!wcs.length && !permit.indexNumber) {
                              return (
                                <Typography variant="body2" color="text.disabled">
                                  —
                                </Typography>
                              );
                            }
                            if (wcs.length > 0) {
                              return <ExpandableChipList wcs={wcs} max={2} />;
                            }
                            return (
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {permit.indexNumber}
                              </Typography>
                            );
                          })()}
                        </TableCell>
                      )}
                      {activeCols.includes('permitNumber') && (
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {permit.permitNumber}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('permitTypes') && (
                        <TableCell>
                          {permit.permitTypes && permit.permitTypes.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {permit.permitTypes.map((pt) => {
                                const isSelected = filterPermitType === pt;
                                return (
                                  <Tooltip
                                    key={pt}
                                    title={
                                      isSelected
                                        ? t('btnClearFilters')
                                        : `${t('filterPermitType')}: ${getPermitTypeLabel(pt)}`
                                    }
                                  >
                                    <Chip
                                      label={getPermitTypeLabel(pt)}
                                      size="small"
                                      variant={isSelected ? 'filled' : 'outlined'}
                                      color={isSelected ? 'primary' : 'default'}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterPermitType(isSelected ? 'all' : pt);
                                        setPage(0);
                                      }}
                                      sx={{
                                        fontSize: '0.725rem',
                                        fontWeight: isSelected ? 700 : 500,
                                        height: 22,
                                        cursor: 'pointer',
                                        bgcolor: isSelected ? undefined : 'action.hover',
                                        '&:hover': {
                                          bgcolor: isSelected ? undefined : 'action.selected',
                                        },
                                      }}
                                    />
                                  </Tooltip>
                                );
                              })}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      {activeCols.includes('client') && (
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {clientDisplay}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('startDate') && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(permit.startDate)}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('endDate') && (
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatDate(permit.endDate)}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('status') && (
                        <TableCell>{renderStatusBadge(permit.endDate)}</TableCell>
                      )}
                      {activeCols.includes('reminders') && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            {linkedRems.length > 0 ? (
                              <Chip
                                icon={<NotificationsActiveIcon fontSize="small" />}
                                label={`${linkedRems.length}`}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                -
                              </Typography>
                            )}
                            {canCreateReminder && (
                              <Tooltip title={t('btnAddReminderForPermit')}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => openAddReminderForPermit(permit)}
                                  sx={{ p: 0.4 }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      )}
                      {activeCols.includes('notes') && (
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              maxWidth: 220,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {permit.notes || '-'}
                          </Typography>
                        </TableCell>
                      )}
                      {hasAnyRowAction && (
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            {canViewHistory && (
                              <Tooltip title={t('historyModalTitle')}>
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() => setHistoryModalState({ open: true, permit })}
                                >
                                  <HistoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canEdit && (
                              <Tooltip title={t('btnEdit')}>
                                <IconButton
                                  size="small"
                                  onClick={() => openEdit(permit)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title={t('btnDelete')}>
                                <IconButton
                                  size="small"
                                  onClick={() => onDeletePermit(permit.id)}
                                  color="error"
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
          component="div"
          count={filteredPermits.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={activeRowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPageValue(parseInt(e.target.value, 10))}
          rowsPerPageOptions={activeRowsPerPageOptions}
          labelRowsPerPage={t('lblRowsPerPage')}
        />
      </Card>

      {/* CREATE / EDIT PERMIT MODAL */}
      <PermitModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        editingPermit={editingPermit}
        clients={clients}
        reminders={reminders}
        canEdit={canEdit}
        canCreate={canCreate}
        canDelete={canDelete}
        canCreateReminder={canCreateReminder}
        canEditReminder={canEditReminder}
        canDeleteReminder={canDeleteReminder}
        onSave={handleSavePermitFromModal}
        onDelete={onDeletePermit}
        onOpenEditReminder={handleOpenEditReminder}
        onUnlinkReminder={handleUnlinkReminder}
        onDeleteReminder={onDeleteReminder}
      />

      {/* QUICK ADD REMINDER FOR PERMIT DIALOG */}
      <Dialog
        open={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              maxHeight: 'calc(100vh - 64px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box
          component="form"
          onSubmit={handleSaveReminderSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: 'inherit',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700,
              p: 2,
              flexShrink: 0,
            }}
          >
            <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
              {t('btnAddReminderForPermit')}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={() => setIsReminderModalOpen(false)}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent
            dividers
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              p: { xs: 2, sm: 2.5 },
              overflowY: 'auto',
              flex: '1 1 auto',
            }}
          >
            <TextField
              fullWidth
              required
              size="small"
              label={t('lblReminderTitle')}
              value={newReminderTitle}
              onChange={(e) => setNewReminderTitle(e.target.value)}
            />
            <TextField
              fullWidth
              type="date"
              size="small"
              label={t('colDueDate')}
              value={newReminderDueDate}
              onChange={(e) => setNewReminderDueDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label={t('colNotes')}
              value={newReminderNotes}
              onChange={(e) => setNewReminderNotes(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, flexShrink: 0, justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setIsReminderModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 600 }}>
              {t('btnSave')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* EDIT REMINDER MODAL */}
      <Dialog
        open={Boolean(editingReminderModalItem)}
        onClose={() => setEditingReminderModalItem(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              maxHeight: 'calc(100vh - 64px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            },
          },
        }}
      >
        {editingReminderModalItem && (
          <Box
            component="form"
            onSubmit={handleSaveEditedReminder}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              maxHeight: 'inherit',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 700,
                p: 2,
                flexShrink: 0,
              }}
            >
              <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
                {t('modalEditReminder')}
              </Typography>
              <IconButton
                aria-label="close"
                onClick={() => setEditingReminderModalItem(null)}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent
              dividers
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: { xs: 2, sm: 2.5 },
                overflowY: 'auto',
                flex: '1 1 auto',
              }}
            >
              <TextField
                fullWidth
                required
                size="small"
                label={t('lblReminderTitle')}
                value={editReminderModalTitle}
                onChange={(e) => setEditReminderModalTitle(e.target.value)}
              />
              <TextField
                fullWidth
                type="date"
                size="small"
                label={t('colDueDate')}
                value={editReminderModalDueDate}
                onChange={(e) => setEditReminderModalDueDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <FormControl size="small" fullWidth>
                <InputLabel>{t('colStatus')}</InputLabel>
                <Select
                  value={editReminderModalStatus}
                  label={t('colStatus')}
                  onChange={(e) => setEditReminderModalStatus(e.target.value)}
                >
                  <MenuItem value="Pending">{t('statusPending')}</MenuItem>
                  <MenuItem value="In Progress">{t('statusInProgress')}</MenuItem>
                  <MenuItem value="Completed">{t('statusCompleted')}</MenuItem>
                  <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label={t('colNotes')}
                value={editReminderModalNotes}
                onChange={(e) => setEditReminderModalNotes(e.target.value)}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2, flexShrink: 0, justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setEditingReminderModalItem(null)} color="inherit" sx={{ textTransform: 'none' }}>
                {t('btnCancel')}
              </Button>
              <Button type="submit" variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 600 }}>
                {t('btnSave')}
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>

      {/* PERMIT TYPE HEADER FILTER MENU */}
      <Menu
        anchorEl={permitTypeHeaderAnchor}
        open={Boolean(permitTypeHeaderAnchor)}
        onClose={() => setPermitTypeHeaderAnchor(null)}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          selected={filterPermitType === 'all'}
          onClick={() => {
            setFilterPermitType('all');
            setPage(0);
            setPermitTypeHeaderAnchor(null);
          }}
        >
          {t('quickFilterAll')}
        </MenuItem>
        {PERMIT_TYPE_OPTIONS.map((opt) => (
          <MenuItem
            key={opt}
            selected={filterPermitType === opt}
            onClick={() => {
              setFilterPermitType(opt);
              setPage(0);
              setPermitTypeHeaderAnchor(null);
            }}
          >
            {getPermitTypeLabel(opt)}
          </MenuItem>
        ))}
      </Menu>

      {/* ERROR DIALOG */}
      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState({ open: false, message: '' })}
      />
      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirmState.open}
        title={t('confirmDeleteTitle')}
        message={deleteConfirmState.message}
        confirmLabel={t('btnDelete')}
        onConfirm={deleteConfirmState.onConfirm}
        onClose={() => setDeleteConfirmState((prev) => ({ ...prev, open: false }))}
        confirmColor="warning"
      />

      {historyModalState.permit && (
        <HistoryTimelineModal
          open={historyModalState.open}
          onClose={() => setHistoryModalState({ open: false, permit: null })}
          entityType="Permit"
          entityId={historyModalState.permit.id}
          entityTitle={historyModalState.permit.permitNumber || 'Permit'}
          onRestored={() => {
            refetchPermits();
          }}
        />
      )}
    </Box>
  );
};

export default PermitsPage;
