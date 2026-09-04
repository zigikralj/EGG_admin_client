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
  Grid,
  Autocomplete,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  CircularProgress,
} from '@mui/material';

import type { Permit, Client, Reminder, WasteCatalog, WasteCatalogResponse, SaveResult, TableViewProps } from '../../types';
import { apiFetch } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTableView } from '../../hooks/useTableView';
import { TableOptionsSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';
import { TableSearchInput } from '../TableSearchInput';
import { DateRangeFilter } from '../DateRangeFilter';
import { ErrorDialog } from '../ErrorDialog';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  LockIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  RefreshIcon,
  NotificationsActiveIcon,
  CalendarTodayIcon,
  CheckCircleIcon,
  WarningAmberIcon,
  ErrorIcon,
  StarIcon,
  StarBorderIcon,
} from '../icons';

interface Props extends TableViewProps {
  permits: Permit[];
  clients: Client[];
  wasteCatalog?: WasteCatalog[];
  reminders?: Reminder[];
  onSavePermit: (permit: Partial<Permit>) => Promise<SaveResult | void> | void;
  onDeletePermit: (id: string) => void;
  onSaveReminder?: (reminder: Partial<Reminder>) => Promise<SaveResult | void> | void;
  quickFilter?: 'all' | 'expiring' | 'expired' | 'active';
  onQuickFilterChange?: (val: 'all' | 'expiring' | 'expired' | 'active') => void;
}

const DEFAULT_COLUMNS = [
  'indexNumber',
  'permitNumber',
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

const PermitsView: React.FC<Props> = ({
  permits,
  clients,
  wasteCatalog = [],
  reminders = [],
  onSavePermit,
  onDeletePermit,
  onSaveReminder,
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
  const { t } = useLanguage();
  const { canManagePermits } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPermit, setEditingPermit] = useState<Permit | null>(null);

  // Reminder creation modal tied to permit
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
    defaultSortField: 'endDate',
    defaultSortDirection: 'asc',
  });

  // Quick Filter state ('all' | 'expiring' | 'expired' | 'active')
  const [quickFilter, setQuickFilter] = useState<'all' | 'expiring' | 'expired' | 'active'>(
    quickFilterProp || 'all'
  );

  useEffect(() => {
    if (quickFilterProp !== undefined) {
      setQuickFilter(quickFilterProp);
    }
  }, [quickFilterProp]);

  const handleQuickFilterChange = (val: 'all' | 'expiring' | 'expired' | 'active') => {
    setQuickFilter(val);
    onQuickFilterChange?.(val);
  };

  // Popover filter states
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('endDate');

  const activeFilterCount =
    (quickFilter !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterDateFrom || filterDateTo ? 1 : 0) +
    (sortColumn !== 'endDate' || sortDirection !== 'asc' ? 1 : 0);

  const clearFilters = () => {
    setQuickFilter('all');
    onQuickFilterChange?.('all');
    setFilterClient('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('endDate');
    resetSort();
  };

  const columnDefs: ColumnDef[] = [
    { id: 'indexNumber', label: t('colIndexNumber') },
    { id: 'permitNumber', label: t('colPermitNumber') },
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
    { value: 'client', label: t('colClientName') },
  ];

  // Form states
  const [selectedWasteCatalogId, setSelectedWasteCatalogId] = useState<string>('');
  const [permitNumber, setPermitNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Lazy-loaded Waste Catalog state
  const [catalogOptions, setCatalogOptions] = useState<WasteCatalog[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoadingMore, setCatalogLoadingMore] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogHasMore, setCatalogHasMore] = useState(true);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [catalogInputValue, setCatalogInputValue] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<WasteCatalog | null>(null);

  const fetchCatalogPage = useCallback(
    async (pageToFetch: number, search: string, isAppend = false) => {
      try {
        if (isAppend) {
          setCatalogLoadingMore(true);
        } else {
          setCatalogLoading(true);
        }
        const params = new URLSearchParams({
          page: String(pageToFetch),
          limit: '20',
        });
        if (search.trim()) {
          params.set('search', search.trim());
        }
        const res = await apiFetch(`/api/waste-catalog?${params.toString()}`);
        if (res.ok) {
          const data: WasteCatalogResponse = await res.json();
          const items = data.items || [];
          setCatalogOptions((prev) => {
            if (!isAppend) return items;
            const existingIds = new Set(prev.map((it) => it.id));
            const newItems = items.filter((it) => !existingIds.has(it.id));
            return [...prev, ...newItems];
          });
          setCatalogPage(data.page || pageToFetch);
          setCatalogHasMore(Boolean(data.hasMore));
        }
      } catch (err) {
        console.error('Error fetching waste catalog page:', err);
      } finally {
        setCatalogLoading(false);
        setCatalogLoadingMore(false);
      }
    },
    []
  );

  // Debounced search when typing in the catalog Autocomplete
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchCatalogPage(1, catalogSearchTerm, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [catalogSearchTerm, isOpen, fetchCatalogPage]);

  // Ensure selected item is present in options list so label/chips render
  const combinedCatalogOptions = useMemo(() => {
    if (selectedCatalogItem && !catalogOptions.some((o) => o.id === selectedCatalogItem.id)) {
      return [selectedCatalogItem, ...catalogOptions];
    }
    return catalogOptions;
  }, [selectedCatalogItem, catalogOptions]);

  const handleToggleFrequent = async (e: React.MouseEvent, item: WasteCatalog) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/waste-catalog/${item.id}/frequent`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const updated: WasteCatalog = await res.json();
        setCatalogOptions((prev) =>
          prev.map((it) => (it.id === updated.id ? updated : it))
        );
        if (selectedCatalogItem?.id === updated.id) {
          setSelectedCatalogItem(updated);
        }
      }
    } catch (err) {
      console.error('Error toggling frequent status:', err);
    }
  };

  const openNew = () => {
    if (!canManagePermits) return;
    setEditingPermit(null);
    setSelectedWasteCatalogId('');
    setSelectedCatalogItem(null);
    setCatalogInputValue('');
    setCatalogSearchTerm('');
    setPermitNumber('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setCatalogPage(1);
    setIsOpen(true);
    fetchCatalogPage(1, '', false);
  };

  const openEdit = async (p: Permit) => {
    if (!canManagePermits) return;
    setEditingPermit(p);
    const id =
      p.wasteCatalogId ||
      (p.wasteCatalogIds && p.wasteCatalogIds[0]) ||
      p.permitWastes?.[0]?.wasteCatalogId ||
      '';
    const existingCatalogItem =
      p.wasteCatalog ||
      p.wasteCatalogs?.[0] ||
      p.permitWastes?.[0]?.wasteCatalog ||
      null;

    if (id) {
      setSelectedWasteCatalogId(id);
      if (existingCatalogItem) {
        setSelectedCatalogItem(existingCatalogItem);
        setCatalogInputValue(`${existingCatalogItem.code} - ${existingCatalogItem.description}`);
      } else {
        try {
          const res = await apiFetch(`/api/waste-catalog/${id}`);
          if (res.ok) {
            const fetched: WasteCatalog = await res.json();
            setSelectedCatalogItem(fetched);
            setCatalogInputValue(`${fetched.code} - ${fetched.description}`);
          }
        } catch {
          // ignore
        }
      }
    } else if (p.indexNumber) {
      const matched = (wasteCatalog || []).find(
        (wc) =>
          wc.code === p.indexNumber ||
          wc.code.replace('*', '') === p.indexNumber?.replace('*', '')
      );
      if (matched) {
        setSelectedWasteCatalogId(matched.id);
        setSelectedCatalogItem(matched);
        setCatalogInputValue(`${matched.code} - ${matched.description}`);
      } else {
        try {
          const res = await apiFetch(`/api/waste-catalog?search=${encodeURIComponent(p.indexNumber)}&limit=1`);
          if (res.ok) {
            const data = await res.json();
            const found = data.items?.[0];
            if (found) {
              setSelectedWasteCatalogId(found.id);
              setSelectedCatalogItem(found);
              setCatalogInputValue(`${found.code} - ${found.description}`);
            }
          }
        } catch {
          // ignore
        }
      }
    } else {
      setSelectedWasteCatalogId('');
      setSelectedCatalogItem(null);
      setCatalogInputValue('');
    }

    setPermitNumber(p.permitNumber || '');
    setStartDate(p.startDate ? p.startDate.split('T')[0] : '');
    setEndDate(p.endDate ? p.endDate.split('T')[0] : '');
    setNotes(p.notes || '');
    setCatalogSearchTerm('');
    setCatalogPage(1);
    setIsOpen(true);
    fetchCatalogPage(1, '', false);
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
    if (!onSaveReminder || !targetPermitForReminder) return;
    if (!newReminderTitle.trim()) return;

    const linkedClients = targetPermitForReminder.clients?.length
      ? targetPermitForReminder.clients
      : clients.filter(
          (c) =>
            c.permitId === targetPermitForReminder.id ||
            c.extraData?.permitId === targetPermitForReminder.id
        );
    const firstClient = linkedClients[0];

    try {
      await onSaveReminder({
        title: newReminderTitle.trim(),
        clientId: firstClient?.id || targetPermitForReminder.clientId || null,
        clientName:
          firstClient?.name ||
          targetPermitForReminder.clientName ||
          null,
        permitId: targetPermitForReminder.id,
        permitNumber: targetPermitForReminder.permitNumber,
        dueDate: newReminderDueDate || null,
        notes: newReminderNotes.trim() || null,
        status: 'Pending',
      });
      setIsReminderModalOpen(false);
      setTargetPermitForReminder(null);
    } catch (err) {
      console.error('Error saving reminder for permit:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManagePermits) return;
    if (!permitNumber.trim() || !selectedWasteCatalogId) {
      setErrorDialogState({
        open: true,
        message: t('alertPermitRequired'),
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await onSavePermit({
        id: editingPermit?.id,
        permitNumber: permitNumber.trim(),
        wasteCatalogId: selectedWasteCatalogId,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        notes: notes.trim() || null,
      });

      if (res && typeof res === 'object' && 'success' in res) {
        if (res.success) {
          setIsOpen(false);
        } else {
          setErrorDialogState({
            open: true,
            message: res.error || t('errorSavingProject'),
          });
        }
      } else {
        setIsOpen(false);
      }
    } catch (err: any) {
      setErrorDialogState({
        open: true,
        message: err?.message || t('errorSavingProject'),
      });
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
        const linkedClients = permit.clients?.length
          ? permit.clients
          : clients.filter(
              (c) => c.permitId === permit.id || c.extraData?.permitId === permit.id
            );
        const clientNames =
          linkedClients.map((c) => c.name).join(' ') ||
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

        if (!matchIndex && !matchPermit && !matchClient && !matchNotes) {
          return false;
        }
      }

      // Expiration status
      const statusObj = getPermitStatus(permit.endDate);

      // Quick filter
      if (quickFilter === 'expiring' && statusObj.status !== 'expiring') {
        return false;
      }
      if (quickFilter === 'expired' && statusObj.status !== 'expired') {
        return false;
      }
      if (quickFilter === 'active' && statusObj.status === 'expired') {
        return false;
      }

      // Popover Status Filter
      if (filterStatus !== 'all' && statusObj.status !== filterStatus) {
        return false;
      }

      // Client filter
      if (filterClient !== 'all') {
        const isMatch =
          permit.clientId === filterClient ||
          (permit.clients && permit.clients.some((c) => c.id === filterClient)) ||
          clients.some(
            (c) =>
              (c.permitId === permit.id || c.extraData?.permitId === permit.id) &&
              c.id === filterClient
          );
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
    quickFilter,
    filterStatus,
    filterClient,
    filterDateFrom,
    filterDateTo,
    filterDateField,
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
        const linkedA = a.clients?.length
          ? a.clients
          : clients.filter(
              (c) => c.permitId === a.id || c.extraData?.permitId === a.id
            );
        const linkedB = b.clients?.length
          ? b.clients
          : clients.filter(
              (c) => c.permitId === b.id || c.extraData?.permitId === b.id
            );
        valA = linkedA[0]?.name || a.clientName || '';
        valB = linkedB[0]?.name || b.clientName || '';
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* HEADER & CONTROLS */}
      <Card
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('tabPermits')}
          </Typography>
          <Chip
            label={`${filteredPermits.length} / ${permits.length}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          {onRefresh && (
            <Tooltip title={t('btnRefresh') || 'Refresh'}>
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {/* QUICK FILTERS */}
          <ToggleButtonGroup
            value={quickFilter}
            exclusive
            onChange={(_, val) => val && handleQuickFilterChange(val)}
            size="small"
            color="primary"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <ToggleButton
              value="all"
              sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}
            >
              {t('quickFilterAll')}
            </ToggleButton>
            <ToggleButton
              value="expiring"
              sx={{
                flex: { xs: 1, sm: 'none' },
                px: 1.5,
                py: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                color: 'warning.main',
              }}
            >
              {t('quickFilterExpiringPermits')}
            </ToggleButton>
            <ToggleButton
              value="expired"
              sx={{
                flex: { xs: 1, sm: 'none' },
                px: 1.5,
                py: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                color: 'error.main',
              }}
            >
              {t('quickFilterExpiredPermits')}
            </ToggleButton>
            <ToggleButton
              value="active"
              sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}
            >
              {t('statusActivePermit')}
            </ToggleButton>
          </ToggleButtonGroup>

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
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

              {/* Date range filter */}
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
            </Box>
          </TableFilterSelector>

          {/* TABLE OPTIONS SELECTOR (Columns, Rows per page) */}
          <TableOptionsSelector
            columns={columnDefs}
            visibleColumns={activeCols}
            onVisibleColumnsChange={setCols}
            rowsPerPage={activeRowsPerPage}
            onRowsPerPageChange={setRowsPerPageValue}
            rowsPerPageOptions={activeRowsPerPageOptions}
            onRowsPerPageOptionsChange={setRowsPerPageOptionsValue}
          />

          {/* ADD BUTTON */}
          <Button
            variant="contained"
            color="primary"
            startIcon={canManagePermits ? <AddIcon /> : <LockIcon />}
            onClick={openNew}
            disabled={!canManagePermits}
            sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
          >
            {t('btnNewPermit')}
          </Button>
        </Box>
      </Card>

      {/* TABLE */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                {activeCols.includes('indexNumber') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'indexNumber'}
                      direction={sortColumn === 'indexNumber' ? sortDirection : 'asc'}
                      onClick={() => handleSort('indexNumber')}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('colIndexNumber')}
                      </Typography>
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('colPermitNumber')}
                      </Typography>
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('colClientName')}
                      </Typography>
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('colStartDate')}
                      </Typography>
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('colEndDate')}
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('status') && (
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('colStatus')}
                    </Typography>
                  </TableCell>
                )}
                {activeCols.includes('reminders') && (
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('linkedReminders')}
                    </Typography>
                  </TableCell>
                )}
                {activeCols.includes('notes') && (
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('colNotes')}
                    </Typography>
                  </TableCell>
                )}
                <TableCell align="right">
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('colActions')}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPermits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + 1} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      {t('emptyPermits')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPermits.map((permit) => {
                  const linkedClients = permit.clients?.length
                    ? permit.clients
                    : clients.filter(
                        (c) => c.permitId === permit.id || c.extraData?.permitId === permit.id
                      );
                  const clientDisplay = linkedClients.length > 0
                    ? linkedClients.map((c) => c.name).join(', ')
                    : (permit.clientName || '-');
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
                            const wc = permit.wasteCatalog || permit.wasteCatalogs?.[0];
                            const code = wc?.code || permit.indexNumber;
                            const desc = wc?.description;
                            if (!code) {
                              return (
                                <Typography variant="body2" color="text.disabled">
                                  —
                                </Typography>
                              );
                            }
                            return desc ? (
                              <Tooltip title={`${code} - ${desc}${wc?.hazardListMark ? ` (${wc.hazardListMark})` : ''}`}>
                                <Typography variant="body2" sx={{ fontWeight: 700, display: 'inline-block' }}>
                                  {code}
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {code}
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
                            {onSaveReminder && (
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
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title={t('btnEdit')}>
                            <IconButton
                              size="small"
                              onClick={() => openEdit(permit)}
                              disabled={!canManagePermits}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('btnDelete')}>
                            <IconButton
                              size="small"
                              onClick={() => onDeletePermit(permit.id)}
                              disabled={!canManagePermits}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
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
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {editingPermit ? t('modalEditPermit') : t('modalNewPermit')}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
            <Grid container spacing={2}>
              {/* Index Number (Waste Catalog) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  size="small"
                  options={combinedCatalogOptions}
                  loading={catalogLoading}
                  filterOptions={(options) => options}
                  value={
                    combinedCatalogOptions.find((item) => item.id === selectedWasteCatalogId) ||
                    selectedCatalogItem ||
                    null
                  }
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setSelectedWasteCatalogId(newValue.id);
                      setSelectedCatalogItem(newValue);
                      setCatalogInputValue(`${newValue.code} - ${newValue.description}`);
                    } else {
                      setSelectedWasteCatalogId('');
                      setSelectedCatalogItem(null);
                      setCatalogInputValue('');
                      setCatalogSearchTerm('');
                    }
                  }}
                  inputValue={catalogInputValue}
                  onInputChange={(_, newInputValue, reason) => {
                    setCatalogInputValue(newInputValue);
                    if (reason === 'input') {
                      setCatalogSearchTerm(newInputValue);
                    } else if (reason === 'clear') {
                      setCatalogSearchTerm('');
                    }
                  }}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : `${option.code} - ${option.description}`
                  }
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  slotProps={{
                    listbox: {
                      onScroll: (event: React.SyntheticEvent) => {
                        const listboxNode = event.currentTarget;
                        if (
                          listboxNode.scrollTop + listboxNode.clientHeight >=
                          listboxNode.scrollHeight - 25
                        ) {
                          if (!catalogLoading && !catalogLoadingMore && catalogHasMore) {
                            fetchCatalogPage(catalogPage + 1, catalogSearchTerm, true);
                          }
                        }
                      },
                      sx: { maxHeight: 320 },
                    } as any,
                  }}
                  noOptionsText={catalogLoading ? 'Učitavanje...' : 'Nema rezultata'}
                  loadingText="Učitavanje..."
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props as any;
                    const isStarred = option.frequent !== null && option.frequent !== undefined;
                    return (
                      <Box
                        key={key || option.id}
                        component="li"
                        {...otherProps}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 0.8,
                          px: 1.5,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' },
                          bgcolor: isStarred ? 'action.hover' : 'inherit',
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, pr: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                              {option.code}
                            </Typography>
                            {option.isHazardous && (
                              <Chip
                                label="Opasan"
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                            {option.hazardListMark && (
                              <Typography variant="caption" color="text.secondary">
                                ({option.hazardListMark})
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.3 }}>
                            {option.description}
                          </Typography>
                        </Box>

                        <Tooltip
                          title={
                            isStarred
                              ? 'Ukloni iz preporučenih (čestih)'
                              : 'Označi kao preporučeno (često)'
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => handleToggleFrequent(e, option)}
                            sx={{
                              p: 0.5,
                              color: isStarred ? '#f59e0b' : 'action.disabled',
                              '&:hover': {
                                color: '#f59e0b',
                                bgcolor: 'rgba(245, 158, 11, 0.12)',
                              },
                            }}
                          >
                            {isStarred ? (
                              <StarIcon fontSize="small" />
                            ) : (
                              <StarBorderIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  }}
                  renderInput={(params) => {
                    const { slotProps: pSlotProps, ...restParams } = params as any;
                    return (
                      <TextField
                        {...restParams}
                        label={t('lblIndexNumber')}
                        placeholder={t('phIndexNumber')}
                        required={!selectedWasteCatalogId}
                        slotProps={{
                          ...pSlotProps,
                          input: {
                            ...pSlotProps?.input,
                            endAdornment: (
                              <>
                                {catalogLoading || catalogLoadingMore ? (
                                  <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                                ) : null}
                                {pSlotProps?.input?.endAdornment}
                              </>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* Permit Number */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label={t('lblPermitNumber')}
                  placeholder={t('phPermitNumber')}
                  value={permitNumber}
                  onChange={(e) => setPermitNumber(e.target.value)}
                />
              </Grid>

              {/* Linked Clients (Read-only if editing) */}
              {editingPermit && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {t('colClientName')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(() => {
                      const linked = editingPermit.clients?.length
                        ? editingPermit.clients
                        : clients.filter(
                            (c) =>
                              c.permitId === editingPermit.id ||
                              c.extraData?.permitId === editingPermit.id
                          );
                      if (!linked.length) {
                        return (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        );
                      }
                      return linked.map((c) => (
                        <Chip key={c.id} label={c.name} size="small" variant="outlined" />
                      ));
                    })()}
                  </Box>
                </Grid>
              )}

              {/* Start Date */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label={t('colStartDate')}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {/* End Date */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label={t('colEndDate')}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label={t('colNotes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
            </Grid>

            {/* If editing an existing permit, show linked reminders */}
            {editingPermit && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('linkedReminders')} ({(permitRemindersMap.get(editingPermit.id) || []).length})
                  </Typography>
                  {onSaveReminder && (
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => openAddReminderForPermit(editingPermit)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {t('btnAddReminderForPermit')}
                    </Button>
                  )}
                </Box>

                {(permitRemindersMap.get(editingPermit.id) || []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('noProjectReminders')}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {(permitRemindersMap.get(editingPermit.id) || []).map((rem) => (
                      <Card
                        key={rem.id}
                        variant="outlined"
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <NotificationsActiveIcon fontSize="small" color="primary" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {rem.title}
                            </Typography>
                            {rem.dueDate && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarTodayIcon sx={{ fontSize: 13 }} />
                                {formatDate(rem.dueDate)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Chip
                          label={rem.status}
                          size="small"
                          color={rem.status === 'Completed' ? 'success' : 'warning'}
                          sx={{ fontWeight: 600 }}
                        />
                      </Card>
                    ))}
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              {t('btnCancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSaving}
              sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
            >
              {t('btnSave')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* QUICK ADD REMINDER FOR PERMIT DIALOG */}
      <Dialog
        open={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <form onSubmit={handleSaveReminderSubmit}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {t('btnAddReminderForPermit')}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
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
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsReminderModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 600 }}>
              {t('btnSave')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ERROR DIALOG */}
      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState({ open: false, message: '' })}
      />
    </Box>
  );
};

export default PermitsView;
