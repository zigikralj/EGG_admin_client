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
  Autocomplete,
  Tooltip,
} from '@mui/material';

import type {
  ProvidedService,
  Service,
  CustomFieldDefinition,
  ProvidedServicesSubTab,
  TableViewProps,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TableOptionsSelector, type ColumnDef } from '../../components/common/ColumnSelector';
import { TableFilterSelector } from '../../components/common/TableFilterSelector';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { TableQuickFilters } from '../../components/common/TableQuickFilters';
import { ProvidedServiceModal } from '../../components/providedService';
import type { ModalMode } from '../../components/common/modal/ViewEditModalBase';
import { ErrorDialog } from '../../components/common/dialogs/ErrorDialog';
import { CustomDataModelModal } from '../../components/service/CustomDataModelModal';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  RefreshIcon,
} from '../../components/icons';
import { useTableView } from '../../hooks/useTableView';
import {
  resolveCustomFieldBadges,
  formatFieldBadgeLabel,
} from '../../utils/customFields';

interface Props extends TableViewProps {
  subTab?: ProvidedServicesSubTab;
  quickFilter?: string;
  onQuickFilterChange?: (val: string) => void;
}

const DEFAULT_COLUMNS = [
  'service',
  'client',
  'project',
  'status',
  'scheduledDate',
  'completionDate',
  'location',
  'customData',
];

import {
  usePaginatedProvidedServicesQuery,
  useServicesQuery,
  useClientsSummaryQuery,
  useProjectsQuery,
  useInvoicesQuery,
  useProvidedServicesMutations,
  useServicesMutations,
  useInvoicesMutations,
  useTablePreferences,
} from '../../queries';
import { useDebounce } from '../../hooks/useDebounce';
import { ConfirmDialog } from '../../components/common/dialogs/ConfirmDialog';
import {
  ClientAutocomplete,
  ServiceAutocomplete,
} from '../../components/common/autocomplete';

const ProvidedServicesPage: React.FC<Props> = ({
  subTab: _subTab = 'summary',
  visibleColumns: visibleColumnsProp,
  onVisibleColumnsChange: onVisibleColumnsChangeProp,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange: onRowsPerPageOptionsChangeProp,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange: onRowsPerPageChangeProp,
  sortState: sortStateProp,
  onSortChange: onSortChangeProp,
  quickFilter: quickFilterProp,
  onQuickFilterChange: onQuickFilterChangeProp,
}) => {
  const tablePrefs = useTablePreferences('providedServices');
  const visibleColumns = visibleColumnsProp ?? tablePrefs.visibleColumns ?? DEFAULT_COLUMNS;
  const onVisibleColumnsChange = onVisibleColumnsChangeProp ?? tablePrefs.onVisibleColumnsChange;
  const rowsPerPageOptions = rowsPerPageOptionsProp ?? tablePrefs.rowsPerPageOptions;
  const onRowsPerPageOptionsChange = onRowsPerPageOptionsChangeProp ?? tablePrefs.onRowsPerPageOptionsChange;
  const rowsPerPage = rowsPerPageProp ?? tablePrefs.rowsPerPage;
  const onRowsPerPageChange = onRowsPerPageChangeProp ?? tablePrefs.onRowsPerPageChange;
  const sortState = sortStateProp ?? tablePrefs.sortState;
  const onSortChange = onSortChangeProp ?? tablePrefs.onSortChange;

  const { t, getServiceLabel } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('providedServices', 'create');
  const canEditAny = hasPermission('providedServices', 'edit') || hasPermission('wasteDisposal', 'edit');
  const canDeleteAny = hasPermission('providedServices', 'delete') || hasPermission('wasteDisposal', 'delete');
  const hasAnyRowAction = canEditAny || canDeleteAny;
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProvidedService | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [quickFilter, setQuickFilter] = useState<string>(
    quickFilterProp ?? (typeof tablePrefs.quickFilters === 'string' ? tablePrefs.quickFilters : 'all')
  );
  const [filterService, setFilterService] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterInvoice, setFilterInvoice] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('scheduledDate');

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
      refetchPaginatedProvidedServices();
    },
    defaultSortField: 'scheduledDate',
    defaultSortDirection: 'desc',
  });

  const { data: services = [] } = useServicesQuery();
  const { data: clients = [] } = useClientsSummaryQuery();
  const { data: projects = [] } = useProjectsQuery('');
  const { data: invoices = [] } = useInvoicesQuery();

  const {
    data: paginatedData,
    refetch: refetchPaginatedProvidedServices,
  } = usePaginatedProvidedServicesQuery({
    page,
    rowsPerPage: activeRowsPerPage,
    sortBy: sortColumn,
    sortOrder: sortDirection,
    search: debouncedSearchQuery,
    status: filterStatus,
    serviceId: filterService,
    clientId: filterClient,
    projectId: filterProject,
    invoiceId: filterInvoice,
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
    dateField: filterDateField,
  });

  const rawItems = (paginatedData as any)?.items || (Array.isArray(paginatedData) ? paginatedData : []);
  const totalProvidedServices = paginatedData?.total ?? rawItems.length;

  const { handleSave, handleDelete } = useProvidedServicesMutations();
  const { handleSave: handleSaveService } = useServicesMutations();
  const { handleSave: handleSaveInvoice, handleDelete: handleDeleteInvoice, handleUpdateInvoiceStatus: handleStatusChangeInvoice } = useInvoicesMutations();

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const onDeleteProvidedService = (id: string) => handleDelete(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));
  const onDeleteInvoice = (id: string) => handleDeleteInvoice(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));


  // Custom data model state
  const [isCustomModelModalOpen, setIsCustomModelModalOpen] = useState(false);
  const [activeModelService, setActiveModelService] = useState<Service | null>(null);

  const getCustomModelForService = (serviceId: string): CustomFieldDefinition[] => {
    if (!serviceId) return [];
    const matchedService = services.find((s) => s.id === serviceId);
    if (matchedService?.customDataModel && Array.isArray(matchedService.customDataModel)) {
      return matchedService.customDataModel;
    }
    return [];
  };

  const handleSaveCustomModel = async (serviceId: string, fields: CustomFieldDefinition[]) => {
    await handleSaveService({ id: serviceId, customDataModel: fields });
  };



  useEffect(() => {
    if (quickFilterProp !== undefined) {
      setQuickFilter(quickFilterProp);
    }
  }, [quickFilterProp]);

  const handleQuickFilterChange = (val: string) => {
    setQuickFilter(val);
    if (onQuickFilterChangeProp) {
      onQuickFilterChangeProp(val);
    } else {
      tablePrefs.onQuickFiltersChange(val);
    }
  };

  const activeFilterCount =
    (quickFilter !== 'all' ? 1 : 0) +
    (filterService !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterProject !== 'all' ? 1 : 0) +
    (filterInvoice !== 'all' ? 1 : 0) +
    (filterDateFrom || filterDateTo ? 1 : 0) +
    (sortColumn !== 'scheduledDate' || sortDirection !== 'desc' ? 1 : 0);

  const clearFilters = () => {
    setQuickFilter('all');
    if (onQuickFilterChangeProp) {
      onQuickFilterChangeProp('all');
    } else {
      tablePrefs.onQuickFiltersChange('all');
    }
    setFilterService('all');
    setFilterClient('all');
    setFilterStatus('all');
    setFilterProject('all');
    setFilterInvoice('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('scheduledDate');
    resetSort();
  };



  const columnDefs: ColumnDef[] = [
    { id: 'service', label: t('colService') },
    { id: 'client', label: t('colClient') },
    { id: 'project', label: t('colProject') },
    { id: 'invoice', label: t('colInvoiceNumber') },
    { id: 'status', label: t('lblInvoiceStatus') },
    { id: 'scheduledDate', label: t('colScheduledDate') },
    { id: 'completionDate', label: t('colCompletionDate') },
    { id: 'location', label: t('colLocation') },
    { id: 'customData', label: t('colCustomData') },
    { id: 'notes', label: t('colDescription') },
  ];

  const getItemPermissions = useCallback((item: ProvidedService | null) => {
    if (!item) return { canEdit: canCreate, canDelete: false };
    const srv = item.service || services.find((s) => s.id === item.serviceId);
    const isWaste = srv?.group === 'grp-waste' || srv?.code?.toLowerCase().includes('waste');
    const canEdit = hasPermission('providedServices', 'edit') || (Boolean(isWaste) && hasPermission('wasteDisposal', 'edit'));
    const canDelete = hasPermission('providedServices', 'delete') || (Boolean(isWaste) && hasPermission('wasteDisposal', 'delete'));
    return { canEdit, canDelete };
  }, [hasPermission, services, canCreate]);

  const [modalMode, setModalMode] = useState<ModalMode>('view');

  const openNew = () => {
    if (!canCreate) return;
    setEditingItem(null);
    setModalMode('create');
    setIsOpen(true);
  };

  const openEdit = (item: ProvidedService) => {
    const { canEdit } = getItemPermissions(item);
    if (!canEdit) return;
    setEditingItem(item);
    setModalMode('edit');
    setIsOpen(true);
  };

  const openView = (item: ProvidedService) => {
    setEditingItem(item);
    setModalMode('view');
    setIsOpen(true);
  };

  const isWasteManagementService = (srv?: Service) => {
    if (!srv) return false;
    const group = (srv.group || '').toLowerCase();
    const code = (srv.code || '').toLowerCase();
    return (
      group === 'grp-waste' ||
      group.includes('waste') ||
      group.includes('otpad') ||
      code.includes('waste') ||
      code.includes('otpad')
    );
  };

  const displayedItems = quickFilter === 'waste-management'
    ? rawItems.filter((item: ProvidedService) => {
        const srv = item.service || services.find((s) => s.id === item.serviceId);
        return isWasteManagementService(srv);
      })
    : rawItems;

  useEffect(() => {
    setPage(0);
  }, [searchQuery, quickFilter, filterService, filterClient, filterStatus, filterProject, filterInvoice, filterDateFrom, filterDateTo, setPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

  const paginatedItems = displayedItems;

  const sortOptions = useMemo(
    () => [
      { value: 'scheduledDate', label: t('colScheduledDate') },
      { value: 'completionDate', label: t('colCompletionDate') },
      { value: 'service', label: t('colService') },
      { value: 'client', label: t('colClient') },
      { value: 'project', label: t('colProject') },
      { value: 'status', label: t('lblInvoiceStatus') },
      { value: 'createdAt', label: t('lblCreatedDate') },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: 'Planned', label: t('statusPlanned') },
      { value: 'In Progress', label: t('statusInProgress') },
      { value: 'Completed', label: t('statusCompleted') },
      { value: 'Cancelled', label: t('statusCancelled') },
    ],
    [t]
  );

  const getStatusChipColor = (
    st?: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (st) {
      case 'Completed':
      case 'Završeno':
      case 'Завршено':
        return 'success';
      case 'In Progress':
      case 'U toku':
      case 'У току':
        return 'info';
      case 'Cancelled':
      case 'Otkazano':
      case 'Отказано':
        return 'default';
      case 'Planned':
      case 'Planirano':
      case 'Планирано':
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (st?: string) => {
    switch (st) {
      case 'Planned':
        return t('statusPlanned');
      case 'In Progress':
        return t('statusInProgress');
      case 'Completed':
        return t('statusCompleted');
      case 'Cancelled':
        return t('statusCancelled');
      default:
        return st || t('statusPlanned');
    }
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
            {t('btnNewProvidedService')}
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
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('providedServicesListTitle')}
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

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            {/* Quick filter checkbox */}
            <TableQuickFilters
              options={[
                {
                  key: 'waste-management',
                  label: t('filterWasteManagement'),
                  color: 'primary',
                },
              ]}
              selectedKeys={quickFilter === 'waste-management' ? ['waste-management'] : []}
              onChange={(keys) => handleQuickFilterChange(keys.includes('waste-management') ? 'waste-management' : 'all')}
            />

            <TableSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
            />

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
                    { value: 'scheduledDate', label: t('colScheduledDate') },
                    { value: 'completionDate', label: t('colCompletionDate') },
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
                    onChange={(_, newValue) => setFilterStatus(newValue ? newValue.value : 'all')}
                    renderInput={(params) => <TextField {...params} label={t('lblInvoiceStatus')} size="small" />}
                  />

                  <ServiceAutocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    value={filterService === 'all' ? null : filterService}
                    valueMode="id"
                    onChange={(val) => setFilterService(val || 'all')}
                    label={t('colService')}
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
          <Table stickyHeader sx={{ width: '100%', minWidth: 800 }}>
            <TableHead>
              <TableRow>
                {activeCols.includes('service') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'service'}
                      direction={sortColumn === 'service' ? sortDirection : 'asc'}
                      onClick={() => handleSort('service')}
                    >
                      {t('colService')}
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
                {activeCols.includes('invoice') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'invoice'}
                      direction={sortColumn === 'invoice' ? sortDirection : 'asc'}
                      onClick={() => handleSort('invoice')}
                    >
                      {t('colInvoiceNumber')}
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
                      {t('lblInvoiceStatus')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('scheduledDate') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'scheduledDate'}
                      direction={sortColumn === 'scheduledDate' ? sortDirection : 'asc'}
                      onClick={() => handleSort('scheduledDate')}
                    >
                      {t('colScheduledDate')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('completionDate') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'completionDate'}
                      direction={sortColumn === 'completionDate' ? sortDirection : 'asc'}
                      onClick={() => handleSort('completionDate')}
                    >
                      {t('colCompletionDate')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('location') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'location'}
                      direction={sortColumn === 'location' ? sortDirection : 'asc'}
                      onClick={() => handleSort('location')}
                    >
                      {t('colLocation')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('customData') && <TableCell>{t('colCustomData')}</TableCell>}
                {activeCols.includes('notes') && <TableCell>{t('colDescription')}</TableCell>}
                {hasAnyRowAction && <TableCell align="right">{t('colActions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={activeCols.length + (hasAnyRowAction ? 1 : 0)}
                    align="center"
                    sx={{ py: 3, color: 'text.secondary' }}
                  >
                    {t('emptyProvidedServices')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item: any) => {
                  const srv = item.service || services.find((s) => s.id === item.serviceId);
                  const cli = item.client || clients.find((c) => c.id === item.clientId);
                  const prj = item.project || projects.find((p) => p.id === item.projectId);
                  const inv = item.invoice || invoices.find((i) => i.id === item.invoiceId);

                  return (
                    <TableRow key={item.id} hover onClick={() => openView(item)} sx={{ cursor: 'pointer' }}>
                      {activeCols.includes('service') && (
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {srv?.name || (srv ? getServiceLabel(srv.code) : item.serviceId)}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('client') && (
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {cli?.name || item.clientName || item.clientId}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('project') && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {prj?.name || item.projectName || '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('invoice') && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {inv?.invoiceNumber || '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('status') && (
                        <TableCell>
                          <Chip
                            label={getStatusLabel(item.status)}
                            size="small"
                            color={getStatusChipColor(item.status)}
                            variant="outlined"
                          />
                        </TableCell>
                      )}
                      {activeCols.includes('scheduledDate') && (
                        <TableCell>
                          {item.scheduledDate ? item.scheduledDate.split('T')[0] : '—'}
                        </TableCell>
                      )}
                      {activeCols.includes('completionDate') && (
                        <TableCell>
                          {item.completionDate ? item.completionDate.split('T')[0] : '—'}
                        </TableCell>
                      )}
                      {activeCols.includes('location') && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {item.location || '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('customData') && (
                        <TableCell sx={{ maxWidth: { xs: 200, sm: 260 } }}>
                          {item.customData && Object.keys(item.customData).length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(() => {
                                const badges = resolveCustomFieldBadges(item, services, clients);
                                if (badges.length === 0) {
                                  return (
                                    <Typography variant="body2" color="text.secondary">
                                      —
                                    </Typography>
                                  );
                                }
                                return badges.map((badge) => (
                                  <Chip
                                    key={badge.id}
                                    size="small"
                                    label={formatFieldBadgeLabel(badge)}
                                    variant="outlined"
                                    color="primary"
                                    sx={{ fontSize: '0.75rem', height: 22 }}
                                  />
                                ));
                              })()}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      {activeCols.includes('notes') && (
                        <TableCell sx={{ maxWidth: { xs: 180, sm: 240 } }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.notes || '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {hasAnyRowAction && (
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            {getItemPermissions(item).canEdit && (
                              <IconButton
                                size="small"
                                color="info"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(item);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                            {getItemPermissions(item).canDelete && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteProvidedService(item.id);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
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
          count={totalProvidedServices}
          rowsPerPage={activeRowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* NEW / EDIT PROVIDED SERVICE MODAL */}
      <ProvidedServiceModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        editingItem={editingItem}
        mode={modalMode}
        onModeChange={setModalMode}
        services={services}
        clients={clients}
        canCreate={canCreate}
        onDeleteProvidedService={onDeleteProvidedService}
        onSaveProvidedService={handleSave}
        onSaveInvoice={handleSaveInvoice}
        onDeleteInvoice={onDeleteInvoice}
        onStatusChangeInvoice={handleStatusChangeInvoice}
        onOpenCustomModelModal={(srv) => {
          setActiveModelService(srv);
          setIsCustomModelModalOpen(true);
        }}
        getCustomModelForService={getCustomModelForService}
        onError={(message) => setErrorDialogState({ open: true, message })}
      />

      {/* CUSTOM DATA MODEL DEFINITION MODAL */}
      <CustomDataModelModal
        isOpen={isCustomModelModalOpen}
        onClose={() => {
          setIsCustomModelModalOpen(false);
          setActiveModelService(null);
        }}
        service={activeModelService}
        initialFields={activeModelService ? getCustomModelForService(activeModelService.id) : []}
        onSave={handleSaveCustomModel}
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

export default ProvidedServicesPage;
