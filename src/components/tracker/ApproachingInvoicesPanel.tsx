import React, { useState, useMemo, useEffect } from 'react';
import {
  Typography,
  IconButton,
  Tooltip,
  TextField,
  Box,
  Chip,
  Autocomplete,
  Button,
  CircularProgress,
} from '@mui/material';

import type { Invoice, Client, Project, ProvidedService, SaveResult } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { enhanceInvoicesWithLinks } from '../../utils/invoiceUtils';
import { InvoiceModal } from '../invoice/InvoiceModal';
import { TableFilterSelector } from '../common/TableFilterSelector';
import { TableOptionsSelector } from '../common/ColumnSelector';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { ErrorDialog } from '../common/dialogs/ErrorDialog';
import {
  CheckCircleIcon,
  CalendarTodayIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  ReceiptLongIcon,
  LinkIcon,
  VisibilityIcon,
  EditIcon,
  DeleteIcon,
  AddIcon,
} from '../icons';
import { DashboardPanelSkeleton } from '../common/DashboardPanelSkeleton';
import { useTableView } from '../../hooks/useTableView';
import { useDebounce } from '../../hooks/useDebounce';
import {
  usePaginatedInvoicesQuery,
  useClientsSummaryQuery,
  useProjectsSummaryQuery,
} from '../../queries';

interface Props {
  invoices?: Invoice[];
  clients?: Client[];
  projects?: Project[];
  providedServices?: ProvidedService[];
  isFullHeight?: boolean;
  hideNotch?: boolean;
  openNewInvoiceTrigger?: number;
  onNewInvoiceTriggerHandled?: () => void;
  onSaveProvidedService?: (ps: Partial<ProvidedService>) => Promise<SaveResult | void> | void;
  onSaveInvoice?: (invoice: Partial<Invoice>) => Promise<SaveResult | void> | void;
  onDeleteInvoice?: (id: string) => void;
  onStatusChangeInvoice?: (id: string, status: string, paymentDate?: string) => Promise<void> | void;
  onViewProject?: (project: Project) => void;
  onNavigateToInvoices?: () => void;
  rowsPerPageOptions?: number[];
  onRowsPerPageOptionsChange?: (options: number[]) => void;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onTotalCountChange?: (count: number) => void;
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

const formatInvoiceAmount = (amount?: number | null, curr?: string | null) => {
  const val = amount || 0;
  const c = curr || 'RSD';
  return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;
};

export const ApproachingInvoicesPanel: React.FC<Props> = ({
  invoices: invoicesProp,
  clients: clientsProp = [],
  projects: projectsProp = [],
  providedServices: providedServicesProp = [],
  isFullHeight = false,
  hideNotch = false,
  openNewInvoiceTrigger,
  onNewInvoiceTriggerHandled,
  onSaveProvidedService,
  onSaveInvoice,
  onDeleteInvoice,
  onStatusChangeInvoice,
  onViewProject: _onViewProject,
  onNavigateToInvoices: _onNavigateToInvoices,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  onRefresh,
  isRefreshing,
  onTotalCountChange,
}) => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('tracker_invoices', 'create') || hasPermission('invoices', 'create');
  const canEdit = hasPermission('tracker_invoices', 'edit') || hasPermission('invoices', 'edit');
  const canDelete = hasPermission('tracker_invoices', 'delete') || hasPermission('invoices', 'delete');

  // Pagination mode: if invoices was passed explicitly with items, use client-side pagination, else use server-side pagination
  const isServerPaginated = !invoicesProp || invoicesProp.length === 0;

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('dueDate');
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

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

  // Modal / Dialog state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Server-side paginated invoices query
  const {
    data: paginatedData,
    refetch: refetchPaginatedInvoices,
    isLoading: isPaginatedLoading,
    isFetching: isPaginatedFetching,
  } = usePaginatedInvoicesQuery(
    {
      page,
      rowsPerPage: activeRowsPerPage,
      sortBy: sortOption,
      sortOrder: sortDirection,
      search: debouncedSearchQuery,
      status: filterStatus === 'all' ? undefined : filterStatus,
      clientId: filterClient === 'all' ? undefined : filterClient,
      projectId: filterProject === 'all' ? undefined : filterProject,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
      dateField: (filterDateFrom || filterDateTo) ? filterDateField : undefined,
    },
    isServerPaginated
  );

  // Fetch auxiliary supporting data only when filter panel is opened
  const shouldFetchSupportingData = isFilterOpen;

  const { data: fetchedClients = [] } = useClientsSummaryQuery({
    enabled: clientsProp.length === 0 && shouldFetchSupportingData,
  });
  const { data: fetchedProjects = [] } = useProjectsSummaryQuery({
    enabled: projectsProp.length === 0 && shouldFetchSupportingData,
  });

  const clients = clientsProp.length > 0 ? clientsProp : (fetchedClients as Client[]);
  const projects = projectsProp.length > 0 ? projectsProp : (fetchedProjects as unknown as Project[]);
  const providedServices = providedServicesProp;

  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, filterStatus, filterClient, filterProject, filterDateFrom, filterDateTo, filterDateField, sortOption, sortDirection]);

  useEffect(() => {
    if (openNewInvoiceTrigger && openNewInvoiceTrigger > 0) {
      handleOpenNew();
      if (onNewInvoiceTriggerHandled) onNewInvoiceTriggerHandled();
    }
  }, [openNewInvoiceTrigger]);

  const handleClearAllFilters = () => {
    setFilterStatus('all');
    setFilterClient('all');
    setFilterProject('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('dueDate');
    setSearchQuery('');
    resetSort();
  };

  const getStatusChipColor = (status?: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Sent': return 'info';
      case 'Paid': return 'success';
      case 'Overdue': return 'error';
      case 'Cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (st?: string) => {
    switch (st) {
      case 'Draft': return t('statusDraft');
      case 'Sent': return t('statusSent');
      case 'Paid': return t('statusPaid');
      case 'Overdue': return t('statusOverdue');
      case 'Cancelled': return t('statusCancelled');
      default: return st || '—';
    }
  };

  const isOverdueInvoice = (inv: Invoice): boolean => {
    if (inv.status === 'Paid' || inv.status === 'Cancelled') return false;
    if (inv.status === 'Overdue') return true;
    if (!inv.dueDate) return false;
    const due = new Date(inv.dueDate.split('T')[0]);
    const today = new Date(new Date().toDateString());
    return due < today;
  };

  const isApproachingInvoice = (inv: Invoice): boolean => {
    if (inv.status === 'Paid' || inv.status === 'Cancelled') return false;
    if (!inv.dueDate) return true;
    const due = new Date(inv.dueDate.split('T')[0]);
    const today = new Date(new Date().toDateString());
    const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 15;
  };

  // Enhance all invoices with links so all statuses can be sorted and filtered
  const enhancedInvoices = useMemo(() => {
    if (isServerPaginated) return [];
    return enhanceInvoicesWithLinks(invoicesProp || []);
  }, [isServerPaginated, invoicesProp]);

  const serverItems = useMemo(() => {
    return enhanceInvoicesWithLinks(paginatedData?.items || []);
  }, [paginatedData?.items]);

  const getInvoiceTypeChip = (type?: string | null) => {
    if (!type || type === 'Standard') {
      return (
        <Chip
          label={t('typeStandard')}
          size="small"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 500, color: 'text.secondary', borderColor: 'divider' }}
        />
      );
    }
    switch (type) {
      case 'Advance':
        return (
          <Chip
            label={t('badgeAdvance')}
            size="small"
            color="secondary"
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
          />
        );
      case 'Final':
        return (
          <Chip
            label={t('badgeFinal')}
            size="small"
            color="primary"
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
          />
        );
      case 'Partial':
        return (
          <Chip
            label={t('badgePartial')}
            size="small"
            color="info"
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
          />
        );
      default:
        return (
          <Chip
            label={type}
            size="small"
            variant="outlined"
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
          />
        );
    }
  };

  const getLinkedInvoiceLabel = (linkedInv?: Invoice | null) => {
    const type = linkedInv?.invoiceType || 'Standard';
    switch (type) {
      case 'Advance':
        return t('badgeAdvance');
      case 'Final':
        return t('badgeFinal');
      case 'Partial':
        return t('badgePartial');
      default:
        return t('typeStandard');
    }
  };

  const getLinkedInvoiceChipColor = (type?: string | null): 'secondary' | 'primary' | 'info' | 'default' => {
    switch (type) {
      case 'Advance':
        return 'secondary';
      case 'Final':
        return 'primary';
      case 'Partial':
        return 'info';
      default:
        return 'default';
    }
  };

  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => {
      if (c.name && c.name.trim()) set.add(c.name.trim());
    });
    (invoicesProp || []).forEach((inv) => {
      if (inv.clientName && inv.clientName.trim()) set.add(inv.clientName.trim());
    });
    return Array.from(set).sort();
  }, [clients, invoicesProp]);

  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.name && p.name.trim()) set.add(p.name.trim());
    });
    (invoicesProp || []).forEach((inv) => {
      if (inv.projectName && inv.projectName.trim()) set.add(inv.projectName.trim());
    });
    return Array.from(set).sort();
  }, [projects, invoicesProp]);



  const sortOptions = useMemo(() => [
    { value: 'dueDate', label: t('colDueDate') },
    { value: 'dateCreated', label: t('colDateCreated') },
    { value: 'totalAmount', label: t('colTotalAmount') },
    { value: 'invoiceNumber', label: t('colInvoiceNumber') },
    { value: 'client', label: t('colClient') },
    { value: 'project', label: t('colProject') },
    { value: 'status', label: t('colStatus') },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filterAll') },
    { value: 'unpaid', label: t('statusUnpaid') },
    { value: 'Draft', label: t('statusDraft') },
    { value: 'Sent', label: t('statusSent') },
    { value: 'Paid', label: t('statusPaid') },
    { value: 'Overdue', label: t('statusOverdue') },
    { value: 'Cancelled', label: t('statusCancelled') },
  ], [t]);

  const filteredAndSortedItems = useMemo(() => {
    if (isServerPaginated) return [];
    const q = searchQuery.toLowerCase().trim();

    const filtered = enhancedInvoices.filter((inv) => {
      if (q) {
        const numMatch = (inv.invoiceNumber || '').toLowerCase().includes(q);
        const clientMatch = (inv.clientName || '').toLowerCase().includes(q);
        const projMatch = (inv.projectName || '').toLowerCase().includes(q);
        const notesMatch = (inv.notes || '').toLowerCase().includes(q);
        const statusMatch = (inv.status || '').toLowerCase().includes(q) || getStatusLabel(inv.status).toLowerCase().includes(q);
        const itemsMatch = (inv.items || []).some((it) => it.description.toLowerCase().includes(q));
        if (!numMatch && !clientMatch && !projMatch && !notesMatch && !statusMatch && !itemsMatch) return false;
      }

      if (filterStatus !== 'all') {
        if (filterStatus === 'unpaid') {
          if (inv.status === 'Paid' || inv.status === 'Cancelled') return false;
        } else if (filterStatus === 'Overdue') {
          if (!isOverdueInvoice(inv)) return false;
        } else if (filterStatus === 'Sent') {
          if (inv.status !== 'Sent') return false;
        } else {
          if (inv.status !== filterStatus) return false;
        }
      }

      if (filterClient !== 'all') {
        if (inv.clientName !== filterClient) return false;
      }

      if (filterProject !== 'all') {
        if (inv.projectName !== filterProject) return false;
      }

      // Date range filter
      if (filterDateFrom || filterDateTo) {
        const rawDate = filterDateField === 'dateCreated' ? (inv.dateCreated || inv.createdAt) : inv.dueDate;
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
        case 'dueDate':
          aVal = a.dueDate ? new Date(a.dueDate.split('T')[0]).getTime() : Infinity;
          bVal = b.dueDate ? new Date(b.dueDate.split('T')[0]).getTime() : Infinity;
          break;
        case 'dateCreated':
          aVal = a.dateCreated ? new Date(a.dateCreated.split('T')[0]).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          bVal = b.dateCreated ? new Date(b.dateCreated.split('T')[0]).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          break;
        case 'totalAmount':
          aVal = a.totalAmount || 0;
          bVal = b.totalAmount || 0;
          break;
        case 'invoiceNumber':
          aVal = (a.invoiceNumber || '').toLowerCase();
          bVal = (b.invoiceNumber || '').toLowerCase();
          break;
        case 'client':
          aVal = (a.clientName || '').toLowerCase();
          bVal = (b.clientName || '').toLowerCase();
          break;
        case 'project':
          aVal = (a.projectName || '').toLowerCase();
          bVal = (b.projectName || '').toLowerCase();
          break;
        case 'status':
          aVal = (a.status || '').toLowerCase();
          bVal = (b.status || '').toLowerCase();
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
    });
  }, [isServerPaginated, enhancedInvoices, searchQuery, filterStatus, filterClient, filterProject, filterDateFrom, filterDateTo, filterDateField, sortOption, sortDirection, t]);

  const paginatedItems = useMemo(() => {
    if (isServerPaginated) return [];
    return filteredAndSortedItems.slice(page * activeRowsPerPage, page * activeRowsPerPage + activeRowsPerPage);
  }, [isServerPaginated, filteredAndSortedItems, page, activeRowsPerPage]);

  const totalCount = isServerPaginated
    ? (paginatedData?.total ?? 0)
    : filteredAndSortedItems.length;

  const displayItems = isServerPaginated ? serverItems : paginatedItems;

  useEffect(() => {
    if (onTotalCountChange) {
      onTotalCountChange(totalCount);
    }
  }, [totalCount, onTotalCountChange]);

  const handleRefresh = () => {
    if (isServerPaginated) {
      refetchPaginatedInvoices();
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterClient !== 'all') count++;
    if (filterProject !== 'all') count++;
    if (filterDateFrom || filterDateTo) count++;
    if (sortOption !== 'dueDate' || sortDirection !== 'asc') count++;
    return count;
  }, [filterStatus, filterClient, filterProject, filterDateFrom, filterDateTo, sortOption, sortDirection]);

  const handleMarkAsPaid = async (inv: Invoice) => {
    if (onStatusChangeInvoice) {
      await onStatusChangeInvoice(inv.id, 'Paid', new Date().toISOString().slice(0, 10));
    }
  };

  const handleOpenNew = () => {
    setEditingInvoice(null);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenView = (inv: Invoice) => {
    setEditingInvoice(inv);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleSaveInvoiceFromModal = async (
    payload: Partial<Invoice>,
    providedServiceId?: string,
    initialPsId?: string
  ) => {
    if (!onSaveInvoice) {
      setIsDialogOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      const res = await onSaveInvoice(payload);
      if (res && typeof res === 'object' && 'success' in res && !res.success) {
        setErrorDialogState({ open: true, message: res.error || t('errorSavingProject') });
        return;
      }

      const savedInvoiceId = (res && typeof res === 'object' && 'id' in res) ? res.id : editingInvoice?.id;
      if (savedInvoiceId && onSaveProvidedService) {
        if (providedServiceId !== (initialPsId || '')) {
          if (providedServiceId) {
            await Promise.resolve(onSaveProvidedService({ id: providedServiceId, invoiceId: savedInvoiceId })).catch(() => {});
          }
          if (initialPsId) {
            await Promise.resolve(onSaveProvidedService({ id: initialPsId, invoiceId: null })).catch(() => {});
          }
        }
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      setErrorDialogState({ open: true, message: err?.message || t('errorSavingProject') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DashboardPanelSkeleton
        title={t('approachingInvoicesTitle')}
        icon={<CalendarTodayIcon fontSize="small" sx={{ mr: 0.5 }} />}
        isFullHeight={isFullHeight}
        hideNotch={hideNotch}
        isEmpty={displayItems.length === 0 && !isPaginatedLoading}
        emptyMessage={t('emptyInvoices')}
        paginationProps={{
          count: totalCount,
          page: page,
          rowsPerPage: activeRowsPerPage,
          rowsPerPageOptions: activeRowsPerPageOptions,
          onPageChange: (_: unknown, newPage: number) => setPage(newPage),
          onRowsPerPageChange: handleChangeRowsPerPage,
        }}
        actionButton={
          canCreate && onSaveInvoice && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenNew}
              size="small"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, py: 0.25 }}
            >
              {t('btnNewInvoice')}
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
              key: 'unpaid',
              label: t('statusUnpaid'),
              color: 'warning',
            },
          ],
          selectedKeys: filterStatus === 'unpaid' ? ['unpaid'] : [],
          onChange: (keys: string[]) => setFilterStatus(keys.includes('unpaid') ? 'unpaid' : 'all'),
        }}
        refreshProps={{
          onRefresh: handleRefresh,
          isRefreshing: isRefreshing || isPaginatedFetching,
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
                  { value: 'dueDate', label: t('colDueDate') },
                  { value: 'dateCreated', label: t('colDateCreated') },
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
                  value={statusOptions.find((o) => o.value === filterStatus) || statusOptions[0]}
                  onChange={(_, newValue) => setFilterStatus(newValue ? newValue.value : 'all')}
                  renderInput={(params) => <TextField {...params} label={t('colStatus')} size="small" />}
                />

                <Autocomplete
                  size="small"
                  fullWidth
                  disablePortal
                  options={uniqueClients}
                  value={filterClient === 'all' ? null : filterClient}
                  onChange={(_, newValue) => setFilterClient(newValue || 'all')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('colClient')}
                    />
                  )}
                />

                {uniqueProjects.length > 0 && (
                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={uniqueProjects}
                    value={filterProject === 'all' ? null : filterProject}
                    onChange={(_, newValue) => setFilterProject(newValue || 'all')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('colProject')}
                      />
                    )}
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
            defaultRowsPerPageOptions={[5, 10, 25]}
          />
        }
        listContent={
          isPaginatedLoading && displayItems.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            displayItems.map((inv) => {
            const isLate = isOverdueInvoice(inv);
            const isApproaching = isApproachingInvoice(inv);
            const isPaid = inv.status === 'Paid';
            const isCancelled = inv.status === 'Cancelled';

            const uniqueLinks: Invoice[] = [];
            if (inv.parentInvoice) {
              uniqueLinks.push(inv.parentInvoice);
            }
            if (inv.childInvoices && inv.childInvoices.length > 0) {
              inv.childInvoices.forEach((child) => {
                if (!uniqueLinks.some((existing) => existing.id === child.id)) {
                  uniqueLinks.push(child);
                }
              });
            }

            let cardBgColor = 'background.paper';
            let borderColor = 'divider';

            if (isCancelled) {
              cardBgColor = 'action.hover';
              borderColor = 'divider';
            } else if (isLate) {
              cardBgColor = 'error.lighter';
              borderColor = 'error.light';
            } else if (isApproaching) {
              cardBgColor = 'warning.lighter';
              borderColor = '#ff9800';
            }

            return (
              <Box
                key={inv.id}
                onClick={() => handleOpenView(inv)}
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
                  opacity: isCancelled ? 0.75 : 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isLate ? 'error.lighter' : isApproaching ? 'warning.lighter' : isCancelled ? 'action.selected' : 'action.hover',
                  },
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  {/* FIRST ROW: invoice number, client(text), type (chip), status (chip) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <ReceiptLongIcon sx={{ fontSize: 16, color: 'primary.main' }} />
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
                        {inv.invoiceNumber}
                      </Typography>
                    </Box>

                    {inv.clientName && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {inv.clientName}
                      </Typography>
                    )}

                    {getInvoiceTypeChip(inv.invoiceType)}

                    <Chip
                      label={getStatusLabel(inv.status)}
                      size="small"
                      color={getStatusChipColor(inv.status)}
                      sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  </Box>

                  {/* SECOND ROW: due date, total amount, chip with linked invoices */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', color: 'text.secondary', fontSize: '0.75rem' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: isLate ? 'error.main' : isApproaching ? '#ed6c02' : 'text.secondary',
                        fontWeight: isLate || isApproaching ? 700 : 400,
                      }}
                    >
                      <CalendarTodayIcon sx={{ fontSize: '0.8rem' }} />
                      {fmtDate(inv.dueDate || null)}
                    </Typography>

                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatInvoiceAmount(inv.totalAmount, inv.currency)}
                    </Typography>

                    {uniqueLinks.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        {uniqueLinks.map((linked) => {
                          const labelType = getLinkedInvoiceLabel(linked);
                          const chipColor = getLinkedInvoiceChipColor(linked.invoiceType);
                          return (
                            <Chip
                              key={linked.id}
                              icon={<LinkIcon sx={{ fontSize: '12px !important' }} />}
                              size="small"
                              variant="outlined"
                              color={chipColor}
                              label={`${labelType}: ${linked.invoiceNumber || ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (linked.invoiceNumber) {
                                  setSearchQuery(linked.invoiceNumber);
                                }
                              }}
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.85 },
                              }}
                            />
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* ACTION BUTTONS ON THE RIGHT SIDE: VIEW, PAID, EDIT, DELETE */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    ml: 1,
                    flexShrink: 0,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* VIEW */}
                  <Tooltip title={t('btnDetails')}>
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => handleOpenView(inv)}
                      sx={{ p: 0.5 }}
                    >
                      <VisibilityIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>

                  {/* PAID */}
                  {canEdit && onStatusChangeInvoice && (
                    <Tooltip title={isPaid ? t('statusPaid') : t('markAsPaid')}>
                      <span>
                        <IconButton
                          size="small"
                          color={isPaid ? 'default' : 'success'}
                          disabled={isPaid || isCancelled}
                          onClick={() => handleMarkAsPaid(inv)}
                          sx={{ p: 0.5 }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}

                  {/* EDIT */}
                  {canEdit && onSaveInvoice && (
                    <Tooltip title={t('btnEdit')}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenEdit(inv)}
                        sx={{ p: 0.5 }}
                      >
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* DELETE */}
                  {canDelete && onDeleteInvoice && (
                    <Tooltip title={t('btnDelete')}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteInvoice(inv.id)}
                        sx={{ p: 0.5 }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            );
          })
        )
      }
      />

      {/* INVOICE VIEW / EDIT MODAL */}
      <InvoiceModal
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingInvoice={editingInvoice}
        clients={clients}
        projects={projects}
        providedServices={providedServices}
        invoices={isServerPaginated ? displayItems : enhancedInvoices}
        onSave={handleSaveInvoiceFromModal}
        isSaving={isSaving}
        isViewMode={isViewMode}
        onToggleEditMode={() => setIsViewMode(false)}
      />




      {/* ERROR DIALOG */}
      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState({ open: false, message: '' })}
      />
    </>
  );
};

export default ApproachingInvoicesPanel;
