import React, { useState, useMemo, useEffect } from 'react';
import {
  Typography,
  IconButton,
  Tooltip,
  TextField,
  Box,
  Chip,
  Paper,
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';

import type { Invoice, Client, Project, ProvidedService, SaveResult, InvoiceStatus, InvoiceCurrency, InvoiceType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { enhanceInvoicesWithLinks, parseInvoiceNotes, serializeInvoiceNotes } from '../utils/invoiceUtils';
import { TableFilterSelector } from './TableFilterSelector';
import { TableOptionsSelector } from './ColumnSelector';
import { DateRangeFilter } from './DateRangeFilter';
import { TableSearchInput } from './TableSearchInput';
import { ErrorDialog } from './ErrorDialog';
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
} from './icons';
import { DashboardPanelSkeleton } from './DashboardPanelSkeleton';

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
  invoices = [],
  clients = [],
  projects = [],
  providedServices = [],
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
}) => {
  const { t } = useLanguage();
  const { isUser, canManageInvoices } = useAuth();
  const canManage = canManageInvoices || !isUser;

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('dueDate');
  const [sortOption, setSortOption] = useState<'dueDate' | 'dateCreated' | 'totalAmount' | 'invoiceNumber' | 'client' | 'project' | 'status'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(rowsPerPageProp ?? 10);
  const [localRowsPerPageOptions, setLocalRowsPerPageOptions] = useState<number[]>(rowsPerPageOptionsProp ?? [5, 10, 25]);

  useEffect(() => {
    if (rowsPerPageProp !== undefined) {
      setLocalRowsPerPage(rowsPerPageProp);
    }
  }, [rowsPerPageProp]);

  useEffect(() => {
    if (rowsPerPageOptionsProp !== undefined) {
      setLocalRowsPerPageOptions(rowsPerPageOptionsProp);
    }
  }, [rowsPerPageOptionsProp]);

  const activeRowsPerPage = onRowsPerPageChange && rowsPerPageProp !== undefined ? rowsPerPageProp : localRowsPerPage;
  const activeRowsPerPageOptions = onRowsPerPageOptionsChange && rowsPerPageOptionsProp !== undefined ? rowsPerPageOptionsProp : localRowsPerPageOptions;

  const setRowsPerPageValue = (rpp: number) => {
    setLocalRowsPerPage(rpp);
    if (onRowsPerPageChange) onRowsPerPageChange(rpp);
  };

  const setRowsPerPageOptionsValue = (opts: number[]) => {
    setLocalRowsPerPageOptions(opts);
    if (onRowsPerPageOptionsChange) onRowsPerPageOptionsChange(opts);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

  // Modal / Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Modal form data
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceType: 'Standard' as InvoiceType,
    parentInvoiceId: '',
    dateCreated: '',
    dueDate: '',
    paymentDate: '',
    clientId: '',
    clientName: '',
    projectId: '',
    projectName: '',
    providedServiceId: '',
    status: 'Draft' as InvoiceStatus,
    currency: 'RSD' as InvoiceCurrency,
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, currency: 'RSD' as InvoiceCurrency }],
  });

  useEffect(() => {
    setPage(0);
  }, [searchQuery, filterStatus, filterClient, filterProject, filterDateFrom, filterDateTo, filterDateField, sortOption, sortDirection]);

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
    setSortOption('dueDate');
    setSortDirection('asc');
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
    return enhanceInvoicesWithLinks(invoices);
  }, [invoices]);

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
    invoices.forEach((inv) => {
      if (inv.clientName && inv.clientName.trim()) set.add(inv.clientName.trim());
    });
    return Array.from(set).sort();
  }, [invoices]);

  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.projectName && inv.projectName.trim()) set.add(inv.projectName.trim());
    });
    return Array.from(set).sort();
  }, [invoices]);

  const availableParentInvoices = useMemo(() => {
    return enhancedInvoices.filter((inv) => !editingInvoice || inv.id !== editingInvoice.id);
  }, [enhancedInvoices, editingInvoice]);

  const modalProjects = useMemo(() => {
    if (!formData.clientId) return projects;
    return projects.filter((p) => p.clientId === formData.clientId);
  }, [projects, formData.clientId]);

  const modalProvidedServices = useMemo(() => {
    if (!providedServices) return [];
    if (!formData.clientId) return providedServices;
    return providedServices.filter((ps) => ps.clientId === formData.clientId);
  }, [providedServices, formData.clientId]);

  const sortOptions = useMemo(() => [
    { value: 'dueDate', label: t('colDueDate') },
    { value: 'dateCreated', label: t('colDateCreated') },
    { value: 'totalAmount', label: t('colTotalAmount') },
    { value: 'invoiceNumber', label: t('colInvoiceNumber') },
    { value: 'client', label: t('colClient') },
    { value: 'project', label: t('colProject') },
    { value: 'status', label: t('colStatus') },
  ], [t]);

  const quickFilterOptions = useMemo(() => [
    { value: 'all', label: t('filterAll') },
    { value: 'unpaid', label: t('statusUnpaid') },
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
  }, [enhancedInvoices, searchQuery, filterStatus, filterClient, filterProject, filterDateFrom, filterDateTo, filterDateField, sortOption, sortDirection, t]);

  const paginatedItems = useMemo(() => {
    return filteredAndSortedItems.slice(page * activeRowsPerPage, page * activeRowsPerPage + activeRowsPerPage);
  }, [filteredAndSortedItems, page, activeRowsPerPage]);

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
    setFormData({
      invoiceNumber: '',
      invoiceType: 'Standard' as InvoiceType,
      parentInvoiceId: '',
      dateCreated: new Date().toISOString().slice(0, 10),
      dueDate: '',
      paymentDate: '',
      clientId: '',
      clientName: '',
      projectId: '',
      projectName: '',
      providedServiceId: '',
      status: 'Draft' as InvoiceStatus,
      currency: 'RSD' as InvoiceCurrency,
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, currency: 'RSD' as InvoiceCurrency }],
    });
    setIsDialogOpen(true);
  };

  const handleOpenView = (inv: Invoice) => {
    const { cleanNotes, invoiceType, parentInvoiceId } = parseInvoiceNotes(inv.notes);
    setEditingInvoice(inv);
    setIsViewMode(true);
    setFormData({
      invoiceNumber: inv.invoiceNumber || '',
      invoiceType: inv.invoiceType || invoiceType || 'Standard',
      parentInvoiceId: inv.parentInvoiceId || parentInvoiceId || '',
      dateCreated: inv.dateCreated ? inv.dateCreated.slice(0, 10) : (inv.createdAt ? inv.createdAt.slice(0, 10) : ''),
      dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : '',
      paymentDate: inv.paymentDate ? inv.paymentDate.slice(0, 10) : '',
      clientId: inv.clientId || '',
      clientName: inv.clientName || '',
      projectId: inv.projectId || '',
      projectName: inv.projectName || '',
      providedServiceId: providedServices?.find(ps => ps.invoiceId === inv.id)?.id || '',
      status: (inv.status as InvoiceStatus) || 'Draft',
      currency: (inv.currency as InvoiceCurrency) || 'RSD',
      notes: cleanNotes || '',
      items: inv.items && inv.items.length > 0
        ? inv.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: (item.currency as InvoiceCurrency) || inv.currency || 'RSD',
          }))
        : [{ description: '', quantity: 1, unitPrice: 0, currency: inv.currency || 'RSD' }],
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    const { cleanNotes, invoiceType, parentInvoiceId } = parseInvoiceNotes(inv.notes);
    setEditingInvoice(inv);
    setIsViewMode(false);
    setFormData({
      invoiceNumber: inv.invoiceNumber || '',
      invoiceType: inv.invoiceType || invoiceType || 'Standard',
      parentInvoiceId: inv.parentInvoiceId || parentInvoiceId || '',
      dateCreated: inv.dateCreated ? inv.dateCreated.slice(0, 10) : (inv.createdAt ? inv.createdAt.slice(0, 10) : ''),
      dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : '',
      paymentDate: inv.paymentDate ? inv.paymentDate.slice(0, 10) : '',
      clientId: inv.clientId || '',
      clientName: inv.clientName || '',
      projectId: inv.projectId || '',
      projectName: inv.projectName || '',
      providedServiceId: providedServices?.find(ps => ps.invoiceId === inv.id)?.id || '',
      status: (inv.status as InvoiceStatus) || 'Draft',
      currency: (inv.currency as InvoiceCurrency) || 'RSD',
      notes: cleanNotes || '',
      items: inv.items && inv.items.length > 0
        ? inv.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: (item.currency as InvoiceCurrency) || inv.currency || 'RSD',
          }))
        : [{ description: '', quantity: 1, unitPrice: 0, currency: inv.currency || 'RSD' }],
    });
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, currency: formData.currency }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, items: updated });
  };

  const modalTotal = useMemo(() => {
    return formData.items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0), 0);
  }, [formData.items]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceNumber.trim()) {
      setErrorDialogState({ open: true, message: t('alertInvoiceNumberRequired') });
      return;
    }
    if (!formData.dueDate) {
      setErrorDialogState({ open: true, message: t('alertDueDateRequired') });
      return;
    }
    if (!formData.clientName.trim() && !formData.clientId) {
      setErrorDialogState({ open: true, message: t('alertClientRequired') });
      return;
    }

    if (!onSaveInvoice) {
      setIsDialogOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      const serializedNotes = serializeInvoiceNotes(
        formData.notes,
        formData.invoiceType,
        formData.parentInvoiceId || null
      );

      const payload: Partial<Invoice> = {
        id: editingInvoice?.id,
        invoiceNumber: formData.invoiceNumber.trim(),
        invoiceType: formData.invoiceType,
        parentInvoiceId: formData.parentInvoiceId || null,
        dateCreated: formData.dateCreated || undefined,
        dueDate: formData.dueDate,
        paymentDate: formData.paymentDate || undefined,
        clientId: formData.clientId || undefined,
        clientName: formData.clientName.trim(),
        projectId: formData.projectId || undefined,
        projectName: formData.projectName.trim() || undefined,
        status: formData.status,
        currency: formData.currency,
        notes: serializedNotes,
        items: formData.items.map((it) => ({
          ...it,
          currency: it.currency || formData.currency,
        })),
        totalAmount: modalTotal,
      };

      const res = await onSaveInvoice(payload);
      if (res && typeof res === 'object' && 'success' in res && !res.success) {
        setErrorDialogState({ open: true, message: res.error || t('errorSavingProject') });
      } else {
        const savedInvoiceId = (res && typeof res === 'object' && 'id' in res) ? res.id : editingInvoice?.id;
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
        setIsDialogOpen(false);
      }
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
        isEmpty={filteredAndSortedItems.length === 0}
        emptyMessage={t('emptyInvoices')}
        paginationProps={{
          count: filteredAndSortedItems.length,
          page: page,
          rowsPerPage: activeRowsPerPage,
          rowsPerPageOptions: activeRowsPerPageOptions,
          onPageChange: (_, newPage) => setPage(newPage),
          onRowsPerPageChange: handleChangeRowsPerPage,
        }}
        actionButton={
          canManage && onSaveInvoice && (
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
        toolbarContent={
          <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: { xs: 'stretch', lg: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
            mb: 1.5,
            pb: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* SEARCH FIELD */}
          <TableSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
          />

          {/* QUICK STATUS CHIPS */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            {quickFilterOptions.map((qf) => {
              const isSelected = filterStatus === qf.value;
              const chipColor = qf.value === 'all' ? 'primary' : 'warning';
              return (
                <Chip
                  key={qf.value}
                  label={qf.label}
                  size="small"
                  clickable
                  color={isSelected ? chipColor : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus(qf.value)}
                  sx={{
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.75rem',
                    height: 26,
                    transition: 'all 0.15s ease',
                  }}
                />
              );
            })}
          </Box>

          {/* RIGHT CONTROLS */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: { xs: 'space-between', sm: 'flex-end' }, flexWrap: 'wrap' }}>
            <TableFilterSelector
              activeCount={activeFilterCount}
              onClear={handleClearAllFilters}
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
                      if (newValue) setSortOption(newValue.value as any);
                    }}
                    renderInput={(params) => <TextField {...params} label={t('lblSortBy')} size="small" />}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
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

            <TableOptionsSelector
              rowsPerPageOptions={activeRowsPerPageOptions}
              onRowsPerPageOptionsChange={setRowsPerPageOptionsValue}
              rowsPerPage={activeRowsPerPage}
              onRowsPerPageChange={setRowsPerPageValue}
              defaultRowsPerPageOptions={[5, 10, 25]}
            />
          </Box>
        </Box>
        }
        listContent={
          paginatedItems.map((inv) => {
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
                  {onStatusChangeInvoice && (
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
                  {canManage && onSaveInvoice && (
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
                  {canManage && onDeleteInvoice && (
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
        }
      />

      {/* VIEW / EDIT INVOICE DIALOG */}
      <Dialog
        open={isDialogOpen}
        onClose={() => !isSaving && setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {isViewMode ? (
          <>
            <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLongIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formData.invoiceNumber || t('modalEditInvoice')}
                </Typography>
                {getInvoiceTypeChip(formData.invoiceType)}
                <Chip
                  label={getStatusLabel(formData.status)}
                  size="small"
                  color={getStatusChipColor(formData.status)}
                  sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700 }}
                />
              </Box>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('lblClient')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formData.clientName || '—'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('tabProjects')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formData.projectName || '—'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('lblDateCreated')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {fmtDate(formData.dateCreated)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('lblDueDate')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: isOverdueInvoice(editingInvoice || ({} as any)) ? 'error.main' : 'text.primary' }}>
                    {fmtDate(formData.dueDate)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('lblPaymentDate')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {fmtDate(formData.paymentDate)}
                  </Typography>
                </Grid>

                {formData.parentInvoiceId && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('lblParentInvoice')}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {(() => {
                        const parent = availableParentInvoices.find((p) => p.id === formData.parentInvoiceId);
                        return (
                          <Chip
                            icon={<LinkIcon sx={{ fontSize: '14px !important' }} />}
                            size="small"
                            color="secondary"
                            label={`${getLinkedInvoiceLabel(parent)}: ${parent?.invoiceNumber || formData.parentInvoiceId}`}
                          />
                        );
                      })()}
                    </Box>
                  </Grid>
                )}

                {/* Items breakdown */}
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {t('invoiceItemsSection')}
                  </Typography>
                  <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2 }}>
                    {formData.items.map((item, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          borderBottom: idx < formData.items.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.description || '—'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.quantity} × {formatInvoiceAmount(item.unitPrice, item.currency || formData.currency)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 100, textAlign: 'right' }}>
                          {formatInvoiceAmount(item.quantity * item.unitPrice, item.currency || formData.currency)}
                        </Typography>
                      </Box>
                    ))}
                  </Paper>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: 2,
                      mt: 1.5,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t('colTotalAmount')}:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {formatInvoiceAmount(modalTotal, formData.currency)}
                    </Typography>
                  </Box>
                </Grid>

                {formData.notes && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('lblNotes')}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                      {formData.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              {canManage && onSaveInvoice && (
                <Button
                  startIcon={<EditIcon />}
                  variant="outlined"
                  onClick={() => setIsViewMode(false)}
                >
                  {t('btnEdit')}
                </Button>
              )}
              <Button variant="contained" onClick={() => setIsDialogOpen(false)}>
                {t('btnClose')}
              </Button>
            </DialogActions>
          </>
        ) : (
          <form onSubmit={handleSave}>
            <DialogTitle sx={{ fontWeight: 700 }}>
              {editingInvoice ? t('modalEditInvoice') : t('modalNewInvoice')}
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={2.5}>
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
                            {formatInvoiceAmount(item.quantity * item.unitPrice, item.currency || formData.currency)}
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
                      {formatInvoiceAmount(modalTotal, formData.currency)}
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
              <Button onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                {t('btnCancel')}
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={isSaving} sx={{ px: 3 }}>
                {isSaving ? '...' : t('btnSave')}
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
    </>
  );
};

export default ApproachingInvoicesPanel;
