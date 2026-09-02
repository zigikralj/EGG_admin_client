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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Tooltip,
  Paper,
  Divider,
  Collapse,
} from '@mui/material';

import type { Invoice, Client, Project, ProvidedService, SaveResult, InvoiceStatus, InvoiceCurrency,  InvoiceType,
  TableViewProps,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TableOptionsSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';
import { DateRangeFilter } from '../DateRangeFilter';
import { TableSearchInput } from '../TableSearchInput';
import { ErrorDialog } from '../ErrorDialog';
import { parseInvoiceNotes, serializeInvoiceNotes, enhanceInvoicesWithLinks } from '../../utils/invoiceUtils';
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
} from '../icons';
import { useTableView } from '../../hooks/useTableView';

interface Props extends TableViewProps {
  invoices: Invoice[];
  clients: Client[];
  projects: Project[];
  providedServices?: ProvidedService[];
  onSaveProvidedService?: (ps: Partial<ProvidedService>) => Promise<SaveResult | void> | void;
  onSaveInvoice: (invoice: Partial<Invoice>) => Promise<SaveResult | void> | void;
  onDeleteInvoice: (id: string) => void;
  onUpdateStatus?: (id: string, status: string, paymentDate?: string) => Promise<void> | void;
}

const DEFAULT_COLUMNS = ['invoiceNumber', 'invoiceType', 'linkedInvoices', 'client', 'project', 'dateCreated', 'dueDate', 'totalAmount', 'status'];

const InvoicesView: React.FC<Props> = ({
  invoices,
  clients,
  projects,
  providedServices,
  onSaveProvidedService,
  onSaveInvoice,
  onDeleteInvoice,
  onUpdateStatus,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  sortState,
  onSortChange,
  onRefresh,
}) => {
  const { t } = useLanguage();
  const { isUser, canManageInvoices } = useAuth();
  const canManage = canManageInvoices || !isUser;
  const [isOpen, setIsOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
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
    defaultSortField: 'dateCreated',
    defaultSortDirection: 'desc',
  });
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Modal form state
  const [formData, setFormData] = useState<{
    invoiceNumber: string;
    invoiceType: InvoiceType;
    parentInvoiceId: string;
    dateCreated: string;
    dueDate: string;
    paymentDate: string;
    clientId: string;
    clientName: string;
    projectId: string;
    projectName: string;
    providedServiceId: string;
    status: InvoiceStatus;
    currency: InvoiceCurrency;
    notes: string;
    items: { description: string; quantity: number; unitPrice: number; currency: InvoiceCurrency }[];
  }>({
    invoiceNumber: '',
    invoiceType: 'Standard',
    parentInvoiceId: '',
    dateCreated: new Date().toISOString().slice(0, 10),
    dueDate: '',
    paymentDate: '',
    clientId: '',
    clientName: '',
    projectId: '',
    projectName: '',
    providedServiceId: '',
    status: 'Draft',
    currency: 'RSD',
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, currency: 'RSD' }],
  });



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

  useEffect(() => {
    setPage(0);
  }, [search, filterStatus, filterClient, filterCurrency, filterInvoiceType, filterLinkedStatus, filterDateFrom, filterDateTo, filterDateField, setPage]);

  // Enhance invoices with normalized link relations
  const enhancedInvoices = useMemo(() => {
    return enhanceInvoicesWithLinks(invoices);
  }, [invoices]);

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
    setEditingInvoice(null);
    setFormData({
      invoiceNumber: '',
      invoiceType: 'Standard',
      parentInvoiceId: '',
      dateCreated: new Date().toISOString().slice(0, 10),
      dueDate: '',
      paymentDate: '',
      clientId: '',
      clientName: '',
      projectId: '',
      projectName: '',
      providedServiceId: '',
      status: 'Draft',
      currency: 'RSD',
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, currency: 'RSD' }],
    });
    setIsOpen(true);
  };

  // Open modal for editing invoice
  const handleOpenEdit = (inv: Invoice) => {
    const { cleanNotes, invoiceType: pType, parentInvoiceId: pParentId } = parseInvoiceNotes(inv.notes);
    const linkedPs = providedServices?.find(ps => ps.invoiceId === inv.id);
    setEditingInvoice(inv);
    setFormData({
      invoiceNumber: inv.invoiceNumber || '',
      invoiceType: (inv.invoiceType || pType || 'Standard') as InvoiceType,
      parentInvoiceId: inv.parentInvoiceId || pParentId || '',
      dateCreated: inv.dateCreated || '',
      dueDate: inv.dueDate || '',
      paymentDate: inv.paymentDate || '',
      clientId: inv.clientId || (inv.client?.id || ''),
      clientName: inv.clientName || (inv.client?.name || ''),
      projectId: inv.projectId || (inv.project?.id || ''),
      projectName: inv.projectName || (inv.project?.name || ''),
      providedServiceId: linkedPs ? linkedPs.id : '',
      status: (inv.status as InvoiceStatus) || 'Draft',
      currency: (inv.currency as InvoiceCurrency) || 'RSD',
      notes: cleanNotes || '',
      items:
        inv.items && inv.items.length > 0
          ? inv.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              currency: (item.currency as InvoiceCurrency) || (inv.currency as InvoiceCurrency) || 'RSD',
            }))
          : [{ description: '', quantity: 1, unitPrice: 0, currency: (inv.currency as InvoiceCurrency) || 'RSD' }],
    });
    setIsOpen(true);
  };

  // Add / Remove item in modal
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, currency: prev.currency }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  // Compute live modal total
  const modalTotal = useMemo(() => {
    return formData.items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  }, [formData.items]);

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceNumber.trim()) {
      setErrorDialogState({ open: true, message: t('alertInvoiceNumberRequired') });
      return;
    }
    if (!formData.dueDate || !formData.dueDate.trim()) {
      setErrorDialogState({ open: true, message: t('alertDueDateRequired') });
      return;
    }
    if (!formData.clientId && !formData.clientName) {
      setErrorDialogState({ open: true, message: t('alertClientRequired') });
      return;
    }

    setIsSaving(true);
    try {
      const combinedNotes = serializeInvoiceNotes(formData.notes, formData.invoiceType, formData.parentInvoiceId);

      const payload: Partial<Invoice> = {
        ...(editingInvoice ? { id: editingInvoice.id } : {}),
        invoiceNumber: formData.invoiceNumber.trim(),
        invoiceType: formData.invoiceType,
        parentInvoiceId: formData.parentInvoiceId || null,
        dateCreated: formData.dateCreated || null,
        dueDate: formData.dueDate || null,
        paymentDate: formData.paymentDate || null,
        clientId: formData.clientId || null,
        clientName: formData.clientName || null,
        projectId: formData.projectId || null,
        projectName: formData.projectName || null,
        status: formData.status,
        currency: formData.currency,
        notes: combinedNotes,
        items: formData.items
          .filter((it) => it.description.trim())
          .map((it) => ({
            description: it.description.trim(),
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            currency: it.currency || formData.currency || 'RSD',
          })),
      };

      const res = await onSaveInvoice(payload);
      if (res && res.error) {
        setErrorDialogState({ open: true, message: res.error });
      } else {
        const savedInvoiceId = res?.id || editingInvoice?.id;
        if (savedInvoiceId && onSaveProvidedService) {
           const initialPs = editingInvoice ? providedServices?.find(ps => ps.invoiceId === editingInvoice.id) : undefined;
           
            if (formData.providedServiceId !== (initialPs?.id || '')) {
              if (formData.providedServiceId) {
                await Promise.resolve(onSaveProvidedService({ id: formData.providedServiceId, invoiceId: savedInvoiceId })).catch(() => {});
              }
              if (initialPs) {
                await Promise.resolve(onSaveProvidedService({ id: initialPs.id, invoiceId: null })).catch(() => {});
              }
            }
        }
        setIsOpen(false);
      }
    } catch (err: any) {
      setErrorDialogState({ open: true, message: err?.message || 'Error saving invoice' });
    } finally {
      setIsSaving(false);
    }
  };

  // Quick mark as Paid
  const handleMarkAsPaid = async (inv: Invoice) => {
    if (onUpdateStatus) {
      await onUpdateStatus(inv.id, 'Paid', new Date().toISOString().slice(0, 10));
    }
  };

  // Filter & Sort Invoices
  const filteredInvoices = useMemo(() => {
    return enhancedInvoices.filter((inv) => {
      // Search
      const s = search.toLowerCase().trim();
      const numMatch = (inv.invoiceNumber || '').toLowerCase().includes(s);
      const clientMatch = (inv.clientName || inv.client?.name || '').toLowerCase().includes(s);
      const projMatch = (inv.projectName || inv.project?.name || '').toLowerCase().includes(s);
      const notesMatch = (inv.notes || '').toLowerCase().includes(s);
      const itemsMatch = (inv.items || []).some((it) => it.description.toLowerCase().includes(s));
      const statusMatch = (inv.status || '').toLowerCase().includes(s);
      const typeMatch = (inv.invoiceType || '').toLowerCase().includes(s);
      const parentMatch = Boolean(inv.parentInvoice && inv.parentInvoice.invoiceNumber?.toLowerCase().includes(s));
      const childMatch = Boolean(inv.childInvoices && inv.childInvoices.some((c) => c.invoiceNumber?.toLowerCase().includes(s)));

      const matchesSearch =
        !s ||
        numMatch ||
        clientMatch ||
        projMatch ||
        notesMatch ||
        itemsMatch ||
        statusMatch ||
        typeMatch ||
        parentMatch ||
        childMatch;

      // Status filter
      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;

      // Client filter
      const matchesClient = filterClient === 'all' || inv.clientId === filterClient || (inv.client && inv.client.id === filterClient);

      // Currency filter
      const matchesCurrency = filterCurrency === 'all' || inv.currency === filterCurrency;

      // Invoice Type filter
      const matchesType =
        filterInvoiceType === 'all' ||
        (filterInvoiceType === 'Standard' && (!inv.invoiceType || inv.invoiceType === 'Standard')) ||
        inv.invoiceType === filterInvoiceType;

      // Linked Status filter
      const isLinked = Boolean(inv.parentInvoiceId || (inv.childInvoices && inv.childInvoices.length > 0));
      const matchesLinked =
        filterLinkedStatus === 'all' ||
        (filterLinkedStatus === 'linked' && isLinked) ||
        (filterLinkedStatus === 'independent' && !isLinked);

      // Date Range filter
      let matchesDate = true;
      if (filterDateFrom || filterDateTo) {
        let rawDate: string | null | undefined = null;
        if (filterDateField === 'dueDate') {
          rawDate = inv.dueDate;
        } else if (filterDateField === 'paymentDate') {
          rawDate = inv.paymentDate;
        } else {
          rawDate = inv.dateCreated || inv.createdAt;
        }
        const dateVal = rawDate ? rawDate.slice(0, 10) : '';
        if (dateVal) {
          if (filterDateFrom && dateVal < filterDateFrom) matchesDate = false;
          if (filterDateTo && dateVal > filterDateTo) matchesDate = false;
        } else {
          matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesClient && matchesCurrency && matchesType && matchesLinked && matchesDate;
    });
  }, [enhancedInvoices, search, filterStatus, filterClient, filterCurrency, filterInvoiceType, filterLinkedStatus, filterDateFrom, filterDateTo, filterDateField]);

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      switch (sortColumn) {
        case 'invoiceNumber':
          aVal = a.invoiceNumber || '';
          bVal = b.invoiceNumber || '';
          break;
        case 'invoiceType':
          aVal = a.invoiceType || 'Standard';
          bVal = b.invoiceType || 'Standard';
          break;
        case 'client':
          aVal = a.clientName || a.client?.name || '';
          bVal = b.clientName || b.client?.name || '';
          break;
        case 'project':
          aVal = a.projectName || a.project?.name || '';
          bVal = b.projectName || b.project?.name || '';
          break;
        case 'dateCreated':
          aVal = a.dateCreated || a.createdAt || '';
          bVal = b.dateCreated || b.createdAt || '';
          break;
        case 'dueDate':
          aVal = a.dueDate || '';
          bVal = b.dueDate || '';
          break;
        case 'paymentDate':
          aVal = a.paymentDate || '';
          bVal = b.paymentDate || '';
          break;
        case 'totalAmount':
          aVal = a.totalAmount || 0;
          bVal = b.totalAmount || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          aVal = a.createdAt || '';
          bVal = b.createdAt || '';
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredInvoices, sortColumn, sortDirection]);

  // Filtered projects based on selected client in modal
  const modalProjects = useMemo(() => {
    if (!formData.clientId) return projects;
    return projects.filter((p) => p.clientId === formData.clientId);
  }, [projects, formData.clientId]);

  // Filtered provided services based on selected client
  const modalProvidedServices = useMemo(() => {
    if (!providedServices) return [];
    if (!formData.clientId) return providedServices;
    return providedServices.filter((ps) => ps.clientId === formData.clientId);
  }, [providedServices, formData.clientId]);

  // Available parent invoices for linking in modal
  const availableParentInvoices = useMemo(() => {
    return enhancedInvoices.filter((inv) => !editingInvoice || inv.id !== editingInvoice.id);
  }, [enhancedInvoices, editingInvoice]);

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      {/* HEADER & ACTIONS */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReceiptLongIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t('invoicesListTitle')}
          </Typography>
          <Chip label={filteredInvoices.length} size="small" color="primary" sx={{ fontWeight: 700 }} />
          {onRefresh && (
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
          )}
        </Box>

        {canManage && (
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
          <TableSearchInput
            value={search}
            onChange={setSearch}
          />

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
                {canManage && (
                  <TableCell align="right">
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('colAction')}
                    </Typography>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {sortedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + 2} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      {t('emptyInvoices')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedInvoices
                  .slice(page * activeRowsPerPage, page * activeRowsPerPage + activeRowsPerPage)
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

                          {canManage && (
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                {!isPaid && onUpdateStatus && (
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

                                <Tooltip title={t('btnEdit')}>
                                  <IconButton size="small" color="primary" onClick={() => handleOpenEdit(inv)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title={t('btnDelete')}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => onDeleteInvoice(inv.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          )}
                        </TableRow>

                        {/* EXPANDABLE ITEMS BREAKDOWN & LINKED INVOICES */}
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={activeCols.length + 2}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                {/* LINKED INVOICES BREAKDOWN CARD */}
                                {hasLinks && (
                                  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <LinkIcon color="primary" sx={{ fontSize: 18 }} />
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        {t('lblLinkedInvoices')}
                                      </Typography>
                                    </Box>

                                    <Grid container spacing={1.5}>
                                      {/* Parent Invoice info */}
                                      {inv.parentInvoice && (
                                        <Grid size={{ xs: 12, md: inv.childInvoices && inv.childInvoices.filter((c) => c.id !== inv.parentInvoice?.id).length > 0 ? 6 : 12 }}>
                                          <Paper variant="outlined" sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                {t('lblParentInvoice')}:
                                              </Typography>
                                              {getInvoiceTypeChip(inv.parentInvoice.invoiceType)}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                              <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 700, color: 'primary.main', cursor: 'pointer' }}
                                                onClick={() => inv.parentInvoice?.invoiceNumber && setSearch(inv.parentInvoice.invoiceNumber)}
                                              >
                                                {inv.parentInvoice.invoiceNumber}
                                              </Typography>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                  label={getStatusLabel(inv.parentInvoice.status)}
                                                  size="small"
                                                  color={getStatusChipColor(inv.parentInvoice.status)}
                                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                                />
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                  {formatAmount(inv.parentInvoice.totalAmount, inv.parentInvoice.currency)}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </Paper>
                                        </Grid>
                                      )}

                                      {/* Child Invoices info */}
                                      {inv.childInvoices && inv.childInvoices.filter((c) => !inv.parentInvoice || c.id !== inv.parentInvoice.id).length > 0 && (
                                        <Grid size={{ xs: 12, md: inv.parentInvoice ? 6 : 12 }}>
                                          <Paper variant="outlined" sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                              {t('lblLinkedInvoices')} ({inv.childInvoices.filter((c) => !inv.parentInvoice || c.id !== inv.parentInvoice.id).length})
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                              {inv.childInvoices
                                                .filter((c) => !inv.parentInvoice || c.id !== inv.parentInvoice.id)
                                                .map((child) => (
                                                  <Box key={child.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                      <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: 700, color: 'primary.main', cursor: 'pointer' }}
                                                        onClick={() => child.invoiceNumber && setSearch(child.invoiceNumber)}
                                                      >
                                                        {child.invoiceNumber}
                                                      </Typography>
                                                      {getInvoiceTypeChip(child.invoiceType)}
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                      <Chip
                                                        label={getStatusLabel(child.status)}
                                                        size="small"
                                                        color={getStatusChipColor(child.status)}
                                                        sx={{ height: 18, fontSize: '0.65rem' }}
                                                      />
                                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                        {formatAmount(child.totalAmount, child.currency)}
                                                      </Typography>
                                                    </Box>
                                                  </Box>
                                                ))}
                                            </Box>
                                          </Paper>
                                        </Grid>
                                      )}
                                    </Grid>
                                  </Box>
                                )}

                                {/* ITEMS TABLE */}
                                {itemsCount > 0 ? (
                                  <>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                      {t('invoiceItemsSection')}
                                    </Typography>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 700 }}>{t('lblItemDescription')}</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                                            {t('lblItemQuantity')}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                                            {t('lblItemUnitPrice')}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap', minWidth: 120 }}>
                                            {t('lblItemTotal')}
                                          </TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {inv.items?.map((item, idx) => (
                                          <TableRow key={item.id || idx}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell align="right">{item.quantity}</TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                              {formatAmount(item.unitPrice, item.currency || inv.currency)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                              {formatAmount(item.quantity * item.unitPrice, item.currency || inv.currency)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    {t('noItemsInInvoice')}
                                  </Typography>
                                )}

                                {inv.notes && (
                                  <Box sx={{ mt: 1.5 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                      {t('lblNotes')}:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                      {inv.notes}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
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
          count={sortedInvoices.length}
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
      <Dialog open={isOpen} onClose={() => !isSaving && setIsOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingInvoice ? t('modalEditInvoice') : t('modalNewInvoice')}
          </DialogTitle>

          <DialogContent dividers>
            <Grid container spacing={2.5}>
              {/* ID if editing (not editable) */}
              {editingInvoice && (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Unique ID"
                    value={editingInvoice.id}
                    disabled
                    helperText="Immutable unique identifier"
                  />
                </Grid>
              )}

              {/* Invoice Number */}
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label={t('lblInvoiceNumber')}
                  placeholder={t('phInvoiceNumber')}
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                />
              </Grid>

              {/* Invoice Type */}
              <Grid size={{ xs: 12, sm: 3.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblInvoiceType')}</InputLabel>
                  <Select
                    value={formData.invoiceType}
                    label={t('lblInvoiceType')}
                    onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value as InvoiceType })}
                  >
                    <MenuItem value="Standard">{t('typeStandard')}</MenuItem>
                    <MenuItem value="Advance">{t('typeAdvance')}</MenuItem>
                    <MenuItem value="Final">{t('typeFinal')}</MenuItem>
                    <MenuItem value="Partial">{t('typePartial')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Status */}
              <Grid size={{ xs: 12, sm: 3.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblInvoiceStatus')}</InputLabel>
                  <Select
                    value={formData.status}
                    label={t('lblInvoiceStatus')}
                    onChange={(e) => {
                      const newStatus = e.target.value as InvoiceStatus;
                      setFormData({
                        ...formData,
                        status: newStatus,
                        paymentDate:
                          newStatus === 'Paid' && !formData.paymentDate
                            ? new Date().toISOString().slice(0, 10)
                            : formData.paymentDate,
                      });
                    }}
                  >
                    <MenuItem value="Draft">{t('statusDraft')}</MenuItem>
                    <MenuItem value="Sent">{t('statusSent')}</MenuItem>
                    <MenuItem value="Paid">{t('statusPaid')}</MenuItem>
                    <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
                    <MenuItem value="Cancelled">{t('statusCancelled')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Linked / Parent Invoice Selection */}
              <Grid size={{ xs: 12, sm: 8 }}>
                <Autocomplete
                  options={availableParentInvoices}
                  groupBy={(inv) => {
                    const matchClient = formData.clientId && inv.clientId === formData.clientId;
                    const matchProj = formData.projectId && inv.projectId === formData.projectId;
                    if (matchProj) return `${t('tabProjects')}: ${formData.projectName || ''}`;
                    if (matchClient) return `${t('lblClient')}: ${formData.clientName || ''}`;
                    return t('other');
                  }}
                  getOptionLabel={(inv) =>
                    `${inv.invoiceNumber}${inv.invoiceType && inv.invoiceType !== 'Standard' ? ` [${inv.invoiceType}]` : ''}${inv.clientName ? ` (${inv.clientName})` : ''} [${inv.status}]`
                  }
                  value={availableParentInvoices.find((inv) => inv.id === formData.parentInvoiceId) || null}
                  onChange={(_, val) => {
                    setFormData({
                      ...formData,
                      parentInvoiceId: val ? val.id : '',
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label={t('lblParentInvoice')}
                      placeholder={t('phSelectParentInvoice')}
                    />
                  )}
                />
              </Grid>

              {/* Currency */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblCurrency')}</InputLabel>
                  <Select
                    value={formData.currency}
                    label={t('lblCurrency')}
                    onChange={(e) => {
                      const newCurr = e.target.value as InvoiceCurrency;
                      setFormData({
                        ...formData,
                        currency: newCurr,
                        items: formData.items.map((it) => ({ ...it, currency: newCurr })),
                      });
                    }}
                  >
                    <MenuItem value="RSD">RSD (Dinar)</MenuItem>
                    <MenuItem value="€">€ (Euro)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Client Selection */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option) => option.name || ''}
                  value={clients.find((c) => c.id === formData.clientId) || null}
                  onChange={(_, val) => {
                    setFormData({
                      ...formData,
                      clientId: val ? val.id : '',
                      clientName: val ? val.name : '',
                    });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} size="small" label={t('lblClient')} placeholder={t('phClient')} required />
                  )}
                />
              </Grid>

              {/* Project Selection */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={modalProjects}
                  getOptionLabel={(option) => option.name || ''}
                  value={projects.find((p) => p.id === formData.projectId) || null}
                  onChange={(_, val) => {
                    setFormData({
                      ...formData,
                      projectId: val ? val.id : '',
                      projectName: val ? val.name : '',
                      clientId: val && val.clientId ? val.clientId : formData.clientId,
                      clientName: val && val.clientName ? val.clientName : formData.clientName,
                    });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} size="small" label={t('tabProjects')} placeholder={t('phProjectName')} />
                  )}
                />
              </Grid>

              {/* Provided Service Selection */}
              {providedServices && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={modalProvidedServices}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => {
                      const serviceName = option.service?.name || option.serviceId || 'Unknown Service';
                      return `${serviceName}${option.location ? ` - ${option.location}` : ''}`;
                    }}
                    value={providedServices.find((ps) => ps.id === formData.providedServiceId) || null}
                    onChange={(_, val) => {
                      setFormData({
                        ...formData,
                        providedServiceId: val ? val.id : '',
                        clientId: val && val.clientId ? val.clientId : formData.clientId,
                      });
                    }}
                    renderInput={(params) => (
                      <TextField {...params} size="small" label={t('tabProvidedServices')} placeholder={t('tabProvidedServices')} />
                    )}
                  />
                </Grid>
              )}

              {/* Date Created */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('lblDateCreated')}
                  value={formData.dateCreated}
                  onChange={(e) => setFormData({ ...formData, dateCreated: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {/* Due Date */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('lblDueDate')}
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {/* Payment Date */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('lblPaymentDate')}
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {/* ITEMS SECTION */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t('invoiceItemsSection')}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    {t('btnAddInvoiceItem')}
                  </Button>
                </Box>

                {formData.items.map((item, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{ p: 1.5, mb: 1.5, borderRadius: 2, bgcolor: 'background.paper' }}
                  >
                    <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Grid size={{ xs: 12, sm: 4.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label={t('lblItemDescription')}
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </Grid>

                      <Grid size={{ xs: 4, sm: 1.75 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label={t('lblItemQuantity')}
                          slotProps={{ htmlInput: { min: 0.01, step: 'any' } }}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </Grid>

                      <Grid size={{ xs: 4, sm: 2.25 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label={t('lblItemUnitPrice')}
                          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </Grid>

                      <Grid size={{ xs: 3, sm: 2.75 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: 120 }}>
                          {formatAmount(item.quantity * item.unitPrice, item.currency || formData.currency)}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 1, sm: 0.75 }} sx={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {formData.items.length > 1 && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                            title={t('btnRemoveInvoiceItem')}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                ))}

                {/* Total Summary */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    mt: 1,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t('colTotalAmount')}:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {formatAmount(modalTotal, formData.currency)}
                  </Typography>
                </Box>
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label={t('lblNotes')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsOpen(false)} disabled={isSaving}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={isSaving} sx={{ px: 3 }}>
              {isSaving ? '...' : t('btnSave')}
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

export default InvoicesView;
