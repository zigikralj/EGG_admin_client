import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Box,
  Typography,
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
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { HistoryTimelineModal } from '../../components/history';
import {
  AddIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  RefreshIcon,
} from '../../components/icons';
import {
  usePaginatedPermitsQuery,
  useClientsSummaryQuery,
  usePermitsMutations,
  useRemindersMutations,
} from '../../queries';
import { useDebounce } from '../../hooks/useDebounce';
import {
  PermitStatusBadge,
  getPermitStatus,
  type PermitStatusResult,
} from '../../components/permit/PermitStatusBadge';
import { PermitsTable } from '../../components/permit/PermitsTable';
import {
  PermitQuickReminderDialog,
  PermitEditReminderModal,
} from '../../components/permit/PermitReminderDialogs';

export { getPermitStatus, PermitStatusBadge, type PermitStatusResult };

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
  const [historyModalState, setHistoryModalState] = useState<{ open: boolean; permit: Permit | null }>({
    open: false,
    permit: null,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Popover filter states
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPermitType, setFilterPermitType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('endDate');
  const [permitTypeHeaderAnchor, setPermitTypeHeaderAnchor] = useState<null | HTMLElement>(null);

  const shouldFetchClients = isFilterOpen || filterClient !== 'all';
  const { data: clients = [] } = useClientsSummaryQuery({ enabled: shouldFetchClients });
  const { handleSave: handleSavePermit, handleDelete: handleDeletePermit } = usePermitsMutations();
  const { handleSave: handleSaveReminder, handleDelete: handleDeleteReminder } = useRemindersMutations();

  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  const onDeletePermit = (id: string) =>
    handleDeletePermit(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));
  const onDeleteReminder = (id: string) =>
    handleDeleteReminder(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));

  const getLinkedClient = useCallback(
    (p: Permit | null | undefined): any => {
      if (!p) return null;
      if (p.client) return p.client;
      if (p.clientId) {
        const found = clients.find((c) => c.id === p.clientId);
        if (found) return found;
      }
      if (p.clients && p.clients.length > 0) return p.clients[0];
      const foundInClients = (clients as any[]).find(
        (c) =>
          c.permits?.some((cp: any) => cp.id === p.id) ||
          c.permitId === p.id ||
          c.extraData?.permitId === p.id
      );
      return foundInClients || null;
    },
    [clients]
  );

  // Edit modal for existing reminders
  const [editingReminderModalItem, setEditingReminderModalItem] = useState<Reminder | null>(null);

  // Quick reminder creation modal tied to permit from row action
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [targetPermitForReminder, setTargetPermitForReminder] = useState<Permit | null>(null);

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
    onRefresh: () => {
      refetchPermits();
    },
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

  const permitQuickFilterOptions: QuickFilterItem[] = useMemo(
    () => [
      { key: 'active', label: t('statusActivePermit'), color: 'primary' },
      { key: 'expiring', label: t('quickFilterExpiringPermits'), color: 'warning', labelColor: 'warning.main' },
      { key: 'expired', label: t('quickFilterExpiredPermits'), color: 'error', labelColor: 'error.main' },
    ],
    [t]
  );

  const handleQuickFiltersChange = (newKeys: string[]) => {
    setQuickFilters(newKeys);
    onQuickFiltersChange?.(newKeys);
    onQuickFilterChange?.((newKeys[0] as any) || 'all');
  };

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
  const debouncedSearch = useDebounce(searchQuery, 500);

  const statusParam = quickFilters.length > 0 ? quickFilters[0] : (filterStatus !== 'all' ? filterStatus : undefined);

  // Reset page to 0 when filters or search change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, quickFilters, filterClient, filterStatus, filterPermitType, filterDateFrom, filterDateTo, filterDateField, setPage]);

  const {
    data: paginatedData,
    refetch: refetchPermits,
  } = usePaginatedPermitsQuery({
    page,
    rowsPerPage: activeRowsPerPage,
    sortBy: sortColumn,
    sortOrder: sortDirection,
    search: debouncedSearch,
    status: statusParam,
    permitType: filterPermitType !== 'all' ? filterPermitType : undefined,
    clientId: filterClient !== 'all' ? filterClient : undefined,
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
    dateField: filterDateField,
  });

  const permits = paginatedData?.items || [];
  const totalPermits = paginatedData?.total || 0;

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
  };

  const handleSaveEditedReminder = async (data: {
    id: string;
    title: string;
    dueDate: string | null;
    status: string;
    notes: string | null;
  }) => {
    try {
      const res = await handleSaveReminder({
        id: data.id,
        title: data.title,
        dueDate: data.dueDate,
        status: data.status,
        notes: data.notes,
      });
      if (res.success) {
        setEditingReminderModalItem(null);
      } else {
        setErrorDialogState({ open: true, message: res.error || t('errorSavingProject') });
      }
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
    setIsReminderModalOpen(true);
  };

  const handleSaveQuickReminder = async (data: {
    title: string;
    dueDate: string | null;
    notes: string | null;
  }) => {
    if (!targetPermitForReminder) return;

    const targetPermitClient = getLinkedClient(targetPermitForReminder);

    try {
      const res = await handleSaveReminder({
        title: data.title,
        clientId: targetPermitClient?.id || targetPermitForReminder.clientId || null,
        clientName: targetPermitClient?.name || targetPermitForReminder.clientName || null,
        permitId: targetPermitForReminder.id,
        permitNumber: targetPermitForReminder.permitNumber,
        dueDate: data.dueDate,
        notes: data.notes,
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
    permits.forEach((p) => {
      if (p.id && (p as any).reminders) {
        map.set(p.id, (p as any).reminders);
      }
    });
    return map;
  }, [permits]);



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
              onOpen={() => setIsFilterOpen(true)}
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

        {/* PERMITS TABLE */}
        <PermitsTable
          permits={permits}
          activeCols={activeCols}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          filterPermitType={filterPermitType}
          onFilterPermitTypeChange={(type) => {
            setFilterPermitType(type);
            setPage(0);
          }}
          onOpenPermitTypeFilterMenu={(anchor) => setPermitTypeHeaderAnchor(anchor)}
          getPermitTypeLabel={getPermitTypeLabel}
          getLinkedClient={getLinkedClient}
          permitRemindersMap={permitRemindersMap}
          canEdit={canEdit}
          canDelete={canDelete}
          canViewHistory={canViewHistory}
          canCreateReminder={canCreateReminder}
          hasAnyRowAction={hasAnyRowAction}
          onRowClick={openEdit}
          onEditPermit={openEdit}
          onDeletePermit={onDeletePermit}
          onOpenHistory={(permit) => setHistoryModalState({ open: true, permit })}
          onAddReminderForPermit={openAddReminderForPermit}
        />

        <TablePagination
          component="div"
          count={totalPermits}
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
      <PermitQuickReminderDialog
        open={isReminderModalOpen}
        permit={targetPermitForReminder}
        onClose={() => {
          setIsReminderModalOpen(false);
          setTargetPermitForReminder(null);
        }}
        onSave={handleSaveQuickReminder}
      />

      {/* EDIT REMINDER MODAL */}
      <PermitEditReminderModal
        reminder={editingReminderModalItem}
        onClose={() => setEditingReminderModalItem(null)}
        onSave={handleSaveEditedReminder}
      />

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

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        open={deleteConfirmState.open}
        title={t('confirmDeleteTitle')}
        message={deleteConfirmState.message}
        confirmLabel={t('btnDelete')}
        onConfirm={deleteConfirmState.onConfirm}
        onClose={() => setDeleteConfirmState((prev) => ({ ...prev, open: false }))}
        confirmColor="warning"
      />

      {/* HISTORY MODAL */}
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
