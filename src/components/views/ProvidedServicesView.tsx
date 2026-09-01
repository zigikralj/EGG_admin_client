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
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Tooltip,
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
  ProvidedServicesSubTab,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TableOptionsSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';
import { DateRangeFilter } from '../DateRangeFilter';
import { TableSearchInput } from '../TableSearchInput';
import { ErrorDialog } from '../ErrorDialog';
import { CustomDataModelModal } from '../CustomDataModelModal';
import { ProvidedServicesStatistics } from '../ProvidedServicesStatistics';
import { ProvidedServiceInvoiceSection } from '../providedService/ProvidedServiceInvoiceSection';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  LockIcon,
  SettingsIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  RefreshIcon,
} from '../icons';

const normalizeKey = (str: string) =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

const isKeyMatch = (key: string, field: CustomFieldDefinition) => {
  if (key === field.id) return true;
  const nKey = normalizeKey(key);
  const nFieldId = normalizeKey(field.id);
  const nFieldName = normalizeKey(field.name);
  if (nKey === nFieldId || nKey === nFieldName) return true;
  if (nKey.includes('kolicin') && (nFieldName.includes('kolicin') || nFieldId.includes('kolicin'))) return true;
  if (nKey.includes('vrst') && (nFieldName.includes('vrst') || nFieldId.includes('vrst'))) return true;
  if (nKey.includes('datum') && (nFieldName.includes('datum') || nFieldId.includes('datum'))) return true;
  return false;
};

interface Props {
  subTab?: ProvidedServicesSubTab;
  providedServices: ProvidedService[];
  services: Service[];
  clients: Client[];
  projects?: Project[];
  invoices?: Invoice[];
  categories?: Category[];
  onSaveProvidedService: (providedService: Partial<ProvidedService>) => Promise<SaveResult | void> | void;
  onDeleteProvidedService: (id: string) => void;
  onSaveService?: (service: Partial<Service>) => Promise<SaveResult | void> | void;
  onSaveInvoice?: (invoice: Partial<Invoice>) => Promise<SaveResult | void> | void;
  onDeleteInvoice?: (id: string) => void;
  onStatusChangeInvoice?: (id: string, status: string, paymentDate?: string) => void;
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  rowsPerPageOptions?: number[];
  onRowsPerPageOptionsChange?: (options: number[]) => void;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  sortState?: { field: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  quickFilter?: string;
  onQuickFilterChange?: (val: string) => void;
  onRefresh?: () => Promise<void> | void;
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

const ProvidedServicesView: React.FC<Props> = ({
  subTab = 'summary',
  providedServices,
  services,
  clients,
  projects = [],
  invoices = [],
  categories = [],
  onSaveProvidedService,
  onDeleteProvidedService,
  onSaveService,
  onSaveInvoice,
  onDeleteInvoice,
  onStatusChangeInvoice,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  sortState,
  onSortChange,
  quickFilter: quickFilterProp,
  onQuickFilterChange,
  onRefresh,
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { canManageProvidedServices } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProvidedService | null>(null);
  const [localColumns, setLocalColumns] = useState<string[]>(visibleColumns);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(rowsPerPageProp ?? 15);
  const [localRowsPerPageOptions, setLocalRowsPerPageOptions] = useState<number[]>(rowsPerPageOptionsProp ?? [15, 25, 50]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

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
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Custom data model state
  const [isCustomModelModalOpen, setIsCustomModelModalOpen] = useState(false);

  const getCustomModelForService = (serviceId: string): CustomFieldDefinition[] => {
    if (!serviceId) return [];
    const matchedService = services.find((s) => s.id === serviceId);
    if (matchedService?.customDataModel && Array.isArray(matchedService.customDataModel)) {
      return matchedService.customDataModel;
    }
    return [];
  };

  const handleSaveCustomModel = async (serviceId: string, fields: CustomFieldDefinition[]) => {
    if (onSaveService) {
      await onSaveService({ id: serviceId, customDataModel: fields });
    }
  };

  const [sortColumn, setSortColumn] = useState<string>(sortState?.field || 'scheduledDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(sortState?.direction || 'desc');

  useEffect(() => {
    if (sortState) {
      setSortColumn(sortState.field || 'scheduledDate');
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

  // Quick Filter: 'all' | 'waste-management'
  const [quickFilter, setQuickFilter] = useState<string>(quickFilterProp || 'all');

  useEffect(() => {
    if (quickFilterProp !== undefined) {
      setQuickFilter(quickFilterProp);
    }
  }, [quickFilterProp]);

  const handleQuickFilterChange = (val: string) => {
    setQuickFilter(val);
    onQuickFilterChange?.(val);
  };

  // Filter states
  const [filterService, setFilterService] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterInvoice, setFilterInvoice] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('scheduledDate');

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
    onQuickFilterChange?.('all');
    setFilterService('all');
    setFilterClient('all');
    setFilterStatus('all');
    setFilterProject('all');
    setFilterInvoice('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('scheduledDate');
    setSortColumn('scheduledDate');
    setSortDirection('desc');
    if (onSortChange) {
      onSortChange({ field: 'scheduledDate', direction: 'desc' });
    }
  };

  const activeCols = onVisibleColumnsChange ? visibleColumns : localColumns;
  const setCols = (cols: string[]) => {
    setLocalColumns(cols);
    if (onVisibleColumnsChange) onVisibleColumnsChange(cols);
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

  // Dialog Form States
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [status, setStatus] = useState<string>('Planned');
  const [location, setLocation] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const currentCustomFields = useMemo(() => {
    return getCustomModelForService(selectedServiceId);
  }, [selectedServiceId, services]);

  const openNew = () => {
    if (!canManageProvidedServices) return;
    setEditingItem(null);
    const initialServiceId = services[0]?.id || '';
    setSelectedServiceId(initialServiceId);
    setSelectedClientId(clients[0]?.id || '');
    setSelectedProjectId('');
    setSelectedInvoiceId('');
    setStatus('Planned');
    setLocation('');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setCompletionDate('');
    setNotes('');
    setCustomData({});
    setIsOpen(true);
  };

  const openEdit = (item: ProvidedService) => {
    if (!canManageProvidedServices) return;
    setEditingItem(item);
    setSelectedServiceId(item.serviceId);
    setSelectedClientId(item.clientId);
    setSelectedProjectId(item.projectId || '');
    setSelectedInvoiceId(item.invoiceId || '');
    setStatus(item.status || 'Planned');
    setLocation(item.location || '');
    setScheduledDate(item.scheduledDate ? item.scheduledDate.split('T')[0] : '');
    setCompletionDate(item.completionDate ? item.completionDate.split('T')[0] : '');
    setNotes(item.notes || '');

    const rawCustomData: Record<string, any> = item.customData ? JSON.parse(JSON.stringify(item.customData)) : {};
    const serviceFields = getCustomModelForService(item.serviceId);
    const initialCustomData: Record<string, any> = {};

    if (serviceFields.length > 0) {
      serviceFields.forEach((field) => {
        let val = rawCustomData[field.id];
        if (val === undefined || val === null || val === '') {
          for (const [k, v] of Object.entries(rawCustomData)) {
            if (v !== undefined && v !== null && v !== '' && isKeyMatch(k, field)) {
              val = v;
              break;
            }
          }
        }
        if (val !== undefined && val !== null && val !== '') {
          initialCustomData[field.id] = val;
        }
      });
    } else {
      for (const [k, v] of Object.entries(rawCustomData)) {
        if (!k.startsWith('field_')) {
          initialCustomData[k] = v;
        }
      }
    }

    setCustomData(initialCustomData);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageProvidedServices) return;
    if (!selectedServiceId.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertServiceRequired'),
      });
      return;
    }
    if (!selectedClientId.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertClientRequired'),
      });
      return;
    }

    let cleanCustomData: Record<string, any> | null = null;
    if (customData && Object.keys(customData).length > 0) {
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(customData)) {
        if (v !== undefined && v !== null && v !== '') {
          if (currentCustomFields.length > 0) {
            if (currentCustomFields.some((f) => f.id === k)) {
              cleaned[k] = v;
            }
          } else if (!k.startsWith('field_')) {
            cleaned[k] = v;
          }
        }
      }
      if (Object.keys(cleaned).length > 0) {
        cleanCustomData = cleaned;
      }
    }

    setIsSaving(true);
    try {
      const payload: Partial<ProvidedService> = {
        id: editingItem?.id,
        serviceId: selectedServiceId,
        clientId: selectedClientId,
        projectId: selectedProjectId.trim() ? selectedProjectId : null,
        invoiceId: selectedInvoiceId.trim() ? selectedInvoiceId : null,
        status,
        location: location.trim() ? location.trim() : null,
        scheduledDate: scheduledDate ? scheduledDate : null,
        completionDate: completionDate ? completionDate : null,
        notes: notes.trim() ? notes.trim() : null,
        customData: cleanCustomData,
      };

      const res = await onSaveProvidedService(payload);

      if (res && typeof res === 'object' && 'success' in res) {
        if (res.success) {
          setIsOpen(false);
        } else {
          setErrorDialogState({
            open: true,
            message: res.error || t('errorSavingProject'),
          });
        }
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

  // 1. Apply Quick & Popover Filters
  const filteredItems = providedServices.filter((item) => {
    const srv = item.service || services.find((s) => s.id === item.serviceId);

    // Quick filter check
    if (quickFilter === 'waste-management' && !isWasteManagementService(srv)) {
      return false;
    }

    if (filterService !== 'all' && item.serviceId !== filterService) return false;
    if (filterClient !== 'all' && item.clientId !== filterClient) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterProject !== 'all' && item.projectId !== filterProject) return false;
    if (filterInvoice !== 'all' && item.invoiceId !== filterInvoice) return false;

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

  // 2. Search
  const searchedItems = filteredItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const srv = item.service || services.find((s) => s.id === item.serviceId);
    const cli = item.client || clients.find((c) => c.id === item.clientId);
    const prj = item.project || projects.find((p) => p.id === item.projectId);
    const inv = item.invoice || invoices.find((i) => i.id === item.invoiceId);

    const sName = (srv?.name || (srv ? getServiceLabel(srv.code) : '')).toLowerCase();
    const cName = (cli?.name || '').toLowerCase();
    const pName = (prj?.name || '').toLowerCase();
    const invNum = (inv?.invoiceNumber || '').toLowerCase();
    const loc = (item.location || '').toLowerCase();
    const st = (item.status || '').toLowerCase();
    const n = (item.notes || '').toLowerCase();
    const customDataStr = item.customData ? JSON.stringify(item.customData).toLowerCase() : '';

    return (
      sName.includes(q) ||
      cName.includes(q) ||
      pName.includes(q) ||
      invNum.includes(q) ||
      loc.includes(q) ||
      st.includes(q) ||
      n.includes(q) ||
      customDataStr.includes(q)
    );
  });

  // 3. Sort
  const sortedItems = [...searchedItems].sort((a, b) => {
    let res = 0;
    const srvA = a.service || services.find((s) => s.id === a.serviceId);
    const srvB = b.service || services.find((s) => s.id === b.serviceId);
    const cliA = a.client || clients.find((c) => c.id === a.clientId);
    const cliB = b.client || clients.find((c) => c.id === b.clientId);
    const prjA = a.project || projects.find((p) => p.id === a.projectId);
    const prjB = b.project || projects.find((p) => p.id === b.projectId);
    const invA = a.invoice || invoices.find((i) => i.id === a.invoiceId);
    const invB = b.invoice || invoices.find((i) => i.id === b.invoiceId);

    switch (sortColumn) {
      case 'service': {
        const nameA = srvA?.name || (srvA ? getServiceLabel(srvA.code) : '');
        const nameB = srvB?.name || (srvB ? getServiceLabel(srvB.code) : '');
        res = nameA.localeCompare(nameB);
        break;
      }
      case 'client': {
        const nameA = cliA?.name || '';
        const nameB = cliB?.name || '';
        res = nameA.localeCompare(nameB);
        break;
      }
      case 'project': {
        const nameA = prjA?.name || '';
        const nameB = prjB?.name || '';
        res = nameA.localeCompare(nameB);
        break;
      }
      case 'invoice': {
        const nameA = invA?.invoiceNumber || '';
        const nameB = invB?.invoiceNumber || '';
        res = nameA.localeCompare(nameB);
        break;
      }
      case 'status':
        res = (a.status || '').localeCompare(b.status || '');
        break;
      case 'scheduledDate':
        res = (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
        break;
      case 'completionDate':
        res = (a.completionDate || '').localeCompare(b.completionDate || '');
        break;
      case 'location':
        res = (a.location || '').localeCompare(b.location || '');
        break;
      case 'createdAt':
        res = (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        break;
      default:
        res = 0;
    }
    return sortDirection === 'asc' ? res : -res;
  });

  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, quickFilter, filterService, filterClient, filterStatus, filterProject, filterInvoice]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

  const paginatedItems = sortedItems.slice(page * activeRowsPerPage, page * activeRowsPerPage + activeRowsPerPage);

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

  // Filter projects for the selected client in the dialog
  const availableProjectsForClient = useMemo(() => {
    if (!selectedClientId) return projects;
    return projects.filter((p) => p.clientId === selectedClientId);
  }, [projects, selectedClientId]);

  const activeServiceObj = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  if (subTab === 'statistics') {
    return (
      <ProvidedServicesStatistics
        providedServices={providedServices}
        services={services}
        clients={clients}
        categories={categories}
        projects={projects}
        invoices={invoices}
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', flex: 1, minHeight: 0 }}>
      {/* TOP ACTION BAR */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, alignItems: 'center' }}>
        {canManageProvidedServices ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openNew}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {t('btnNewProvidedService')}
          </Button>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <LockIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
              {t('permissionDeniedProvidedServices')}
            </Typography>
          </Box>
        )}
      </Box>

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

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            {/* Quick filter checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={quickFilter === 'waste-management'}
                  onChange={(e) => handleQuickFilterChange(e.target.checked ? 'waste-management' : 'all')}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t('filterWasteManagement')}
                </Typography>
              }
              sx={{ mr: 0 }}
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

                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={services}
                    getOptionLabel={(option) => option.name || getServiceLabel(option.code)}
                    isOptionEqualToValue={(option, val) => option.id === val.id}
                    value={services.find((s) => s.id === filterService) || null}
                    onChange={(_, newValue) => setFilterService(newValue ? newValue.id : 'all')}
                    renderInput={(params) => <TextField {...params} label={t('colService')} size="small" />}
                  />

                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={clients}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, val) => option.id === val.id}
                    value={clients.find((c) => c.id === filterClient) || null}
                    onChange={(_, newValue) => setFilterClient(newValue ? newValue.id : 'all')}
                    renderInput={(params) => <TextField {...params} label={t('colClient')} size="small" />}
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
                {canManageProvidedServices && <TableCell align="right">{t('colActions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={activeCols.length + (canManageProvidedServices ? 1 : 0)}
                    align="center"
                    sx={{ py: 3, color: 'text.secondary' }}
                  >
                    {t('emptyProvidedServices')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => {
                  const srv = item.service || services.find((s) => s.id === item.serviceId);
                  const cli = item.client || clients.find((c) => c.id === item.clientId);
                  const prj = item.project || projects.find((p) => p.id === item.projectId);
                  const inv = item.invoice || invoices.find((i) => i.id === item.invoiceId);
                  const itemFields = srv ? getCustomModelForService(srv.id) : [];

                  return (
                    <TableRow key={item.id} hover>
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
                            {cli?.name || item.clientId}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('project') && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {prj?.name || '—'}
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
                                const chips: React.ReactNode[] = [];

                                if (itemFields.length > 0) {
                                  itemFields.forEach((fieldDef) => {
                                    let val = item.customData?.[fieldDef.id];
                                    if (val === undefined || val === null || val === '') {
                                      for (const [k, v] of Object.entries(item.customData || {})) {
                                        if (v !== undefined && v !== null && v !== '' && isKeyMatch(k, fieldDef)) {
                                          val = v;
                                          break;
                                        }
                                      }
                                    }
                                    if (val !== undefined && val !== null && val !== '') {
                                      const label = fieldDef.name;
                                      const unitStr = fieldDef.unit ? ` ${fieldDef.unit}` : '';
                                      let displayVal = String(val);
                                      if (fieldDef.type === 'datetime' && typeof val === 'string' && val.includes('T')) {
                                        displayVal = val.replace('T', ' ');
                                      }
                                      chips.push(
                                        <Chip
                                          key={fieldDef.id}
                                          size="small"
                                          label={`${label}: ${displayVal}${unitStr}`}
                                          variant="outlined"
                                          color="primary"
                                          sx={{ fontSize: '0.75rem', height: 22 }}
                                        />
                                      );
                                    }
                                  });
                                } else {
                                  Object.entries(item.customData).forEach(([k, v]) => {
                                    if (v === null || v === undefined || v === '') return;
                                    if (k.startsWith('field_')) return;
                                    chips.push(
                                      <Chip
                                        key={k}
                                        size="small"
                                        label={`${k}: ${String(v)}`}
                                        variant="outlined"
                                        color="primary"
                                        sx={{ fontSize: '0.75rem', height: 22 }}
                                      />
                                    );
                                  });
                                }

                                if (chips.length === 0) {
                                  return (
                                    <Typography variant="body2" color="text.secondary">
                                      —
                                    </Typography>
                                  );
                                }
                                return chips;
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
                      {canManageProvidedServices && (
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <IconButton size="small" color="info" onClick={() => openEdit(item)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => onDeleteProvidedService(item.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
          count={sortedItems.length}
          rowsPerPage={activeRowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* NEW / EDIT PROVIDED SERVICE MODAL */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingItem ? t('modalEditProvidedService') : t('modalNewProvidedService')}
            </Typography>
            {editingItem && canManageProvidedServices && (
              <Button
                color="error"
                size="small"
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  onDeleteProvidedService(editingItem.id);
                  setIsOpen(false);
                }}
              >
                {t('btnDelete')}
              </Button>
            )}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              {/* Service Selection */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  size="small"
                  fullWidth
                  options={services}
                  getOptionLabel={(option) => option.name || getServiceLabel(option.code)}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  value={services.find((s) => s.id === selectedServiceId) || null}
                  onChange={(_, newValue) => setSelectedServiceId(newValue ? newValue.id : '')}
                  renderInput={(params) => <TextField {...params} label={t('colService')} required size="small" />}
                />
              </Grid>

              {/* Client Selection */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  size="small"
                  fullWidth
                  options={clients}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  value={clients.find((c) => c.id === selectedClientId) || null}
                  onChange={(_, newValue) => {
                    setSelectedClientId(newValue ? newValue.id : '');
                    // Clear selected project or invoice if not matching new client
                    if (newValue) {
                      const prj = projects.find((p) => p.id === selectedProjectId);
                      if (prj && prj.clientId !== newValue.id) setSelectedProjectId('');
                      const inv = invoices.find((i) => i.id === selectedInvoiceId);
                      if (inv && inv.clientId !== newValue.id) setSelectedInvoiceId('');
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label={t('colClient')} required size="small" />}
                />
              </Grid>

              {/* Project Selection (Optional) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  size="small"
                  fullWidth
                  options={availableProjectsForClient}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  value={availableProjectsForClient.find((p) => p.id === selectedProjectId) || null}
                  onChange={(_, newValue) => setSelectedProjectId(newValue ? newValue.id : '')}
                  renderInput={(params) => (
                    <TextField {...params} label={t('colProject')} size="small" placeholder={t('lblNoneOptional')} />
                  )}
                />
              </Grid>

              {/* Status */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblInvoiceStatus')}</InputLabel>
                  <Select
                    value={status}
                    label={t('lblInvoiceStatus')}
                    onChange={(e) => setStatus(e.target.value as string)}
                  >
                    {statusOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Location */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblLocation')}
                  placeholder={t('phLocation')}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </Grid>

              {/* Scheduled Date */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('lblScheduledDate')}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {/* Completion Date */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('lblCompletionDate')}
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {/* INVOICE SECTION */}
              <Grid size={{ xs: 12 }}>
                <ProvidedServiceInvoiceSection
                  clientId={selectedClientId}
                  clientName={clients.find((c) => c.id === selectedClientId)?.name}
                  projectId={selectedProjectId}
                  projectName={projects.find((p) => p.id === selectedProjectId)?.name}
                  selectedInvoiceId={selectedInvoiceId}
                  onSelectInvoiceId={(invId) => setSelectedInvoiceId(invId)}
                  invoices={invoices}
                  onSaveInvoice={onSaveInvoice}
                  onDeleteInvoice={onDeleteInvoice}
                  onStatusChangeInvoice={onStatusChangeInvoice}
                  setErrorDialogState={setErrorDialogState}
                  disabled={!canManageProvidedServices}
                />
              </Grid>

              {/* CUSTOM DATA SECTION */}
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    mt: 1,
                    mb: 1,
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: currentCustomFields.length ? 1.5 : 0,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('customDataSection')}
                    </Typography>
                    {canManageProvidedServices && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => setIsCustomModelModalOpen(true)}
                        sx={{ textTransform: 'none' }}
                      >
                        {t('btnEditCustomDataModel')}
                      </Button>
                    )}
                  </Box>

                  {currentCustomFields.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('noCustomFieldsDefined')}
                      </Typography>
                      {canManageProvidedServices && (
                        <Button
                          size="small"
                          variant="text"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={() => setIsCustomModelModalOpen(true)}
                          sx={{ textTransform: 'none' }}
                        >
                          {t('btnDefineModel')}
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                      {currentCustomFields.map((field) => (
                        <Grid key={field.id} size={{ xs: 12, sm: 6 }}>
                          {field.type === 'text' && (
                            <TextField
                              fullWidth
                              size="small"
                              label={field.name}
                              value={customData[field.id] || ''}
                              onChange={(e) =>
                                setCustomData((prev) => ({ ...prev, [field.id]: e.target.value }))
                              }
                            />
                          )}
                          {field.type === 'number' && (
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label={field.unit ? `${field.name} (${field.unit})` : field.name}
                              value={customData[field.id] ?? ''}
                              onChange={(e) =>
                                setCustomData((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value === '' ? '' : Number(e.target.value),
                                }))
                              }
                              slotProps={{
                                htmlInput: { step: 'any' },
                                input: field.unit
                                  ? {
                                      endAdornment: (
                                        <InputAdornment position="end">{field.unit}</InputAdornment>
                                      ),
                                    }
                                  : undefined,
                              }}
                            />
                          )}
                          {field.type === 'list' && (
                            <FormControl fullWidth size="small">
                              <InputLabel>{field.name}</InputLabel>
                              <Select
                                value={customData[field.id] || ''}
                                label={field.name}
                                onChange={(e) =>
                                  setCustomData((prev) => ({ ...prev, [field.id]: e.target.value }))
                                }
                              >
                                <MenuItem value="">
                                  <em>{t('lblNoneOptional')}</em>
                                </MenuItem>
                                {(field.options || []).map((opt) => (
                                  <MenuItem key={opt} value={opt}>
                                    {opt}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                          {(field.type === 'datetime' || field.type === 'date') && (
                            <TextField
                              fullWidth
                              size="small"
                              type={field.type === 'datetime' ? 'datetime-local' : 'date'}
                              label={field.name}
                              value={customData[field.id] || ''}
                              onChange={(e) =>
                                setCustomData((prev) => ({ ...prev, [field.id]: e.target.value }))
                              }
                              slotProps={{ inputLabel: { shrink: true } }}
                            />
                          )}
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label={t('lblDescription')}
                  placeholder={t('phDescription')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsOpen(false)} variant="outlined" disabled={isSaving}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
              {isSaving ? '...' : t('btnSave')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* CUSTOM DATA MODEL DEFINITION MODAL */}
      <CustomDataModelModal
        isOpen={isCustomModelModalOpen}
        onClose={() => setIsCustomModelModalOpen(false)}
        service={activeServiceObj}
        initialFields={currentCustomFields}
        onSave={handleSaveCustomModel}
      />

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default ProvidedServicesView;
