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

import {
  PERMIT_TYPE_OPTIONS,
  type Client,
  type Permit,
  type PermitType,
  type Reminder,
  type WasteCatalog,
  type WasteCatalogResponse,
  type TableViewProps,
} from '../../types';
import { apiFetch } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTableView } from '../../hooks/useTableView';
import { TableOptionsSelector, type ColumnDef } from '../../components/common/ColumnSelector';
import { TableFilterSelector } from '../../components/common/TableFilterSelector';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { TableQuickFilters, type QuickFilterItem } from '../../components/common/TableQuickFilters';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { ErrorDialog } from '../../components/dialogs/ErrorDialog';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  CloseIcon,
  LinkIcon,
  LinkOffIcon,
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
} from '../../components/icons';

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
  const hasAnyRowAction = canEdit || canDelete;

  const canCreateReminder = hasPermission('reminders', 'create');
  const canEditReminder = hasPermission('reminders', 'edit');
  const canDeleteReminder = hasPermission('reminders', 'delete');

  const [isOpen, setIsOpen] = useState(false);
  const [editingPermit, setEditingPermit] = useState<Permit | null>(null);

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

  // Selected client for permit
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Inline reminder creation/linking in permit dialog
  const [isAddingReminderInline, setIsAddingReminderInline] = useState(false);
  const [addReminderMode, setAddReminderMode] = useState<'new' | 'existing'>('new');
  const [inlineReminderTitle, setInlineReminderTitle] = useState('');
  const [inlineReminderDueDate, setInlineReminderDueDate] = useState('');
  const [inlineReminderNotes, setInlineReminderNotes] = useState('');
  const [selectedExistingReminderId, setSelectedExistingReminderId] = useState('');

  // Staged reminders when creating or editing a permit
  const [stagedNewReminders, setStagedNewReminders] = useState<
    Array<{ id: string; title: string; dueDate?: string; notes?: string }>
  >([]);
  const [stagedLinkReminderIds, setStagedLinkReminderIds] = useState<string[]>([]);

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

  // Form states
  const [selectedWasteCatalogIds, setSelectedWasteCatalogIds] = useState<string[]>([]);
  const [permitNumber, setPermitNumber] = useState('');
  const [permitTypes, setPermitTypes] = useState<string[]>([]);
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
  const [selectedCatalogItems, setSelectedCatalogItems] = useState<WasteCatalog[]>([]);

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

  // Ensure selected items are present in options list so label/chips render
  const combinedCatalogOptions = useMemo(() => {
    const newOptions = [...catalogOptions];
    selectedCatalogItems.forEach(item => {
      if (!newOptions.some((o) => o.id === item.id)) {
        newOptions.unshift(item);
      }
    });
    return newOptions;
  }, [selectedCatalogItems, catalogOptions]);

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
        if (selectedCatalogItems.some(item => item.id === updated.id)) {
          setSelectedCatalogItems(prev => prev.map(item => item.id === updated.id ? updated : item));
        }
      }
    } catch (err) {
      console.error('Error toggling frequent status:', err);
    }
  };

  const openNew = () => {
    if (!canCreate) return;
    setEditingPermit(null);
    setSelectedWasteCatalogIds([]);
    setSelectedCatalogItems([]);
    setCatalogInputValue('');
    setCatalogSearchTerm('');
    setPermitNumber('');
    setPermitTypes([]);
    setSelectedClientId('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setCatalogPage(1);
    setIsAddingReminderInline(false);
    setStagedNewReminders([]);
    setStagedLinkReminderIds([]);
    setInlineReminderTitle('');
    setInlineReminderDueDate('');
    setInlineReminderNotes('');
    setSelectedExistingReminderId('');
    setIsOpen(true);
    fetchCatalogPage(1, '', false);
  };

  const openEdit = async (p: Permit) => {
    if (!canEdit) return;
    setEditingPermit(p);
    const linkedClient = getLinkedClient(p);
    setSelectedClientId(linkedClient?.id || p.clientId || '');

    const ids = (p.wasteCatalogIds?.length ? p.wasteCatalogIds : (p.permitWastes?.map(pw => pw.wasteCatalogId).filter(Boolean) || (p.wasteCatalogId ? [p.wasteCatalogId] : []))) as string[];
    const items = (p.wasteCatalogs?.length ? p.wasteCatalogs : (p.permitWastes?.map(pw => pw.wasteCatalog).filter(Boolean) || (p.wasteCatalog ? [p.wasteCatalog] : []))) as WasteCatalog[];
    
    setSelectedWasteCatalogIds(ids);
    setSelectedCatalogItems(items);
    setCatalogInputValue('');

    setPermitNumber(p.permitNumber || '');
    setPermitTypes((p.permitTypes || []) as string[]);
    setStartDate(p.startDate ? p.startDate.split('T')[0] : '');
    setEndDate(p.endDate ? p.endDate.split('T')[0] : '');
    setNotes(p.notes || '');
    setCatalogSearchTerm('');
    setCatalogPage(1);
    setIsAddingReminderInline(false);
    setStagedNewReminders([]);
    setStagedLinkReminderIds([]);
    setInlineReminderTitle('');
    setInlineReminderDueDate('');
    setInlineReminderNotes('');
    setSelectedExistingReminderId('');
    setIsOpen(true);
    fetchCatalogPage(1, '', false);
  };

  const availableExistingReminders = useMemo(() => {
    if (!reminders) return [];
    const currentPermitId = editingPermit?.id;
    const stagedIds = new Set(stagedLinkReminderIds);
    return reminders.filter((r) => {
      if (stagedIds.has(r.id)) return false;
      if (currentPermitId && r.permitId === currentPermitId) return false;
      return true;
    });
  }, [reminders, editingPermit, stagedLinkReminderIds]);

  const handleAddStagedReminder = () => {
    if (addReminderMode === 'new') {
      if (!inlineReminderTitle.trim()) {
        setErrorDialogState({
          open: true,
          message: t('alertReminderTitleRequired') || 'Naziv podsetnika je obavezan.',
        });
        return;
      }
      setStagedNewReminders((prev) => [
        ...prev,
        {
          id: `staged_${Date.now()}_${Math.random()}`,
          title: inlineReminderTitle.trim(),
          dueDate: inlineReminderDueDate || undefined,
          notes: inlineReminderNotes.trim() || undefined,
        },
      ]);
      setInlineReminderTitle('');
      setInlineReminderDueDate('');
      setInlineReminderNotes('');
      setIsAddingReminderInline(false);
    } else {
      if (!selectedExistingReminderId) return;
      if (!stagedLinkReminderIds.includes(selectedExistingReminderId)) {
        setStagedLinkReminderIds((prev) => [...prev, selectedExistingReminderId]);
      }
      setSelectedExistingReminderId('');
      setIsAddingReminderInline(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit && !canCreate) return;
    if (!permitNumber.trim() || selectedWasteCatalogIds.length === 0 || !startDate || !endDate) {
      setErrorDialogState({
        open: true,
        message: t('alertPermitRequired'),
      });
      return;
    }

    if (!selectedClientId) {
      setErrorDialogState({
        open: true,
        message: t('alertClientRequired'),
      });
      return;
    }

    if (!permitTypes || permitTypes.length === 0) {
      setErrorDialogState({
        open: true,
        message: t('alertPermitTypeRequired'),
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setErrorDialogState({
        open: true,
        message: t('alertPermitDatesOrder') || 'Datum početka ne može biti posle datuma isteka.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await handleSavePermit({
        id: editingPermit?.id,
        permitNumber: permitNumber.trim(),
        permitTypes,
        wasteCatalogIds: selectedWasteCatalogIds,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        notes: notes.trim() || null,
        clientId: selectedClientId || null,
      });

      const isSuccess = res.success;
      const targetPermitId = editingPermit?.id || res.id;
      const targetPermitNumber = permitNumber.trim();

      if (isSuccess && targetPermitId) {
        const foundClient = clients.find((c) => c.id === selectedClientId);

        // Save staged reminders
        for (const rem of stagedNewReminders) {
          await handleSaveReminder({
            title: rem.title,
            dueDate: rem.dueDate || null,
            notes: rem.notes || null,
            permitId: targetPermitId,
            permitNumber: targetPermitNumber,
            clientId: selectedClientId || null,
            clientName: foundClient?.name || null,
            status: 'Pending',
          });
        }

        for (const remId of stagedLinkReminderIds) {
          await handleSaveReminder({
            id: remId,
            permitId: targetPermitId,
            permitNumber: targetPermitNumber,
            clientId: selectedClientId || null,
            clientName: foundClient?.name || null,
          });
        }

        setIsOpen(false);
      } else if (!isSuccess) {
        setErrorDialogState({
          open: true,
          message: res.error || t('errorSavingProject'),
        });
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

  const totalRemindersCount = useMemo(() => {
    const existingCount = editingPermit ? (permitRemindersMap.get(editingPermit?.id) || []).length : 0;
    return existingCount + stagedNewReminders.length + stagedLinkReminderIds.length;
  }, [editingPermit, permitRemindersMap, stagedNewReminders.length, stagedLinkReminderIds.length]);

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
        const types = permit.permitTypes || [];
        if (!types.includes(filterPermitType)) {
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
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            {/* QUICK FILTERS */}
            <TableQuickFilters
              options={permitQuickFilterOptions}
              selectedKeys={quickFilters}
              onChange={handleQuickFiltersChange}
            />

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
                    <TableSortLabel
                      active={sortColumn === 'permitTypes'}
                      direction={sortColumn === 'permitTypes' ? sortDirection : 'asc'}
                      onClick={() => handleSort('permitTypes')}
                    >
                      {t('colPermitType')}
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
                              {permit.permitTypes.map((pt) => (
                                <Chip
                                  key={pt}
                                  label={getPermitTypeLabel(pt)}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontSize: '0.725rem',
                                    fontWeight: 500,
                                    height: 22,
                                    bgcolor: 'action.hover',
                                  }}
                                />
                              ))}
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
              {/* Permit Number */}
              <Grid size={{ xs: 12 }}>
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

              {/* Index Number (Waste Catalog) */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  multiple={true}
                  size="small"
                  options={combinedCatalogOptions}
                  loading={catalogLoading}
                  filterOptions={(options) => options}
                  value={selectedCatalogItems}
                  onChange={(_, newValue) => {
                    const validValues = (newValue as WasteCatalog[]).filter(Boolean);
                    setSelectedCatalogItems(validValues);
                    setSelectedWasteCatalogIds(validValues.map(v => v.id));
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
                    typeof option === 'string' ? option : option.code
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
                        required={selectedWasteCatalogIds.length === 0}
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

              {/* Client (Required) */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  size="small"
                  options={clients}
                  getOptionLabel={(option) => `${option.name}${option.city ? ` (${option.city})` : ''}`}
                  value={clients.find((c) => c.id === selectedClientId) || null}
                  onChange={(_, newValue) => {
                    setSelectedClientId(newValue ? newValue.id : '');
                  }}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('colClientName')}
                      placeholder={t('phClient')}
                      required
                    />
                  )}
                />
              </Grid>

              {/* Permit Type (Multiple Select) */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  size="small"
                  options={PERMIT_TYPE_OPTIONS}
                  getOptionLabel={(option) => getPermitTypeLabel(option)}
                  value={permitTypes as PermitType[]}
                  onChange={(_, newValue) => {
                    setPermitTypes((newValue as PermitType[]) || []);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('lblPermitType')}
                      placeholder={permitTypes.length === 0 ? t('phSelectPermitType') : ''}
                      required={permitTypes.length === 0}
                    />
                  )}
                />
              </Grid>

              {/* Start Date (Required) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  size="small"
                  label={t('colStartDate')}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {/* End Date (Required) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
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

            {/* REMINDERS SECTION (OPTIONAL) */}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsActiveIcon color="warning" sx={{ fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t('tabReminders')} ({totalRemindersCount})
                </Typography>
              </Box>
              {canCreateReminder && (
                <Button
                  size="small"
                  variant={isAddingReminderInline ? 'outlined' : 'contained'}
                  color={isAddingReminderInline ? 'inherit' : 'primary'}
                  startIcon={isAddingReminderInline ? <CloseIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 14 }} />}
                  onClick={() => {
                    const willOpen = !isAddingReminderInline;
                    setIsAddingReminderInline(willOpen);
                    if (willOpen) {
                      setAddReminderMode('new');
                      const idxStr = catalogInputValue ? catalogInputValue.split(' - ')[0] : '';
                      setInlineReminderTitle(
                        permitNumber.trim()
                          ? `${t('lblPermit')}: ${permitNumber.trim()}${idxStr ? ` (${idxStr})` : ''}`
                          : ''
                      );
                      setInlineReminderDueDate(endDate || '');
                      setInlineReminderNotes('');
                      setSelectedExistingReminderId('');
                    }
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: 1.5 }}
                >
                  {isAddingReminderInline ? t('btnCancel') : t('btnAddReminder')}
                </Button>
              )}
            </Box>

            {/* INLINE ADD REMINDER PANEL */}
            {isAddingReminderInline && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ToggleButtonGroup
                    size="small"
                    value={addReminderMode}
                    exclusive
                    onChange={(_, val) => {
                      if (val) setAddReminderMode(val);
                    }}
                    color="primary"
                  >
                    <ToggleButton value="new" sx={{ textTransform: 'none', fontWeight: 600, px: 1.5, py: 0.25, fontSize: '0.75rem' }}>
                      {t('btnCreateNewReminder')}
                    </ToggleButton>
                    <ToggleButton value="existing" sx={{ textTransform: 'none', fontWeight: 600, px: 1.5, py: 0.25, fontSize: '0.75rem' }}>
                      {t('btnLinkExistingReminder')}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {addReminderMode === 'new' ? (
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label={t('lblReminderTitle')}
                        placeholder={t('phReminderTitle')}
                        value={inlineReminderTitle}
                        onChange={(e) => setInlineReminderTitle(e.target.value)}
                        required
                        autoFocus
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label={t('colDueDate')}
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={inlineReminderDueDate}
                        onChange={(e) => setInlineReminderDueDate(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label={t('colNotes')}
                        placeholder={t('colNotes')}
                        value={inlineReminderNotes}
                        onChange={(e) => setInlineReminderNotes(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Autocomplete
                      size="small"
                      options={availableExistingReminders}
                      getOptionLabel={(option) => {
                        const dueDatePart = option.dueDate ? ` [${formatDate(option.dueDate)}]` : '';
                        const clientPart = option.clientName ? ` (${option.clientName})` : '';
                        return `${option.title || option.projectName || ''}${dueDatePart}${clientPart}`;
                      }}
                      value={availableExistingReminders.find((r) => r.id === selectedExistingReminderId) || null}
                      onChange={(_, newValue) => {
                        setSelectedExistingReminderId(newValue ? newValue.id : '');
                      }}
                      noOptionsText={t('emptyReminders') || 'Nema dostupnih podsetnika'}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('tabReminders')}
                          placeholder={t('phSelectExistingReminder')}
                        />
                      )}
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => setIsAddingReminderInline(false)}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('btnCancel')}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={addReminderMode === 'new' ? !inlineReminderTitle.trim() : !selectedExistingReminderId}
                    onClick={handleAddStagedReminder}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {addReminderMode === 'new' ? t('btnAddReminder') : t('btnLink')}
                  </Button>
                </Box>
              </Box>
            )}

            {/* REMINDERS LIST (Staged + Existing) */}
            {totalRemindersCount === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                {t('noProjectReminders')}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Staged New Reminders */}
                {stagedNewReminders.map((rem) => (
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
                      borderStyle: 'dashed',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                      <NotificationsActiveIcon fontSize="small" color="primary" />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={t('statusDraft') || 'Novo'} size="small" color="info" variant="outlined" sx={{ fontWeight: 600 }} />
                      <Tooltip title={t('btnDelete')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setStagedNewReminders((prev) => prev.filter((r) => r.id !== rem.id))}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Card>
                ))}

                {/* Staged Linked Reminders */}
                {stagedLinkReminderIds.map((remId) => {
                  const rem = reminders.find((r) => r.id === remId);
                  if (!rem) return null;
                  return (
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
                        borderStyle: 'dashed',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                        <LinkIcon fontSize="small" color="secondary" />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rem.title || rem.projectName}
                          </Typography>
                          {rem.dueDate && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarTodayIcon sx={{ fontSize: 13 }} />
                              {formatDate(rem.dueDate)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="Povezano" size="small" color="secondary" variant="outlined" sx={{ fontWeight: 600 }} />
                        <Tooltip title={t('btnCancel')}>
                          <IconButton
                            size="small"
                            color="inherit"
                            onClick={() => setStagedLinkReminderIds((prev) => prev.filter((id) => id !== remId))}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Card>
                  );
                })}

                {/* Existing linked reminders if editing an existing permit */}
                {editingPermit &&
                  (permitRemindersMap.get(editingPermit.id) || []).map((rem) => (
                    <Card
                      key={rem.id}
                      variant="outlined"
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                        <NotificationsActiveIcon fontSize="small" color="primary" />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={rem.status}
                          size="small"
                          color={rem.status === 'Completed' ? 'success' : rem.status === 'Overdue' ? 'error' : 'warning'}
                          sx={{ fontWeight: 600 }}
                        />
                        {canEditReminder && (
                          <Tooltip title={t('btnEdit')}>
                            <IconButton size="small" color="primary" onClick={() => handleOpenEditReminder(rem)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={t('btnUnlinkReminder')}>
                          <IconButton size="small" color="warning" onClick={() => handleUnlinkReminder(rem.id)}>
                            <LinkOffIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {onDeleteReminder && canDeleteReminder && (
                          <Tooltip title={t('btnDelete')}>
                            <IconButton size="small" color="error" onClick={() => onDeleteReminder(rem.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Card>
                  ))}
              </Box>
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

      {/* EDIT REMINDER MODAL */}
      <Dialog
        open={Boolean(editingReminderModalItem)}
        onClose={() => setEditingReminderModalItem(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        {editingReminderModalItem && (
          <form onSubmit={handleSaveEditedReminder}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
              {t('modalEditReminder')}
            </DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
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
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setEditingReminderModalItem(null)} color="inherit" sx={{ textTransform: 'none' }}>
                {t('btnCancel')}
              </Button>
              <Button type="submit" variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 600 }}>
                {t('btnSave')}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>

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
    </Box>
  );
};

export default PermitsPage;
