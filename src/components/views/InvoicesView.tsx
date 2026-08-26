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
  InputAdornment,
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
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import type { Invoice, Client, Project, SaveResult, InvoiceStatus, InvoiceCurrency } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ColumnSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';
import { ErrorDialog } from '../ErrorDialog';

interface Props {
  invoices: Invoice[];
  clients: Client[];
  projects: Project[];
  onSaveInvoice: (invoice: Partial<Invoice>) => Promise<SaveResult | void> | void;
  onDeleteInvoice: (id: string) => void;
  onUpdateStatus?: (id: string, status: string, paymentDate?: string) => Promise<void> | void;
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  sortState?: { field: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
}

const DEFAULT_COLUMNS = ['invoiceNumber', 'client', 'project', 'dateCreated', 'dueDate', 'totalAmount', 'status'];

export const InvoicesView: React.FC<Props> = ({
  invoices,
  clients,
  projects,
  onSaveInvoice,
  onDeleteInvoice,
  onUpdateStatus,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  sortState,
  onSortChange,
}) => {
  const { t } = useLanguage();
  const { isUser, canManageInvoices } = useAuth();
  const canManage = canManageInvoices || !isUser;
  const [isOpen, setIsOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [localColumns, setLocalColumns] = useState<string[]>(visibleColumns);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Modal form state
  const [formData, setFormData] = useState<{
    invoiceNumber: string;
    dateCreated: string;
    dueDate: string;
    paymentDate: string;
    clientId: string;
    clientName: string;
    projectId: string;
    projectName: string;
    status: InvoiceStatus;
    currency: InvoiceCurrency;
    notes: string;
    items: { description: string; quantity: number; unitPrice: number; currency: InvoiceCurrency }[];
  }>({
    invoiceNumber: '',
    dateCreated: new Date().toISOString().slice(0, 10),
    dueDate: '',
    paymentDate: '',
    clientId: '',
    clientName: '',
    projectId: '',
    projectName: '',
    status: 'Draft',
    currency: 'RSD',
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, currency: 'RSD' }],
  });

  const [sortColumn, setSortColumn] = useState<string>(sortState?.field || 'dateCreated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(sortState?.direction || 'desc');

  useEffect(() => {
    if (sortState) {
      setSortColumn(sortState.field || 'dateCreated');
      setSortDirection(sortState.direction || 'desc');
    }
  }, [sortState]);

  const handleSort = (colId: string) => {
    let newDir: 'asc' | 'desc' = 'asc';
    if (sortColumn === colId) {
      newDir = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortColumn(colId);
    setSortDirection(newDir);
    if (onSortChange) {
      onSortChange({ field: colId, direction: newDir });
    }
  };

  const handleSortColumnChange = (colId: string) => {
    setSortColumn(colId);
    if (onSortChange) {
      onSortChange({ field: colId, direction: sortDirection });
    }
  };

  const handleToggleSortDirection = () => {
    const newDir = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDir);
    if (onSortChange) {
      onSortChange({ field: sortColumn, direction: newDir });
    }
  };

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  const activeFilterCount =
    (filterStatus !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterCurrency !== 'all' ? 1 : 0) +
    (sortColumn !== 'dateCreated' || sortDirection !== 'desc' ? 1 : 0);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterClient('all');
    setFilterCurrency('all');
    setSortColumn('dateCreated');
    setSortDirection('desc');
    if (onSortChange) {
      onSortChange({ field: 'dateCreated', direction: 'desc' });
    }
  };

  const activeCols = onVisibleColumnsChange ? visibleColumns : localColumns;
  const setCols = (cols: string[]) => {
    setLocalColumns(cols);
    if (onVisibleColumnsChange) onVisibleColumnsChange(cols);
  };

  const columnDefs: ColumnDef[] = [
    { id: 'invoiceNumber', label: t('colInvoiceNumber') },
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
    { value: 'client', label: t('lblClient') },
    { value: 'project', label: t('tabProjects') },
    { value: 'dateCreated', label: t('colDateCreated') },
    { value: 'dueDate', label: t('colDueDate') },
    { value: 'totalAmount', label: t('colTotalAmount') },
    { value: 'status', label: t('lblInvoiceStatus') },
  ];

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

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

  const toggleRowExpanded = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Open modal for new invoice
  const handleOpenNew = () => {
    setEditingInvoice(null);
    setFormData({
      invoiceNumber: '',
      dateCreated: new Date().toISOString().slice(0, 10),
      dueDate: '',
      paymentDate: '',
      clientId: '',
      clientName: '',
      projectId: '',
      projectName: '',
      status: 'Draft',
      currency: 'RSD',
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, currency: 'RSD' }],
    });
    setIsOpen(true);
  };

  // Open modal for editing invoice
  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setFormData({
      invoiceNumber: inv.invoiceNumber || '',
      dateCreated: inv.dateCreated || '',
      dueDate: inv.dueDate || '',
      paymentDate: inv.paymentDate || '',
      clientId: inv.clientId || (inv.client?.id || ''),
      clientName: inv.clientName || (inv.client?.name || ''),
      projectId: inv.projectId || (inv.project?.id || ''),
      projectName: inv.projectName || (inv.project?.name || ''),
      status: (inv.status as InvoiceStatus) || 'Draft',
      currency: (inv.currency as InvoiceCurrency) || 'RSD',
      notes: inv.notes || '',
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
      const payload: Partial<Invoice> = {
        ...(editingInvoice ? { id: editingInvoice.id } : {}),
        invoiceNumber: formData.invoiceNumber.trim(),
        dateCreated: formData.dateCreated || null,
        dueDate: formData.dueDate || null,
        paymentDate: formData.paymentDate || null,
        clientId: formData.clientId || null,
        clientName: formData.clientName || null,
        projectId: formData.projectId || null,
        projectName: formData.projectName || null,
        status: formData.status,
        currency: formData.currency,
        notes: formData.notes || null,
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
    return invoices.filter((inv) => {
      // Search
      const s = search.toLowerCase();
      const numMatch = (inv.invoiceNumber || '').toLowerCase().includes(s);
      const clientMatch = (inv.clientName || inv.client?.name || '').toLowerCase().includes(s);
      const projMatch = (inv.projectName || inv.project?.name || '').toLowerCase().includes(s);
      const notesMatch = (inv.notes || '').toLowerCase().includes(s);
      const itemsMatch = (inv.items || []).some((it) => it.description.toLowerCase().includes(s));
      const statusMatch = (inv.status || '').toLowerCase().includes(s);

      const matchesSearch = !s || numMatch || clientMatch || projMatch || notesMatch || itemsMatch || statusMatch;

      // Status filter
      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;

      // Client filter
      const matchesClient = filterClient === 'all' || inv.clientId === filterClient || (inv.client && inv.client.id === filterClient);

      // Currency filter
      const matchesCurrency = filterCurrency === 'all' || inv.currency === filterCurrency;

      return matchesSearch && matchesStatus && matchesClient && matchesCurrency;
    });
  }, [invoices, search, filterStatus, filterClient, filterCurrency]);

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      switch (sortColumn) {
        case 'invoiceNumber':
          aVal = a.invoiceNumber || '';
          bVal = b.invoiceNumber || '';
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
          <TextField
            size="small"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: { xs: '100%', sm: 260 } }}
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
              filteringContent={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('lblInvoiceStatus')}</InputLabel>
                    <Select
                      value={filterStatus}
                      label={t('lblInvoiceStatus')}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="Draft">{t('statusDraft')}</MenuItem>
                      <MenuItem value="Sent">{t('statusSent')}</MenuItem>
                      <MenuItem value="Paid">{t('statusPaid')}</MenuItem>
                      <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
                      <MenuItem value="Cancelled">{t('statusCancelled')}</MenuItem>
                    </Select>
                  </FormControl>

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

            <ColumnSelector columns={columnDefs} visibleColumns={activeCols} onChange={setCols} />
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
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((inv) => {
                    const isExpanded = !!expandedRows[inv.id];
                    const itemsCount = inv.items ? inv.items.length : 0;
                    const isOverdue =
                      inv.status !== 'Paid' &&
                      inv.dueDate &&
                      new Date(inv.dueDate) < new Date(new Date().toDateString());

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
                            {itemsCount > 0 && (
                              <IconButton
                                size="small"
                                onClick={() => toggleRowExpanded(inv.id)}
                                title={t('invoiceItemsSection')}
                              >
                                {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                              </IconButton>
                            )}
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
                                {inv.status !== 'Paid' && onUpdateStatus && (
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

                        {/* EXPANDABLE ITEMS BREAKDOWN */}
                        {itemsCount > 0 && (
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={activeCols.length + 2}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
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
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                                          {t('lblItemTotal')}
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {inv.items?.map((item, idx) => (
                                        <TableRow key={item.id || idx}>
                                          <TableCell>{item.description}</TableCell>
                                          <TableCell align="right">{item.quantity}</TableCell>
                                          <TableCell align="right">
                                            {formatAmount(item.unitPrice, item.currency || inv.currency)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                                            {formatAmount(item.quantity * item.unitPrice, item.currency || inv.currency)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
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
                        )}
                      </React.Fragment>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={sortedInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
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
              <Grid size={{ xs: 12, sm: 6 }}>
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

              {/* Status */}
              <Grid size={{ xs: 12, sm: 3 }}>
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

              {/* Currency */}
              <Grid size={{ xs: 12, sm: 3 }}>
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
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label={t('lblItemDescription')}
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 2 }}>
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

                      <Grid size={{ xs: 6, sm: 2.5 }}>
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

                      <Grid size={{ xs: 10, sm: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'right' }}>
                          {formatAmount(item.quantity * item.unitPrice, item.currency || formData.currency)}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 2, sm: 1 }} sx={{ textAlign: 'right' }}>
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
