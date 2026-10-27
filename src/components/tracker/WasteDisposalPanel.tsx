import React, { useState, useMemo, useEffect } from 'react';
import {
  Typography,
  IconButton,
  Tooltip,
  TextField,
  Box,
  Chip,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import type {
  ProvidedService,
  Service,
  Client,
  Project,
  Invoice,
  Category,
  SaveResult,
  CustomFieldDefinition,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TableFilterSelector } from '../common/TableFilterSelector';
import { TableOptionsSelector } from '../common/ColumnSelector';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { ErrorDialog } from '../dialogs/ErrorDialog';
import {
  DeleteSweepIcon,
  CalendarTodayIcon,
  LocationOnIcon,
  FolderIcon,
  ReceiptLongIcon,
  CheckCircleIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  VisibilityIcon,
  EditIcon,
  DeleteIcon,
} from '../icons';
import { DashboardPanelSkeleton } from '../tracker/DashboardPanelSkeleton';
import { type QuickFilterItem } from '../common/TableQuickFilters';
import { useTableView } from '../../hooks/useTableView';
import {
  resolveCustomFieldBadges,
  formatFieldBadgeLabel,
} from '../../utils/customFields';
import {
  useServicesMutations,
  useProjectsSummaryQuery,
  usePaginatedProvidedServicesQuery,
  useClientsSummaryQuery,
  useServicesQuery,
  useWasteDisposalServiceQuery,
} from '../../queries';
import { isWasteDisposalService } from '../../utils/serviceUtils';
import { WasteDisposalModal } from './WasteDisposalModal';
import { useDebounce } from '../../hooks/useDebounce';

interface Props {
  providedServices?: ProvidedService[];
  services?: Service[];
  clients?: Client[];
  projects?: Project[];
  invoices?: Invoice[];
  categories?: Category[];
  isFullHeight?: boolean;
  hideNotch?: boolean;
  openNewTrigger?: number;
  onNewTriggerHandled?: () => void;
  onSaveProvidedService?: (ps: Partial<ProvidedService>) => Promise<SaveResult | void> | void;
  onDeleteProvidedService?: (id: string) => void;
  onSaveInvoice?: (invoice: Partial<Invoice>) => Promise<SaveResult | void> | void;
  onDeleteInvoice?: (id: string) => void;
  onStatusChangeInvoice?: (id: string, status: string, paymentDate?: string) => void;
  rowsPerPageOptions?: number[];
  onRowsPerPageOptionsChange?: (options: number[]) => void;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onTotalCountChange?: (count: number) => void;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const clean = d.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${day}.${m}.${y}.`;
  }
  return d;
}


export const WasteDisposalPanel: React.FC<Props> = ({
  providedServices: providedServicesProp,
  services: servicesProp = [],
  clients: clientsProp = [],
  projects: projectsProp = [],
  invoices: invoicesProp = [],
  categories: _categories = [],
  isFullHeight = false,
  hideNotch = false,
  openNewTrigger,
  onNewTriggerHandled,
  onSaveProvidedService,
  onDeleteProvidedService,
  onSaveInvoice,
  onDeleteInvoice,
  onStatusChangeInvoice,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  onRefresh,
  isRefreshing,
  onTotalCountChange,
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { hasPermission } = useAuth();
  const { handleSave: handleSaveService } = useServicesMutations();
  const canEdit = hasPermission('wasteDisposal', 'edit') || hasPermission('providedServices', 'edit');
  const canDelete = hasPermission('wasteDisposal', 'delete') || hasPermission('providedServices', 'delete');
  const canManageServices = hasPermission('services', 'edit');

  // Pagination mode: if providedServices was passed explicitly with items, use client-side pagination, else use server-side pagination
  const isServerPaginated = !providedServicesProp || providedServicesProp.length === 0;

  // Filter Popover & Dialog State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingItem, setEditingItem] = useState<ProvidedService | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const shouldFetchSupportingData = isFilterOpen;

  const { data: fetchedClients = [] } = useClientsSummaryQuery({
    enabled: clientsProp.length === 0 && shouldFetchSupportingData,
  });
  const clients: Client[] = clientsProp.length > 0 ? clientsProp : (fetchedClients as Client[]);

  const { data: fetchedServices = [] } = useServicesQuery({
    enabled: servicesProp.length === 0 && shouldFetchSupportingData,
  });
  const services: Service[] = servicesProp.length > 0 ? servicesProp : fetchedServices;

  const { data: fetchedProjects = [] } = useProjectsSummaryQuery({
    enabled: projectsProp.length === 0 && shouldFetchSupportingData,
  });
  const projects: Project[] = projectsProp.length > 0 ? projectsProp : (fetchedProjects as unknown as Project[]);
  const allProjects = projects;

  const invoices: Invoice[] = invoicesProp;

  const handleSaveCustomModel = async (serviceId: string, fields: CustomFieldDefinition[]) => {
    await handleSaveService({ id: serviceId, customDataModel: fields });
  };

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('scheduledDate');
  const [quickFilterMissingInvoice, setQuickFilterMissingInvoice] = useState(false);

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
    defaultSortField: 'scheduledDate',
    defaultSortDirection: 'desc',
  });

  // Filter waste services from the general services list
  const wasteServices = useMemo(() => {
    return services.filter((s) => isWasteDisposalService(s));
  }, [services]);

  const { data: defaultWasteService, isLoading: isWasteServiceLoading } = useWasteDisposalServiceQuery({
    enabled: servicesProp.length === 0 && wasteServices.length === 0 && isDialogOpen && !editingItem,
  });

  const targetWasteService = wasteServices.length > 0 ? wasteServices[0] : (defaultWasteService || null);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
  }, [
    searchQuery,
    filterStatus,
    filterService,
    filterClient,
    filterProject,
    filterDateFrom,
    filterDateTo,
    filterDateField,
    sortOption,
    sortDirection,
    quickFilterMissingInvoice,
  ]);

  // Handle external trigger to open modal for new item
  useEffect(() => {
    if (openNewTrigger && openNewTrigger > 0) {
      handleOpenNew();
      if (onNewTriggerHandled) onNewTriggerHandled();
    }
  }, [openNewTrigger]);

  // Client-side fallback list: only provided services corresponding to waste disposal
  const providedServices = providedServicesProp || [];
  const wasteProvidedServices = useMemo(() => {
    return providedServices.filter((item) => {
      const srv = item.service || services.find((s) => s.id === item.serviceId);
      return isWasteDisposalService(srv);
    });
  }, [providedServices, services]);

  // Server-side paginated query
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const {
    data: paginatedData,
    isLoading: isPaginatedLoading,
    isRefetching: isPaginatedRefetching,
    refetch: refetchPaginated,
  } = usePaginatedProvidedServicesQuery(
    {
      page,
      rowsPerPage: activeRowsPerPage,
      sortBy: sortOption,
      sortOrder: sortDirection,
      search: debouncedSearchQuery,
      status: filterStatus,
      serviceId: filterService,
      clientId: filterClient,
      projectId: filterProject,
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
      dateField: filterDateField,
      isWasteDisposalOnly: true,
      missingInvoice: quickFilterMissingInvoice,
    },
    isServerPaginated
  );

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterService('all');
    setFilterClient('all');
    setFilterProject('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('scheduledDate');
    resetSort();
    setQuickFilterMissingInvoice(false);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterService !== 'all') count++;
    if (filterClient !== 'all') count++;
    if (filterProject !== 'all') count++;
    if (filterDateFrom || filterDateTo) count++;
    if (quickFilterMissingInvoice) count++;
    if (sortOption !== 'scheduledDate' || sortDirection !== 'desc') count++;
    return count;
  }, [
    filterStatus,
    filterService,
    filterClient,
    filterProject,
    filterDateFrom,
    filterDateTo,
    quickFilterMissingInvoice,
    sortOption,
    sortDirection,
  ]);

  // Status Chip helper
  const getStatusChip = (status: string) => {
    const s = (status || '').toLowerCase();
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    let label = status || '—';

    if (s === 'completed' || s === 'završeno' || s === 'завршено') {
      color = 'success';
      label = t('statusCompleted');
    } else if (s === 'in progress' || s === 'in_progress' || s === 'u toku' || s === 'у току') {
      color = 'info';
      label = t('statusInProgress');
    } else if (s === 'planned' || s === 'planirano' || s === 'планирано') {
      color = 'warning';
      label = t('statusPlanned');
    } else if (s === 'cancelled' || s === 'otkazano' || s === 'отказано') {
      color = 'default';
      label = t('statusCancelled');
    }

    return (
      <Chip
        label={label}
        size="small"
        color={color}
        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
      />
    );
  };

  // Filtered & Sorted items
  const filteredAndSortedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = wasteProvidedServices.filter((item) => {
      const srv = item.service || services.find((s) => s.id === item.serviceId);
      const cl = item.client || clients.find((c) => c.id === item.clientId);
      const pr = item.project || projects.find((p) => p.id === item.projectId);
      const inv = item.invoice || invoices.find((i) => i.id === item.invoiceId);

      const serviceName = srv ? getServiceLabel(srv.code, services) || srv.name : '';
      const clientName = cl ? cl.name : '';
      const projectName = pr ? pr.name : '';
      const invoiceNumber = inv ? inv.invoiceNumber : '';
      const location = item.location || '';
      const notes = item.notes || '';

      // Search matching
      if (q) {
        let match =
          serviceName.toLowerCase().includes(q) ||
          clientName.toLowerCase().includes(q) ||
          projectName.toLowerCase().includes(q) ||
          invoiceNumber.toLowerCase().includes(q) ||
          location.toLowerCase().includes(q) ||
          notes.toLowerCase().includes(q) ||
          (item.status && item.status.toLowerCase().includes(q));

        if (!match && item.customData && typeof item.customData === 'object') {
          match = Object.values(item.customData).some((val) => {
            if (val === null || val === undefined) return false;
            if (Array.isArray(val)) {
              return val.some((v) => String(v).toLowerCase().includes(q));
            }
            return String(val).toLowerCase().includes(q);
          });
        }

        if (!match) return false;
      }

      // Quick filter missing invoice
      if (quickFilterMissingInvoice && item.invoiceId) {
        return false;
      }

      // Dropdown filters
      if (filterStatus !== 'all') {
        const itemStatus = (item.status || '').toLowerCase();
        const fStatus = filterStatus.toLowerCase();
        if (fStatus === 'planned' && itemStatus !== 'planned' && itemStatus !== 'planirano') return false;
        if (fStatus === 'in progress' && itemStatus !== 'in progress' && itemStatus !== 'in_progress' && itemStatus !== 'u toku') return false;
        if (fStatus === 'completed' && itemStatus !== 'completed' && itemStatus !== 'završeno') return false;
        if (fStatus === 'cancelled' && itemStatus !== 'cancelled' && itemStatus !== 'otkazano') return false;
        if (!['planned', 'in progress', 'completed', 'cancelled'].includes(fStatus) && itemStatus !== fStatus) return false;
      }

      if (filterService !== 'all' && item.serviceId !== filterService) return false;
      if (filterClient !== 'all' && item.clientId !== filterClient) return false;
      if (filterProject !== 'all' && item.projectId !== filterProject) return false;

      // Date range filter
      if (filterDateFrom || filterDateTo) {
        let rawDate: string | null | undefined = null;
        if (filterDateField === 'completionDate') {
          rawDate = item.completionDate;
        } else if (filterDateField === 'createdAt') {
          rawDate = item.createdAt;
        } else {
          rawDate = item.scheduledDate;
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

    return [...filtered].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      switch (sortOption) {
        case 'scheduledDate':
          aVal = a.scheduledDate ? new Date(a.scheduledDate.split('T')[0]).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
          bVal = b.scheduledDate ? new Date(b.scheduledDate.split('T')[0]).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
          break;
        case 'completionDate':
          aVal = a.completionDate ? new Date(a.completionDate.split('T')[0]).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
          bVal = b.completionDate ? new Date(b.completionDate.split('T')[0]).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
          break;
        case 'client': {
          const clA = a.client || clients.find((c) => c.id === a.clientId);
          const clB = b.client || clients.find((c) => c.id === b.clientId);
          aVal = (clA?.name || '').toLowerCase();
          bVal = (clB?.name || '').toLowerCase();
          break;
        }
        case 'service': {
          const sA = a.service || services.find((s) => s.id === a.serviceId);
          const sB = b.service || services.find((s) => s.id === b.serviceId);
          aVal = (sA?.name || '').toLowerCase();
          bVal = (sB?.name || '').toLowerCase();
          break;
        }
        case 'status':
          aVal = (a.status || '').toLowerCase();
          bVal = (b.status || '').toLowerCase();
          break;
        case 'createdAt':
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [
    wasteProvidedServices,
    services,
    clients,
    projects,
    invoices,
    searchQuery,
    quickFilterMissingInvoice,
    filterStatus,
    filterService,
    filterClient,
    filterProject,
    filterDateFrom,
    filterDateTo,
    filterDateField,
    sortOption,
    sortDirection,
    getServiceLabel,
  ]);

  const paginatedItems = useMemo(() => {
    return filteredAndSortedItems.slice(page * activeRowsPerPage, page * activeRowsPerPage + activeRowsPerPage);
  }, [filteredAndSortedItems, page, activeRowsPerPage]);

  const totalCount = isServerPaginated
    ? (paginatedData?.total ?? 0)
    : filteredAndSortedItems.length;

  useEffect(() => {
    if (onTotalCountChange) {
      onTotalCountChange(totalCount);
    }
  }, [totalCount, onTotalCountChange]);

  const displayItems = isServerPaginated
    ? (paginatedData?.items || [])
    : paginatedItems;

  // Unique clients for dropdown
  const uniqueClients = useMemo(() => {
    const map = new Map<string, string>();
    displayItems.forEach((item) => {
      const c = item.client || clients.find((cl) => cl.id === item.clientId);
      if (c?.id && c?.name) map.set(c.id, c.name);
    });
    clients.forEach((c) => {
      if (c.id && c.name && !map.has(c.id)) map.set(c.id, c.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [displayItems, clients]);

  // Unique projects for dropdown
  const uniqueProjects = useMemo(() => {
    const map = new Map<string, string>();
    displayItems.forEach((item) => {
      const p = item.project || allProjects.find((pr) => pr.id === item.projectId);
      if (p?.id && p?.name) map.set(p.id, p.name);
    });
    allProjects.forEach((p) => {
      if (p.id && p.name && !map.has(p.id)) map.set(p.id, p.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [displayItems, allProjects]);

  const quickFilterOptions: QuickFilterItem[] = useMemo(() => [
    { key: 'Planned', label: t('statusPlanned'), color: 'warning' },
    { key: 'In Progress', label: t('statusInProgress'), color: 'info' },
    { key: 'Completed', label: t('statusCompleted'), color: 'success' },
    { key: 'missing_invoice', label: t('quickFilterMissingInvoice'), color: 'warning' },
  ], [t]);

  const selectedQuickFilters = useMemo(() => {
    const keys: string[] = [];
    if (filterStatus !== 'all') keys.push(filterStatus);
    if (quickFilterMissingInvoice) keys.push('missing_invoice');
    return keys;
  }, [filterStatus, quickFilterMissingInvoice]);

  const handleQuickFiltersChange = (keys: string[]) => {
    setQuickFilterMissingInvoice(keys.includes('missing_invoice'));
    const statusKeys = keys.filter((k) => k !== 'missing_invoice');
    if (statusKeys.length > 0) {
      setFilterStatus(statusKeys[statusKeys.length - 1]);
    } else {
      setFilterStatus('all');
    }
  };

  // Dialog handlers
  const handleOpenNew = () => {
    setEditingItem(null);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenView = (item: ProvidedService) => {
    setEditingItem(item);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: ProvidedService) => {
    setEditingItem(item);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleQuickComplete = async (item: ProvidedService, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSaveProvidedService) return;
    try {
      await onSaveProvidedService({
        id: item.id,
        status: 'Completed',
        completionDate: item.completionDate || new Date().toISOString().slice(0, 10),
      });
    } catch (err: any) {
      setErrorDialogState({
        open: true,
        message: err?.message || t('errorSavingProject'),
      });
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteProvidedService) {
      onDeleteProvidedService(id);
    }
  };

  const handleSave = async (payload: Partial<ProvidedService>) => {
    setIsSaving(true);
    try {
      if (onSaveProvidedService) {
        const result = await onSaveProvidedService(payload);
        if (result && !result.success && result.error) {
          setErrorDialogState({ open: true, message: result.error });
          return;
        }
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      setErrorDialogState({
        open: true,
        message: err?.message || t('errorSavingProject'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Extract useful waste badges from customData for an item
  const renderWasteBadges = (item: ProvidedService) => {
    const badges = resolveCustomFieldBadges(item, services);
    if (badges.length === 0) return null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 0.25 }}>
        {badges.slice(0, 3).map((badge) => (
          <Chip
            key={badge.id}
            size="small"
            variant="outlined"
            label={formatFieldBadgeLabel(badge)}
            sx={{
              height: 20,
              fontSize: '0.68rem',
              bgcolor: 'action.hover',
              borderColor: 'divider',
              color: 'text.secondary',
            }}
          />
        ))}
        {badges.length > 3 && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
            +{badges.length - 3}
          </Typography>
        )}
      </Box>
    );
  };

  const sortOptions = [
    { value: 'scheduledDate', label: t('colScheduledDate') },
    { value: 'completionDate', label: t('colCompletionDate') },
    { value: 'client', label: t('colClient') },
    { value: 'service', label: t('colService') },
    { value: 'status', label: t('colStatus') },
    { value: 'createdAt', label: t('lblCreatedDate') },
  ];

  const statusFilterOptions = [
    { value: 'all', label: t('filterAllStatus') },
    { value: 'Planned', label: t('statusPlanned') },
    { value: 'In Progress', label: t('statusInProgress') },
    { value: 'Completed', label: t('statusCompleted') },
    { value: 'Cancelled', label: t('statusCancelled') },
  ];

  return (
    <>
      <DashboardPanelSkeleton
        title={t('subTabWasteDisposal')}
        icon={<DeleteSweepIcon sx={{ fontSize: 18 }} />}
        isFullHeight={isFullHeight}
        hideNotch={hideNotch}
        isEmpty={totalCount === 0 && !isPaginatedLoading}
        emptyMessage={t('emptyWasteDisposal')}
        paginationProps={{
          count: totalCount,
          page,
          rowsPerPage: activeRowsPerPage,
          rowsPerPageOptions: activeRowsPerPageOptions,
          onPageChange: (_, newPage) => setPage(newPage),
          onRowsPerPageChange: (e) => {
            const rpp = parseInt(e.target.value, 10);
            setRowsPerPageValue(rpp);
            setPage(0);
          },
          labelRowsPerPage: t('lblRowsPerPage'),
        }}
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
        }}
        quickFiltersProps={{
          options: quickFilterOptions,
          selectedKeys: selectedQuickFilters,
          onChange: handleQuickFiltersChange,
        }}
        refreshProps={{
          onRefresh: () => {
            if (onRefresh) onRefresh();
            if (isServerPaginated) refetchPaginated();
          },
          isRefreshing: isRefreshing || (isServerPaginated && isPaginatedRefetching),
        }}
        filterSelector={
          <TableFilterSelector
            activeCount={activeFilterCount}
            onClear={handleClearAllFilters}
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
                  options={statusFilterOptions}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, val) => option.value === val.value}
                  value={statusFilterOptions.find((o) => o.value === filterStatus) || statusFilterOptions[0]}
                  onChange={(_, newValue) => setFilterStatus(newValue ? newValue.value : 'all')}
                  renderInput={(params) => <TextField {...params} label={t('colStatus')} size="small" />}
                />

                <Autocomplete
                  size="small"
                  fullWidth
                  disablePortal
                  options={wasteServices}
                  getOptionLabel={(option) => getServiceLabel(option.code, services) || option.name}
                  value={wasteServices.find((s) => s.id === filterService) || null}
                  onChange={(_, newValue) => setFilterService(newValue ? newValue.id : 'all')}
                  renderInput={(params) => <TextField {...params} label={t('colService')} size="small" />}
                />

                <Autocomplete
                  size="small"
                  fullWidth
                  disablePortal
                  options={uniqueClients}
                  getOptionLabel={(option) => option.name}
                  value={uniqueClients.find((c) => c.id === filterClient) || null}
                  onChange={(_, newValue) => setFilterClient(newValue ? newValue.id : 'all')}
                  renderInput={(params) => <TextField {...params} label={t('colClient')} size="small" />}
                />

                {uniqueProjects.length > 0 && (
                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={uniqueProjects}
                    getOptionLabel={(option) => option.name}
                    value={uniqueProjects.find((p) => p.id === filterProject) || null}
                    onChange={(_, newValue) => setFilterProject(newValue ? newValue.id : 'all')}
                    renderInput={(params) => <TextField {...params} label={t('colProject')} size="small" />}
                  />
                )}
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
            defaultRowsPerPageOptions={[5, 10, 20]}
          />
        }
        listContent={
          isPaginatedLoading && displayItems.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            displayItems.map((item) => {
          const srv = item.service || services.find((s) => s.id === item.serviceId);
          const cl = item.client || clients.find((c) => c.id === item.clientId);
          const pr = item.project || projects.find((p) => p.id === item.projectId);
          const inv = item.invoice || invoices.find((i) => i.id === item.invoiceId);

          const serviceName = srv ? getServiceLabel(srv.code, services) || srv.name : '—';
          const isCompleted = (item.status || '').toLowerCase() === 'completed' || (item.status || '').toLowerCase() === 'završeno';

          return (
            <Box
              key={item.id}
              onClick={() => handleOpenView(item)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                px: 2,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.light',
                  boxShadow: 1,
                },
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1, mr: 2 }}>
                {/* FIRST ROW: Icon, Service Name, Client Name, Status Chip, Location */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <DeleteSweepIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {serviceName}
                    </Typography>
                  </Box>

                  {cl?.name && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      • {cl.name}
                    </Typography>
                  )}

                  {getStatusChip(item.status)}

                  {item.location && (
                    <Chip
                      icon={<LocationOnIcon sx={{ fontSize: '13px !important' }} />}
                      size="small"
                      variant="outlined"
                      label={item.location}
                      sx={{ height: 20, fontSize: '0.68rem' }}
                    />
                  )}
                </Box>

                {/* SECOND ROW: Scheduled date, Completion date, Linked Project, Linked Invoice */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', color: 'text.secondary', fontSize: '0.75rem' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: 'text.secondary',
                    }}
                  >
                    <CalendarTodayIcon sx={{ fontSize: '0.8rem' }} />
                    {t('colScheduledDate')}: {fmtDate(item.scheduledDate)}
                  </Typography>

                  {item.completionDate && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: 'success.main',
                        fontWeight: 600,
                      }}
                    >
                      {t('colCompletionDate')}: {fmtDate(item.completionDate)}
                    </Typography>
                  )}

                  {pr && (
                    <Chip
                      icon={<FolderIcon sx={{ fontSize: '13px !important' }} />}
                      size="small"
                      variant="outlined"
                      color="primary"
                      label={pr.name}
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                    />
                  )}

                  {inv ? (
                    <Chip
                      icon={<ReceiptLongIcon sx={{ fontSize: '13px !important' }} />}
                      size="small"
                      variant="outlined"
                      color={inv.status === 'Paid' ? 'success' : 'warning'}
                      label={`${t('tabInvoices')}: ${inv.invoiceNumber}`}
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                    />
                  ) : (
                    <Chip
                      size="small"
                      variant="outlined"
                      color="warning"
                      label={t('quickFilterMissingInvoice')}
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                    />
                  )}
                </Box>

                {/* THIRD ROW: Custom Data Fields (Waste Type, Quantity, Index Code) */}
                {renderWasteBadges(item)}

                {item.notes && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      color: 'text.secondary',
                      fontStyle: 'italic',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.notes}
                  </Typography>
                )}
              </Box>

              {/* ACTION BUTTONS */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {!isCompleted && canEdit && (
                  <Tooltip title={t('btnMarkDone')}>
                    <IconButton
                      size="small"
                      color="success"
                      onClick={(e) => handleQuickComplete(item, e)}
                    >
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title={t('btnView')}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenView(item);
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {canEdit && (
                  <Tooltip title={t('btnEdit')}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(item);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {canDelete && (
                  <Tooltip title={t('btnDelete')}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => handleDelete(item.id, e)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          );
        })
      )}
      />

      {/* CREATE / EDIT / VIEW MODAL */}
      <WasteDisposalModal
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingItem={editingItem}
        isViewMode={isViewMode}
        onEdit={() => setIsViewMode(false)}
        onSave={handleSave}
        isSaving={isSaving}
        targetWasteService={targetWasteService}
        isWasteServiceLoading={isWasteServiceLoading}
        services={services}
        clients={clients}
        projects={projects}
        invoices={invoices}
        canEdit={canEdit}
        canManageServices={canManageServices}
        onSaveCustomModel={handleSaveCustomModel}
        onSaveInvoice={onSaveInvoice}
        onDeleteInvoice={onDeleteInvoice}
        onStatusChangeInvoice={onStatusChangeInvoice}
        setErrorDialogState={setErrorDialogState}
      />

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState({ open: false, message: '' })}
      />
    </>
  );
};

export const WasteManagementPanel = WasteDisposalPanel;
