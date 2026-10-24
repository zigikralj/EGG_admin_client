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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Tooltip,
  Collapse,
} from '@mui/material';

import type { Invoice, TableViewProps } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TableOptionsSelector, type ColumnDef } from '../../components/common/ColumnSelector';
import { TableFilterSelector } from '../../components/common/TableFilterSelector';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { TableQuickFilters } from '../../components/common/TableQuickFilters';
import { ErrorDialog } from '../../components/dialogs/ErrorDialog';
import { enhanceInvoicesWithLinks } from '../../utils/invoiceUtils';
import { InvoiceRowDetail } from '../../components/invoice/InvoiceRowDetail';
import { InvoiceModal } from '../../components/invoice/InvoiceModal';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  CheckCircleIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  KeyboardArrowDownIcon,
  KeyboardArrowUpIcon,
  ReceiptLongIcon,
  LinkIcon,
  RefreshIcon,
  HistoryIcon,
} from '../../components/icons';
import { HistoryTimelineModal } from '../../components/history';
import { useTableView } from '../../hooks/useTableView';

interface Props extends TableViewProps {}

const DEFAULT_COLUMNS = ['invoiceNumber', 'invoiceType', 'linkedInvoices', 'client', 'project', 'dateCreated', 'dueDate', 'totalAmount', 'status'];

import {
  usePaginatedInvoicesQuery,
  useClientsSummaryQuery,
  useProjectsQuery,
  useProvidedServicesQuery,
  useInvoicesMutations,
  useProvidedServicesMutations,
} from '../../queries';
import { useDebounce } from '../../hooks/useDebounce';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';

const InvoicesPage: React.FC<Props> = ({
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  sortState,
  onSortChange,
}) => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('invoices', 'create');
  const canEdit = hasPermission('invoices', 'edit');
  const canDelete = hasPermission('invoices', 'delete');
  const canViewHistory = hasPermission('history', 'view');
  const hasAnyRowAction = canEdit || canDelete || canViewHistory;
  const [isOpen, setIsOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [historyModalState, setHistoryModalState] = useState<{ open: boolean; invoice: Invoice | null }>({ open: false, invoice: null });
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
    onRefresh: () => {
      refetchPaginatedInvoices();
    },
    defaultSortField: 'dateCreated',
    defaultSortDirection: 'desc',
  });

  const { data: clients = [] } = useClientsSummaryQuery();
  const { data: projects = [] } = useProjectsQuery('', { enabled: isOpen });
  const { data: providedServices = [] } = useProvidedServicesQuery({ enabled: isOpen });

  const { handleSave: handleSaveInvoice, handleDelete, handleUpdateInvoiceStatus } = useInvoicesMutations();
  const { handleSave: handleSaveProvidedService } = useProvidedServicesMutations();

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const onDeleteInvoice = (id: string) => handleDelete(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});



  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterInvoiceType, setFilterInvoiceType] = useState<string>('all');
  const [filterLinkedStatus, setFilterLinkedStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('dateCreated');

  const activeFilterCount =
    (filterStatus !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterCurrency !== 'all' ? 1 : 0) +
    (filterInvoiceType !== 'all' ? 1 : 0) +
    (filterLinkedStatus !== 'all' ? 1 : 0) +
    (filterDateFrom || filterDateTo ? 1 : 0) +
    (sortColumn !== 'dateCreated' || sortDirection !== 'desc' ? 1 : 0);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterClient('all');
    setFilterCurrency('all');
    setFilterInvoiceType('all');
    setFilterLinkedStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('dateCreated');
    resetSort();
  };



  const columnDefs: ColumnDef[] = [
    { id: 'invoiceNumber', label: t('colInvoiceNumber') },
    { id: 'invoiceType', label: t('colInvoiceType') },
    { id: 'linkedInvoices', label: t('colLinkedInvoices') },
    { id: 'client', label: t('lblClient') },
    { id: 'project', label: t('tabProjects') },
    { id: 'dateCreated', label: t('colDateCreated') },
    { id: 'dueDate', label: t('colDueDate') },
    { id: 'paymentDate', label: t('colPaymentDate') },
    { id: 'totalAmount', label: t('colTotalAmount') },
    { id: 'status', label: t('lblInvoiceStatus') },
  ];

  const sortOptions = [
    { value: 'invoiceNumber', label: t('colInvoiceNumber') },
    { value: 'invoiceType', label: t('colInvoiceType') },
    { value: 'client', label: t('lblClient') },
    { value: 'project', label: t('tabProjects') },
    { value: 'dateCreated', label: t('colDateCreated') },
    { value: 'dueDate', label: t('colDueDate') },
    { value: 'totalAmount', label: t('colTotalAmount') },
    { value: 'status', label: t('lblInvoiceStatus') },
  ];

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const {
    data: paginatedData,
    refetch: refetchPaginatedInvoices,
  } = usePaginatedInvoicesQuery({
    page,
    rowsPerPage: activeRowsPerPage,
    sortBy: sortColumn,
    sortOrder: sortDirection,
    search: debouncedSearch,
    status: filterStatus,
    clientId: filterClient,
    currency: filterCurrency,
    invoiceType: filterInvoiceType,
    linkedStatus: filterLinkedStatus,
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
    dateField: filterDateField,
  });

  const rawInvoices = paginatedData?.items || [];
  const totalInvoices = paginatedData?.total ?? rawInvoices.length;

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, filterStatus, filterClient, filterCurrency, filterInvoiceType, filterLinkedStatus, filterDateFrom, filterDateTo, filterDateField, setPage]);

  // Enhance invoices with normalized link relations
  const enhancedInvoices = useMemo(() => {
    return enhanceInvoicesWithLinks(rawInvoices);
  }, [rawInvoices]);

  const formatAmount = (amount?: number | null, currency?: string | null) => {
    const val = amount || 0;
    const curr = currency || 'RSD';
    const formatted = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} ${curr}`;
  };

  const getStatusChipColor = (status?: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Sent':
        return 'info';
      case 'Overdue':
        return 'error';
      case 'Cancelled':
        return 'default';
      case 'Draft':
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'Draft':
        return t('statusDraft');
      case 'Sent':
        return t('statusSent');
      case 'Paid':
        return t('statusPaid');
      case 'Overdue':
        return t('statusOverdue');
      case 'Cancelled':
        return t('statusCancelled');
      default:
        return status || t('statusDraft');
    }
  };

  const getInvoiceTypeChip = (type?: string | null) => {
    if (!type || type === 'Standard') {
      return (
        <Chip
          label={t('typeStandard')}
          size="small"
          variant="outlined"
          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 500, color: 'text.secondary', borderColor: 'divider' }}
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
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, px: 0.25 }}
          />
        );
      case 'Final':
        return (
          <Chip
            label={t('badgeFinal')}
            size="small"
            color="primary"
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, px: 0.25 }}
          />
        );
      case 'Partial':
        return (
          <Chip
            label={t('badgePartial')}
            size="small"
            color="info"
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, px: 0.25 }}
          />
        );
      default:
        return <Chip label={type} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
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

  const toggleRowExpanded = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Open modal for new invoice
  const handleOpenNew = () => {
    if (!canCreate) return;
    setEditingInvoice(null);
    setIsOpen(true);
  };

  // Open modal for editing invoice
  const handleOpenEdit = (inv: Invoice) => {
    if (!canEdit) return;
    setEditingInvoice(inv);
    setIsOpen(true);
  };

  // Handle Save from InvoiceModal
  const handleSaveInvoiceFromModal = async (
    payload: Partial<Invoice>,
    providedServiceId?: string,
    initialPsId?: string
  ) => {
    setIsSaving(true);
    try {
      const res = await handleSaveInvoice(payload);
      if (res && res.error) {
        setErrorDialogState({ open: true, message: res.error });
        return;
      }

      const savedInvoiceId = res?.id;
      if (savedInvoiceId) {
        if (providedServiceId) {
          if (!initialPsId || initialPsId !== providedServiceId) {
            await Promise.resolve(
              handleSaveProvidedService({ id: providedServiceId, invoiceId: savedInvoiceId })
            ).catch(() => {});
          }
        } else if (initialPsId) {
          await Promise.resolve(
            handleSaveProvidedService({ id: initialPsId, invoiceId: null })
          ).catch(() => {});
        }
      }
      setIsOpen(false);
    } catch (err: any) {
      setErrorDialogState({ open: true, message: err?.message || 'Error saving invoice' });
    } finally {
      setIsSaving(false);
    }
  };

  // Quick mark as Paid
  const handleMarkAsPaid = async (inv: Invoice) => {
      await handleUpdateInvoiceStatus(inv.id, 'Paid', new Date().toISOString().slice(0, 10));
  };

  const displayedInvoices = enhancedInvoices;

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      {/* HEADER & ACTIONS */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReceiptLongIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t('invoicesListTitle')}
          </Typography>
          <Chip label={totalInvoices} size="small" color="primary" sx={{ fontWeight: 700 }} />
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

        {canCreate && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenNew}
            sx={{ fontWeight: 600, borderRadius: 2, px: 2.5 }}
          >
            {t('btnNewInvoice')}
          </Button>
        )}
      </Box>

      {/* SEARCH, COLUMNS & FILTER BAR */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <TableSearchInput
              value={search}
              onChange={setSearch}
            />
            <TableQuickFilters
              options={[
                {
                  key: 'unpaid',
                  label: t('statusUnpaid'),
                  color: 'warning',
                },
              ]}
              selectedKeys={filterStatus === 'unpaid' ? ['unpaid'] : []}
              onChange={(keys) => setFilterStatus(keys.includes('unpaid') ? 'unpaid' : 'all')}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
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
                    { value: 'dateCreated', label: t('colDateCreated') },
                    { value: 'dueDate', label: t('colDueDate') },
                    { value: 'paymentDate', label: t('colPaymentDate') },
                  ]}
                  onDateFieldChange={setFilterDateField}
                />
              }
              filteringContent={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Status Filter */}
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('lblInvoiceStatus')}</InputLabel>
                    <Select
                      value={filterStatus}
                      label={t('lblInvoiceStatus')}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">{t('filterAllStatus') || 'All'}</MenuItem>
                      <MenuItem value="Draft">{t('statusDraft')}</MenuItem>
                      <MenuItem value="Sent">{t('statusSent')}</MenuItem>
                      <MenuItem value="Paid">{t('statusPaid')}</MenuItem>
                      <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
                      <MenuItem value="Cancelled">{t('statusCancelled')}</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Invoice Type Filter */}
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('lblInvoiceType')}</InputLabel>
                    <Select
                      value={filterInvoiceType}
                      label={t('lblInvoiceType')}
                      onChange={(e) => setFilterInvoiceType(e.target.value)}
                    >
                      <MenuItem value="all">{t('filterAllInvoiceTypes')}</MenuItem>
                      <MenuItem value="Standard">{t('typeStandard')}</MenuItem>
                      <MenuItem value="Advance">{t('typeAdvance')}</MenuItem>
                      <MenuItem value="Final">{t('typeFinal')}</MenuItem>
                      <MenuItem value="Partial">{t('typePartial')}</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Linked Status Filter */}
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('filterLinkedStatus')}</InputLabel>
                    <Select
                      value={filterLinkedStatus}
                      label={t('filterLinkedStatus')}
                      onChange={(e) => setFilterLinkedStatus(e.target.value)}
                    >
                      <MenuItem value="all">{t('filterAllLinks')}</MenuItem>
                      <MenuItem value="linked">{t('filterLinkedOnly')}</MenuItem>
                      <MenuItem value="independent">{t('filterIndependentOnly')}</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Currency Filter */}
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('lblCurrency')}</InputLabel>
                    <Select
                      value={filterCurrency}
                      label={t('lblCurrency')}
                      onChange={(e) => setFilterCurrency(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="RSD">RSD (Dinar)</MenuItem>
                      <MenuItem value="€">€ (Euro)</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Client Filter */}
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('lblClient')}</InputLabel>
                    <Select
                      value={filterClient}
                      label={t('lblClient')}
                      onChange={(e) => setFilterClient(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      {clients.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
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
      </Card>

      {/* INVOICES TABLE */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ width: 48 }} />
                {activeCols.includes('invoiceNumber') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'invoiceNumber'}
                      direction={sortColumn === 'invoiceNumber' ? sortDirection : 'asc'}
                      onClick={() => handleSort('invoiceNumber')}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('colInvoiceNumber')}
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('invoiceType') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'invoiceType'}
                      direction={sortColumn === 'invoiceType' ? sortDirection : 'asc'}
                      onClick={() => handleSort('invoiceType')}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('colInvoiceType')}
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('linkedInvoices') && (
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('colLinkedInvoices')}
                    </Typography>
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
                        {t('lblClient')}
                      </Typography>
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('tabProjects')}
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('dateCreated') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'dateCreated'}
                      direction={sortColumn === 'dateCreated' ? sortDirection : 'asc'}
                      onClick={() => handleSort('dateCreated')}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('colDateCreated')}
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('dueDate') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'dueDate'}
                      direction={sortColumn === 'dueDate' ? sortDirection : 'asc'}
                      onClick={() => handleSort('dueDate')}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('colDueDate')}
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('paymentDate') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'paymentDate'}
                      direction={sortColumn === 'paymentDate' ? sortDirection : 'asc'}
                      onClick={() => handleSort('paymentDate')}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('colPaymentDate')}
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('totalAmount') && (
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortColumn === 'totalAmount'}
                      direction={sortColumn === 'totalAmount' ? sortDirection : 'asc'}
                      onClick={() => handleSort('totalAmount')}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('colTotalAmount')}
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('status') && (
                  <TableCell align="center">
                    <TableSortLabel
                      active={sortColumn === 'status'}
                      direction={sortColumn === 'status' ? sortDirection : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('lblInvoiceStatus')}
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                )}
                {hasAnyRowAction && (
                  <TableCell align="right">
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('colAction')}
                    </Typography>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {displayedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + 1 + (hasAnyRowAction ? 1 : 0)} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      {t('emptyInvoices')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedInvoices
                  .map((inv) => {
                    const isExpanded = !!expandedRows[inv.id];
                    const itemsCount = inv.items ? inv.items.length : 0;
                    const isOverdue =
                      inv.status !== 'Paid' &&
                      inv.dueDate &&
                      new Date(inv.dueDate) < new Date(new Date().toDateString());
                    const isPaid = inv.status === 'Paid';
                    const hasLinks = Boolean(inv.parentInvoice || (inv.childInvoices && inv.childInvoices.length > 0));

                    return (
                      <React.Fragment key={inv.id}>
                        <TableRow
                          hover
                          sx={{
                            '& > *': { borderBottom: isExpanded ? 'none !important' : undefined },
                            bgcolor: isOverdue ? 'rgba(211, 47, 47, 0.04)' : undefined,
                          }}
                        >
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => toggleRowExpanded(inv.id)}
                              title={t('invoiceItemsSection')}
                            >
                              {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          </TableCell>

                          {activeCols.includes('invoiceNumber') && (
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {inv.invoiceNumber}
                              </Typography>
                              {itemsCount > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  {itemsCount} {t('colItemsCount').toLowerCase()}
                                </Typography>
                              )}
                            </TableCell>
                          )}

                          {activeCols.includes('invoiceType') && (
                            <TableCell>
                              {getInvoiceTypeChip(inv.invoiceType)}
                            </TableCell>
                          )}

                          {activeCols.includes('linkedInvoices') && (
                            <TableCell>
                              {(() => {
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

                                if (uniqueLinks.length === 0) {
                                  return (
                                    <Typography variant="caption" color="text.disabled">
                                      -
                                    </Typography>
                                  );
                                }

                                return (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {uniqueLinks.map((linked) => {
                                      const labelType = getLinkedInvoiceLabel(linked);
                                      const chipColor = getLinkedInvoiceChipColor(linked.invoiceType);
                                      return (
                                        <Chip
                                          key={linked.id}
                                          icon={<LinkIcon sx={{ fontSize: 13 }} />}
                                          size="small"
                                          variant="outlined"
                                          color={chipColor}
                                          label={`${labelType}: ${linked.invoiceNumber || ''}`}
                                          onClick={() => linked.invoiceNumber && setSearch(linked.invoiceNumber)}
                                          sx={{
                                            height: 20,
                                            fontSize: '0.675rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            '&:hover': { opacity: 0.85 },
                                          }}
                                        />
                                      );
                                    })}
                                  </Box>
                                );
                              })()}
                            </TableCell>
                          )}

                          {activeCols.includes('client') && (
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {inv.clientName || inv.client?.name || '-'}
                              </Typography>
                            </TableCell>
                          )}

                          {activeCols.includes('project') && (
                            <TableCell>
                              <Typography variant="body2">
                                {inv.projectName || inv.project?.name || '-'}
                              </Typography>
                            </TableCell>
                          )}

                          {activeCols.includes('dateCreated') && (
                            <TableCell>
                              <Typography variant="body2">{inv.dateCreated || '-'}</Typography>
                            </TableCell>
                          )}

                          {activeCols.includes('dueDate') && (
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: isOverdue ? 700 : 400,
                                  color: isOverdue ? 'error.main' : 'inherit',
                                }}
                              >
                                {inv.dueDate || '-'}
                              </Typography>
                            </TableCell>
                          )}

                          {activeCols.includes('paymentDate') && (
                            <TableCell>
                              <Typography variant="body2">{inv.paymentDate || '-'}</Typography>
                            </TableCell>
                          )}

                          {activeCols.includes('totalAmount') && (
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {formatAmount(inv.totalAmount, inv.currency)}
                              </Typography>
                            </TableCell>
                          )}

                          {activeCols.includes('status') && (
                            <TableCell align="center">
                              <Chip
                                label={getStatusLabel(inv.status)}
                                size="small"
                                color={getStatusChipColor(inv.status)}
                                sx={{ fontWeight: 600, minWidth: 80 }}
                              />
                            </TableCell>
                          )}

                          {hasAnyRowAction && (
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                {canEdit && !isPaid && (
                                  <Tooltip title={t('markAsPaid')}>
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleMarkAsPaid(inv)}
                                    >
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {canViewHistory && (
                                  <Tooltip title={t('historyModalTitle')}>
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() => setHistoryModalState({ open: true, invoice: inv })}
                                    >
                                      <HistoryIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {canEdit && (
                                  <Tooltip title={t('btnEdit')}>
                                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(inv)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {canDelete && (
                                  <Tooltip title={t('btnDelete')}>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => onDeleteInvoice(inv.id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          )}
                        </TableRow>

                        {/* EXPANDABLE ITEMS BREAKDOWN & LINKED INVOICES */}
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={activeCols.length + 1 + (hasAnyRowAction ? 1 : 0)}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <InvoiceRowDetail
                                invoice={inv}
                                hasLinks={hasLinks}
                                onSearchInvoice={(invoiceNumber) => setSearch(invoiceNumber)}
                                getStatusLabel={getStatusLabel}
                                getStatusChipColor={getStatusChipColor}
                                getInvoiceTypeChip={getInvoiceTypeChip}
                                formatAmount={formatAmount}
                              />
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={activeRowsPerPageOptions}
          component="div"
          count={totalInvoices}
          rowsPerPage={activeRowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setRowsPerPageValue(val);
            setPage(0);
          }}
        />
      </Card>

      {/* CREATE / EDIT INVOICE MODAL */}
      <InvoiceModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        editingInvoice={editingInvoice}
        clients={clients}
        projects={projects}
        providedServices={providedServices}
        invoices={rawInvoices}
        onSave={handleSaveInvoiceFromModal}
        isSaving={isSaving}
      />

      {/* ERROR DIALOG */}
      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState({ open: false, message: '' })}
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

      {historyModalState.invoice && (
        <HistoryTimelineModal
          open={historyModalState.open}
          onClose={() => setHistoryModalState({ open: false, invoice: null })}
          entityType="Invoice"
          entityId={historyModalState.invoice.id}
          entityTitle={historyModalState.invoice.invoiceNumber || 'Invoice'}
          onRestored={() => {
            handleRefresh();
          }}
        />
      )}
    </Box>
  );
};

export default InvoicesPage;
