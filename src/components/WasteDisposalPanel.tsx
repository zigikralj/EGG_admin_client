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
  FormGroup,
  FormControlLabel,
  Checkbox,
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
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { TableFilterSelector } from './TableFilterSelector';
import { TableOptionsSelector } from './ColumnSelector';
import { DateRangeFilter } from './DateRangeFilter';
import { TableSearchInput } from './TableSearchInput';
import { ErrorDialog } from './ErrorDialog';
import { ProvidedServiceInvoiceSection } from './providedService/ProvidedServiceInvoiceSection';
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
} from './icons';
import { DashboardPanelSkeleton } from './DashboardPanelSkeleton';
import { useTableView } from '../hooks/useTableView';

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

export const isWasteDisposalService = (srv?: Service | null): boolean => {
  if (!srv) return false;
  const code = (srv.code || '').toLowerCase().trim();
  const name = (srv.name || '').toLowerCase().trim();
  return (
    code === 'waste-disposal' ||
    code === 'zbrinjavanje' ||
    code === 'zbrinjavanje-otpada' ||
    code === 'odlaganje' ||
    code === 'odlaganje-otpada' ||
    code.includes('disposal') ||
    code.includes('zbrinjavanje') ||
    code.includes('odlaganje') ||
    name === 'waste disposal' ||
    name === 'zbrinjavanje otpada' ||
    name === 'збрињавање отпада' ||
    name === 'odlaganje otpada' ||
    name === 'одлагање отпада' ||
    name.includes('disposal') ||
    name.includes('zbrinjavanje') ||
    name.includes('збрињавање') ||
    name.includes('odlaganje') ||
    name.includes('одлагање')
  );
};

export const WasteDisposalPanel: React.FC<Props> = ({
  providedServices = [],
  services = [],
  clients = [],
  projects = [],
  invoices = [],
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
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { canManageProvidedServices, isUser } = useAuth();
  const canManage = canManageProvidedServices || !isUser;

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

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingItem, setEditingItem] = useState<ProvidedService | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Form Data State
  const [formData, setFormData] = useState<{
    serviceId: string;
    clientId: string;
    projectId: string;
    invoiceId: string;
    status: string;
    scheduledDate: string;
    completionDate: string;
    location: string;
    notes: string;
    customData: Record<string, any>;
  }>({
    serviceId: '',
    clientId: '',
    projectId: '',
    invoiceId: '',
    status: 'Planned',
    scheduledDate: '',
    completionDate: '',
    location: '',
    notes: '',
    customData: {},
  });

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

  // Filter waste services from the general services list
  const wasteServices = useMemo(() => {
    return services.filter((s) => isWasteDisposalService(s));
  }, [services]);

  // Base list: only provided services corresponding to waste disposal
  const wasteProvidedServices = useMemo(() => {
    return providedServices.filter((item) => {
      const srv = item.service || services.find((s) => s.id === item.serviceId);
      return isWasteDisposalService(srv);
    });
  }, [providedServices, services]);

  // Unique clients for dropdown
  const uniqueClients = useMemo(() => {
    const map = new Map<string, string>();
    wasteProvidedServices.forEach((item) => {
      const c = item.client || clients.find((cl) => cl.id === item.clientId);
      if (c?.id && c?.name) map.set(c.id, c.name);
    });
    clients.forEach((c) => {
      if (c.id && c.name && !map.has(c.id)) map.set(c.id, c.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [wasteProvidedServices, clients]);

  // Unique projects for dropdown
  const uniqueProjects = useMemo(() => {
    const map = new Map<string, string>();
    wasteProvidedServices.forEach((item) => {
      const p = item.project || projects.find((pr) => pr.id === item.projectId);
      if (p?.id && p?.name) map.set(p.id, p.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [wasteProvidedServices, projects]);

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
          match = Object.values(item.customData).some((val) =>
            val !== null && val !== undefined && String(val).toLowerCase().includes(q)
          );
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

  // Dialog handlers
  const handleOpenNew = () => {
    setEditingItem(null);
    setIsViewMode(false);
    // default to first waste service if available
    const defaultServiceId = wasteServices.length > 0 ? wasteServices[0].id : (services[0]?.id || '');
    setFormData({
      serviceId: defaultServiceId,
      clientId: '',
      projectId: '',
      invoiceId: '',
      status: 'Planned',
      scheduledDate: new Date().toISOString().slice(0, 10),
      completionDate: '',
      location: '',
      notes: '',
      customData: {},
    });
    setIsDialogOpen(true);
  };

  const handleOpenView = (item: ProvidedService) => {
    setEditingItem(item);
    setIsViewMode(true);
    setFormData({
      serviceId: item.serviceId || '',
      clientId: item.clientId || '',
      projectId: item.projectId || '',
      invoiceId: item.invoiceId || '',
      status: item.status || 'Planned',
      scheduledDate: item.scheduledDate ? item.scheduledDate.slice(0, 10) : '',
      completionDate: item.completionDate ? item.completionDate.slice(0, 10) : '',
      location: item.location || '',
      notes: item.notes || '',
      customData: item.customData ? { ...item.customData } : {},
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: ProvidedService) => {
    setEditingItem(item);
    setIsViewMode(false);
    setFormData({
      serviceId: item.serviceId || '',
      clientId: item.clientId || '',
      projectId: item.projectId || '',
      invoiceId: item.invoiceId || '',
      status: item.status || 'Planned',
      scheduledDate: item.scheduledDate ? item.scheduledDate.slice(0, 10) : '',
      completionDate: item.completionDate ? item.completionDate.slice(0, 10) : '',
      location: item.location || '',
      notes: item.notes || '',
      customData: item.customData ? { ...item.customData } : {},
    });
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

  const handleSave = async () => {
    if (!formData.serviceId) {
      setErrorDialogState({ open: true, message: t('alertServiceRequired') });
      return;
    }
    if (!formData.clientId) {
      setErrorDialogState({ open: true, message: t('alertClientRequired') });
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<ProvidedService> = {
        ...(editingItem?.id ? { id: editingItem.id } : {}),
        serviceId: formData.serviceId,
        clientId: formData.clientId,
        projectId: formData.projectId || null,
        invoiceId: formData.invoiceId || null,
        status: formData.status,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : null,
        completionDate: formData.completionDate ? new Date(formData.completionDate).toISOString() : null,
        location: formData.location || null,
        notes: formData.notes || null,
        customData: Object.keys(formData.customData).length > 0 ? formData.customData : null,
      };

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

  // Get current active custom model for the selected service
  const selectedService = useMemo(() => {
    return services.find((s) => s.id === formData.serviceId);
  }, [services, formData.serviceId]);

  const activeCustomFields: CustomFieldDefinition[] = useMemo(() => {
    if (selectedService?.customDataModel && Array.isArray(selectedService.customDataModel)) {
      return selectedService.customDataModel;
    }
    // Standard waste fields fallback
    return [
      { id: 'vrsta_otpada', name: 'Vrsta otpada', type: 'text' },
      { id: 'kolicina', name: 'Količina (kg)', type: 'number', unit: 'kg' },
      { id: 'indeksni_broj', name: 'Indeksni broj otpada', type: 'text' },
      { id: 'kretanje_otpada_br', name: 'Dokument o kretanju otpada br.', type: 'text' },
    ];
  }, [selectedService]);

  // Extract useful waste badges from customData for an item
  const renderWasteBadges = (item: ProvidedService) => {
    if (!item.customData || typeof item.customData !== 'object') return null;

    const entries = Object.entries(item.customData).filter(
      ([_, v]) => v !== null && v !== undefined && String(v).trim() !== ''
    );

    if (entries.length === 0) return null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 0.25 }}>
        {entries.slice(0, 3).map(([key, val]) => {
          let cleanKey = key.replace(/_/g, ' ');
          if (cleanKey.toLowerCase().includes('kolicin')) cleanKey = 'Količina';
          else if (cleanKey.toLowerCase().includes('vrst')) cleanKey = 'Vrsta';
          else if (cleanKey.toLowerCase().includes('indeks')) cleanKey = 'Indeks';

          return (
            <Chip
              key={key}
              size="small"
              variant="outlined"
              label={`${cleanKey}: ${val}`}
              sx={{
                height: 20,
                fontSize: '0.68rem',
                bgcolor: 'action.hover',
                borderColor: 'divider',
                color: 'text.secondary',
              }}
            />
          );
        })}
        {entries.length > 3 && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
            +{entries.length - 3}
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
        isEmpty={filteredAndSortedItems.length === 0}
        emptyMessage={t('emptyWasteDisposal')}
        paginationProps={{
          count: filteredAndSortedItems.length,
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
        toolbarContent={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              {/* SEARCH FIELD */}
              <TableSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
              />

              {/* QUICK FILTERS */}
              <FormGroup row sx={{ gap: 1, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={filterStatus === 'Planned'}
                      onChange={(e) => setFilterStatus(e.target.checked ? 'Planned' : 'all')}
                      color="warning"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('statusPlanned')}
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={filterStatus === 'In Progress'}
                      onChange={(e) => setFilterStatus(e.target.checked ? 'In Progress' : 'all')}
                      color="info"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('statusInProgress')}
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={filterStatus === 'Completed'}
                      onChange={(e) => setFilterStatus(e.target.checked ? 'Completed' : 'all')}
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('statusCompleted')}
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={quickFilterMissingInvoice}
                      onChange={(e) => setQuickFilterMissingInvoice(e.target.checked)}
                      color="warning"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('quickFilterMissingInvoice')}
                    </Typography>
                  }
                />
              </FormGroup>

              {/* POPOVER FILTERS & TABLE OPTIONS */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

                <TableOptionsSelector
                  rowsPerPageOptions={activeRowsPerPageOptions}
                  onRowsPerPageOptionsChange={setRowsPerPageOptionsValue}
                  rowsPerPage={activeRowsPerPage}
                  onRowsPerPageChange={setRowsPerPageValue}
                  defaultRowsPerPageOptions={[5, 10, 20]}
                />
              </Box>
            </Box>
          </Box>
        }
        listContent={paginatedItems.map((item) => {
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
                {!isCompleted && canManage && (
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

                {canManage && (
                  <>
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

                    <Tooltip title={t('btnDelete')}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => handleDelete(item.id, e)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>
          );
        })}
      />

      {/* CREATE / EDIT / VIEW DIALOG */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isViewMode
            ? t('providedServicesSummary')
            : editingItem
            ? t('modalEditProvidedService')
            : t('modalNewProvidedService')}
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* SERVICE SELECTOR */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small" disabled={isViewMode}>
                <InputLabel>{t('colService')}</InputLabel>
                <Select
                  value={formData.serviceId}
                  label={t('colService')}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serviceId: e.target.value }))}
                >
                  {wasteServices.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {getServiceLabel(s.code, services) || s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* CLIENT SELECTOR */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                size="small"
                disabled={isViewMode}
                options={clients}
                getOptionLabel={(option) => option.name}
                value={clients.find((c) => c.id === formData.clientId) || null}
                onChange={(_, newValue) =>
                  setFormData((prev) => ({
                    ...prev,
                    clientId: newValue ? newValue.id : '',
                    projectId: '', // reset project if client changes
                  }))
                }
                renderInput={(params) => <TextField {...params} label={t('colClient')} required />}
              />
            </Grid>

            {/* PROJECT SELECTOR (OPTIONAL) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                size="small"
                disabled={isViewMode}
                options={
                  formData.clientId
                    ? projects.filter((p) => p.clientId === formData.clientId || p.clientName === clients.find((c) => c.id === formData.clientId)?.name)
                    : projects
                }
                getOptionLabel={(option) => option.name}
                value={projects.find((p) => p.id === formData.projectId) || null}
                onChange={(_, newValue) =>
                  setFormData((prev) => ({
                    ...prev,
                    projectId: newValue ? newValue.id : '',
                  }))
                }
                renderInput={(params) => <TextField {...params} label={`${t('colProject')} ${t('lblNoneOptional')}`} />}
              />
            </Grid>

            {/* STATUS SELECTOR */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small" disabled={isViewMode}>
                <InputLabel>{t('colStatus')}</InputLabel>
                <Select
                  value={formData.status}
                  label={t('colStatus')}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="Planned">{t('statusPlanned')}</MenuItem>
                  <MenuItem value="In Progress">{t('statusInProgress')}</MenuItem>
                  <MenuItem value="Completed">{t('statusCompleted')}</MenuItem>
                  <MenuItem value="Cancelled">{t('statusCancelled')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* SCHEDULED DATE */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('colScheduledDate')}
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.scheduledDate}
                disabled={isViewMode}
                onChange={(e) => setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))}
              />
            </Grid>

            {/* COMPLETION DATE */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('colCompletionDate')}
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.completionDate}
                disabled={isViewMode}
                onChange={(e) => setFormData((prev) => ({ ...prev, completionDate: e.target.value }))}
              />
            </Grid>

            {/* LOCATION */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label={t('colLocation')}
                value={formData.location}
                disabled={isViewMode}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              />
            </Grid>

            {/* DYNAMIC CUSTOM FIELDS (Vrsta otpada, Količina, Indeksni broj, etc.) */}
            {activeCustomFields.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    {t('colCustomData')} ({t('groupWaste')})
                  </Typography>
                  <Grid container spacing={2}>
                    {activeCustomFields.map((field) => {
                      const val = formData.customData[field.id] ?? formData.customData[field.name] ?? '';
                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={field.id}>
                          {field.type === 'list' && field.options && field.options.length > 0 ? (
                            <FormControl fullWidth size="small" disabled={isViewMode}>
                              <InputLabel>{field.name}</InputLabel>
                              <Select
                                value={val}
                                label={field.name}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    customData: { ...prev.customData, [field.id]: e.target.value },
                                  }))
                                }
                              >
                                {field.options.map((opt) => (
                                  <MenuItem key={opt} value={opt}>
                                    {opt}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : field.type === 'number' ? (
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label={field.unit ? `${field.name} (${field.unit})` : field.name}
                              value={val}
                              disabled={isViewMode}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  customData: {
                                    ...prev.customData,
                                    [field.id]: e.target.value === '' ? '' : Number(e.target.value),
                                  },
                                }))
                              }
                            />
                          ) : (
                            <TextField
                              fullWidth
                              size="small"
                              label={field.name}
                              value={val}
                              disabled={isViewMode}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  customData: { ...prev.customData, [field.id]: e.target.value },
                                }))
                              }
                            />
                          )}
                        </Grid>
                      );
                    })}
                  </Grid>
                </Paper>
              </Grid>
            )}

            {/* INVOICE LINKING SECTION */}
            <Grid size={{ xs: 12 }}>
              <ProvidedServiceInvoiceSection
                clientId={formData.clientId}
                clientName={clients.find((c) => c.id === formData.clientId)?.name}
                projectId={formData.projectId}
                projectName={projects.find((p) => p.id === formData.projectId)?.name}
                selectedInvoiceId={formData.invoiceId}
                onSelectInvoiceId={(invId) => setFormData((prev) => ({ ...prev, invoiceId: invId }))}
                invoices={invoices}
                onSaveInvoice={onSaveInvoice}
                onDeleteInvoice={onDeleteInvoice}
                onStatusChangeInvoice={onStatusChangeInvoice}
                setErrorDialogState={setErrorDialogState}
                disabled={isViewMode}
              />
            </Grid>

            {/* NOTES */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label={t('lblNotes')}
                value={formData.notes}
                disabled={isViewMode}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {isViewMode ? (
            <>
              {canManage && (
                <Button
                  variant="outlined"
                  onClick={() => setIsViewMode(false)}
                  startIcon={<EditIcon />}
                >
                  {t('btnEdit')}
                </Button>
              )}
              <Button onClick={() => setIsDialogOpen(false)}>{t('btnClose')}</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                {t('btnCancel')}
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving}
              >
                {t('btnSave')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState({ open: false, message: '' })}
      />
    </>
  );
};

export const WasteManagementPanel = WasteDisposalPanel;
