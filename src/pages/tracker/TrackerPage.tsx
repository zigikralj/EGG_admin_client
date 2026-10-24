import React, { useMemo, useState, useEffect, Suspense } from 'react';
import {
  Grid,
  Card,
  Typography,
  Button,
  Box,
  Stack,
  Chip,
  Paper,
  TextField,
  Autocomplete,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';





import type { Project, DashboardSubTab } from '../../types';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { ReminderPanel } from '../../components/tracker/ReminderPanel';
import { ApproachingInvoicesPanel } from '../../components/tracker/ApproachingInvoicesPanel';
import { WasteDisposalPanel, isWasteDisposalService } from '../../components/tracker/WasteDisposalPanel';
import { ProjectCard } from '../../components/project/ProjectCard';

import { TableFilterSelector } from '../../components/common/TableFilterSelector';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { TableQuickFilters, type QuickFilterItem } from '../../components/common/TableQuickFilters';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';
import { ArrowUpwardIcon, ArrowDownwardIcon, AddIcon, RefreshIcon } from '../../components/icons';

const ProjectsStatistics = React.lazy(() => import('../../components/tracker/statistics/ProjectsStatistics'));
const WasteDisposalStatistics = React.lazy(() => import('../../components/tracker/statistics/WasteDisposalStatistics'));
const ProjectUpdatesPanel = React.lazy(() => import('../../components/tracker/ProjectUpdatesPanel'));

interface Props {
  dashboardSubTab?: DashboardSubTab;
  onViewProject?: (project: Project, diffRange?: { dateFrom: string; dateTo: string } | null) => void;
  onOpenProjectDiff?: (project: Project, diffRange: { dateFrom: string; dateTo: string }) => void;
  onEditProject?: (project: Project) => void;
  onNavigateToProjects?: () => void;
  onNavigateToInvoices?: () => void;
  onOpenNewProject?: () => void;
  quickFilters?: string[];
  onQuickFiltersChange?: (filters: string[]) => void;
  quickFilterDashboardReminders?: boolean;
  onQuickFilterDashboardRemindersChange?: (val: boolean) => void;
  remindersRowsPerPageOptions?: number[];
  onRemindersRowsPerPageOptionsChange?: (options: number[]) => void;
  remindersRowsPerPage?: number;
  onRemindersRowsPerPageChange?: (rowsPerPage: number) => void;
  invoicesRowsPerPageOptions?: number[];
  onInvoicesRowsPerPageOptionsChange?: (options: number[]) => void;
  invoicesRowsPerPage?: number;
  onInvoicesRowsPerPageChange?: (rowsPerPage: number) => void;
  wasteManagementRowsPerPageOptions?: number[];
  onWasteManagementRowsPerPageOptionsChange?: (options: number[]) => void;
  wasteManagementRowsPerPage?: number;
  onWasteManagementRowsPerPageChange?: (rowsPerPage: number) => void;
  sortDashboardProjects?: { field: string; direction: 'asc' | 'desc' };
  onSortDashboardProjectsChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
}

import {
  useProjectsQuery,
  useInfiniteProjectsQuery,
  useClientsSummaryQuery,
  useUsersSummaryQuery,
  useCategoriesQuery,
  useServicesQuery,
  useProvidedServicesQuery,
  useRemindersQuery,
  useInvoicesQuery,
  useProjectsMutations,
  useRemindersMutations,
  useProvidedServicesMutations,
  useInvoicesMutations,
} from '../../queries';
import { useDebounce } from '../../hooks/useDebounce';

const DashboardView: React.FC<Props> = ({
  dashboardSubTab = 'projects',
  onViewProject,
  onOpenProjectDiff,
  onEditProject,
  onNavigateToProjects: _onNavigateToProjects,
  onNavigateToInvoices,
  onOpenNewProject,
  quickFilters: quickFiltersProp,
  onQuickFiltersChange,
  quickFilterDashboardReminders,
  onQuickFilterDashboardRemindersChange,
  remindersRowsPerPageOptions,
  onRemindersRowsPerPageOptionsChange,
  remindersRowsPerPage,
  onRemindersRowsPerPageChange,
  invoicesRowsPerPageOptions,
  onInvoicesRowsPerPageOptionsChange,
  invoicesRowsPerPage,
  onInvoicesRowsPerPageChange,
  wasteManagementRowsPerPageOptions,
  onWasteManagementRowsPerPageOptionsChange,
  wasteManagementRowsPerPage,
  onWasteManagementRowsPerPageChange,
  sortDashboardProjects,
  onSortDashboardProjectsChange,
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { currentUser, isRestrictedToOwn, hasPermission } = useAuth();
  const isProjectsRestricted = isRestrictedToOwn('projects') || isRestrictedToOwn('tracker_projects');
  const isRemindersRestricted = isRestrictedToOwn('reminders') || isRestrictedToOwn('tracker_reminders');
  const { withLoading } = useLoading();
  const canViewWasteDisposal = hasPermission('wasteDisposal', 'view');
  const canViewUpdates = hasPermission('tracker_updates', 'view');

  const [isProjectsFilterOpen, setIsProjectsFilterOpen] = useState(false);

  const isStatisticSubTab =
    dashboardSubTab === 'statistic' ||
    dashboardSubTab === 'statistic-waste-disposal' ||
    dashboardSubTab === 'statistic-waste-management' ||
    dashboardSubTab === 'waste-management';
  const shouldFetchProjects = isStatisticSubTab;
  const shouldFetchInvoices = dashboardSubTab === 'invoices' || isStatisticSubTab;
  const shouldFetchReminders = dashboardSubTab === 'reminders';
  const shouldFetchProvidedServices = dashboardSubTab === 'waste-disposal' || isStatisticSubTab;
  const shouldFetchClients =
    (dashboardSubTab === 'projects' && isProjectsFilterOpen) ||
    dashboardSubTab === 'reminders' ||
    dashboardSubTab === 'invoices' ||
    dashboardSubTab === 'waste-disposal' ||
    isStatisticSubTab;
  const shouldFetchUsers =
    (dashboardSubTab === 'projects' && isProjectsFilterOpen) ||
    dashboardSubTab === 'reminders' ||
    isStatisticSubTab;
  const shouldFetchCategories =
    (dashboardSubTab === 'projects' && isProjectsFilterOpen) ||
    isStatisticSubTab;
  const shouldFetchServices =
    (dashboardSubTab === 'projects' && isProjectsFilterOpen) ||
    dashboardSubTab === 'waste-disposal' ||
    isStatisticSubTab;

  const { data: projects = [], refetch: refetchProjects, isRefetching: isRefetchingProjects } = useProjectsQuery('', { enabled: shouldFetchProjects });
  const { data: clients = [] } = useClientsSummaryQuery({ enabled: shouldFetchClients });
  const { data: users = [] } = useUsersSummaryQuery({ enabled: shouldFetchUsers });
  const { data: categories = [] } = useCategoriesQuery({ enabled: shouldFetchCategories });
  const { data: services = [] } = useServicesQuery({ enabled: shouldFetchServices });
  const { data: providedServices = [], refetch: refetchProvidedServices, isRefetching: isRefetchingProvidedServices } = useProvidedServicesQuery({ enabled: shouldFetchProvidedServices });
  const { data: reminders = [], refetch: refetchReminders, isRefetching: isRefetchingReminders } = useRemindersQuery({ enabled: shouldFetchReminders });
  const { data: invoices = [], refetch: refetchInvoices, isRefetching: isRefetchingInvoices } = useInvoicesQuery({ enabled: shouldFetchInvoices });

  const displayReminders = useMemo(() => {
    if (!isRemindersRestricted || !currentUser) return reminders;
    return reminders.filter((rem) => {
      const isMyName =
        rem.responsible &&
        currentUser.name &&
        rem.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
      const isMyId = rem.responsibleId && rem.responsibleId === currentUser.id;
      return isMyName || isMyId;
    });
  }, [reminders, isRemindersRestricted, currentUser]);

  const { toggleDoneMutation } = useProjectsMutations();

  const { handleSave: onSaveReminder, handleDelete: _onDeleteReminder, handleStatusChangeReminder: onStatusChangeReminder } = useRemindersMutations();
  const { handleSave: onSaveProvidedService, handleDelete: _onDeleteProvidedService } = useProvidedServicesMutations();
  const { handleSave: onSaveInvoice, handleDelete: _onDeleteInvoice, handleUpdateInvoiceStatus: onStatusChangeInvoice } = useInvoicesMutations();

  const { handleDelete: _onDeleteProject } = useProjectsMutations();

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  
  const wrappedOnDelete = (id: string) => _onDeleteProject(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));
  const onDeleteReminder = (id: string) => _onDeleteReminder(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));
  const onDeleteProvidedService = (id: string) => _onDeleteProvidedService(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));
  const onDeleteInvoice = (id: string) => _onDeleteInvoice(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));

  
  const handleStatusChangeInvoice = async (id: string, status: string, paymentDate?: string) => {
    await onStatusChangeInvoice(id, status, paymentDate);
  };


  // Projects subtab state & filtering
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [quickFilters, setQuickFilters] = useState<string[]>(() => {
    const defaultFilters = isProjectsRestricted ? ['active'] : ['my', 'active'];
    if (quickFiltersProp !== undefined) {
      return isProjectsRestricted ? quickFiltersProp.filter((k) => k !== 'my') : quickFiltersProp;
    }
    return defaultFilters;
  });

  useEffect(() => {
    if (quickFiltersProp !== undefined) {
      const sanitized = isProjectsRestricted ? quickFiltersProp.filter((k) => k !== 'my') : quickFiltersProp;
      setQuickFilters(sanitized);
      if (sanitized.includes('my') && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      } else if (!sanitized.includes('my') && currentUser?.name) {
        setFilterResponsible((prev) => (prev === currentUser.name ? 'all' : prev));
      }
      if (sanitized.includes('overdue')) {
        setFilterStatus('overdue');
      } else if (sanitized.includes('stale')) {
        setFilterStatus('stale');
      } else if (sanitized.includes('done')) {
        setFilterStatus('done');
      } else {
        setFilterStatus((prev) => (['overdue', 'stale', 'done'].includes(prev) ? 'all' : prev));
      }
    } else {
      setQuickFilters(isProjectsRestricted ? ['active'] : ['my', 'active']);
    }
  }, [quickFiltersProp, currentUser?.name, isProjectsRestricted]);

  useEffect(() => {
    if (isProjectsRestricted) {
      setQuickFilters((prev) => prev.filter((k) => k !== 'my'));
    }
  }, [isProjectsRestricted]);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('deadline');
  const [sortOption, setSortOption] = useState<'deadline' | 'name' | 'start' | 'progress' | 'createdAt'>(() => {
    return (sortDashboardProjects?.field as any) || 'deadline';
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    return sortDashboardProjects?.direction || 'asc';
  });

  useEffect(() => {
    if (sortDashboardProjects?.field) {
      setSortOption(sortDashboardProjects.field as any);
    }
    if (sortDashboardProjects?.direction) {
      setSortDirection(sortDashboardProjects.direction);
    }
  }, [sortDashboardProjects?.field, sortDashboardProjects?.direction]);

  const handleSortOptionChange = (newField: 'deadline' | 'name' | 'start' | 'progress' | 'createdAt') => {
    setSortOption(newField);
    onSortDashboardProjectsChange?.({ field: newField, direction: sortDirection });
  };

  const handleSortDirectionToggle = () => {
    const nextDir = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(nextDir);
    onSortDashboardProjectsChange?.({ field: sortOption, direction: nextDir });
  };

  const infiniteProjectsQuery = useInfiniteProjectsQuery(
    {
      limit: 12,
      sortBy: sortOption,
      sortOrder: sortDirection,
      search: debouncedSearch,
      type: filterCategory !== 'all' ? filterCategory : undefined,
      clientId: filterClient !== 'all' ? filterClient : undefined,
      responsible: isProjectsRestricted
        ? (currentUser?.name || undefined)
        : (quickFilters.includes('my') && currentUser?.name ? currentUser.name : (filterResponsible !== 'all' ? filterResponsible : undefined)),
      status: quickFilters.includes('overdue')
        ? 'overdue'
        : quickFilters.includes('stale')
        ? 'stale'
        : quickFilters.includes('done')
        ? 'done'
        : (filterStatus !== 'all' ? filterStatus : undefined),
      done: quickFilters.includes('active') ? false : undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
      dateField: filterDateField,
    },
    dashboardSubTab === 'projects'
  );

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInfiniteLoading,
    refetch: refetchInfiniteProjects,
  } = infiniteProjectsQuery;

  const infiniteProjects = useMemo(() => {
    if (!infiniteData?.pages) return [];
    return infiniteData.pages.flatMap((page) => page.items);
  }, [infiniteData?.pages]);

  const totalCardsCount = infiniteData?.pages?.[0]?.total ?? infiniteProjects.length;

  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const observerSentinelCallback = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node || !hasNextPage || isFetchingNextPage) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0, rootMargin: '300px' }
      );

      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const [newInvoiceTrigger, setNewInvoiceTrigger] = useState(0);
  const [newReminderTrigger, setNewReminderTrigger] = useState(0);
  const [newWasteServiceTrigger, setNewWasteServiceTrigger] = useState(0);

  const handleToggleFilter = (filterKey: string, checked: boolean) => {
    const updated = checked
      ? [...quickFilters, filterKey]
      : quickFilters.filter((k) => k !== filterKey);
    setQuickFilters(updated);
    onQuickFiltersChange?.(updated);

    if (filterKey === 'my') {
      if (checked && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      } else if (!checked && currentUser?.name && filterResponsible === currentUser.name) {
        setFilterResponsible('all');
      }
    } else if (filterKey === 'overdue') {
      if (checked) {
        setFilterStatus('overdue');
      } else if (!checked && filterStatus === 'overdue') {
        setFilterStatus('all');
      }
    } else if (filterKey === 'stale') {
      if (checked) {
        setFilterStatus('stale');
      } else if (!checked && filterStatus === 'stale') {
        setFilterStatus('all');
      }
    } else if (filterKey === 'done') {
      if (checked) {
        setFilterStatus('done');
      } else if (!checked && filterStatus === 'done') {
        setFilterStatus('all');
      }
    }
  };

  const projectQuickFilterOptions: QuickFilterItem[] = useMemo(() => [
    { key: 'my', label: t('quickFilterMyProjects'), hidden: isProjectsRestricted, color: 'primary' },
    { key: 'active', label: t('quickFilterActive'), color: 'primary' },
    { key: 'missing_invoice', label: t('quickFilterMissingInvoice'), color: 'warning' },
    { key: 'stale', label: t('quickFilterStale'), color: 'primary' },
    { key: 'overdue', label: t('quickFilterOverdue'), color: 'error', labelColor: 'error.main' },
  ], [t, isProjectsRestricted]);

  const handleQuickFiltersChange = (newKeys: string[]) => {
    const added = newKeys.find((k) => !quickFilters.includes(k));
    const removed = quickFilters.find((k) => !newKeys.includes(k));
    if (added) handleToggleFilter(added, true);
    else if (removed) handleToggleFilter(removed, false);
    else {
      setQuickFilters(newKeys);
      onQuickFiltersChange?.(newKeys);
    }
  };

  const handleFilterResponsibleChange = (val: string) => {
    setFilterResponsible(val);
    if (currentUser?.name && val === currentUser.name) {
      if (!quickFilters.includes('my')) {
        const updated = [...quickFilters, 'my'];
        setQuickFilters(updated);
        onQuickFiltersChange?.(updated);
      }
    } else if (quickFilters.includes('my')) {
      const updated = quickFilters.filter((k) => k !== 'my');
      setQuickFilters(updated);
      onQuickFiltersChange?.(updated);
    }
  };

  const handleFilterStatusChange = (val: string) => {
    setFilterStatus(val);
    const statusKeys = ['overdue', 'stale', 'done'];
    const updated = quickFilters.filter((k) => !statusKeys.includes(k));
    if (statusKeys.includes(val)) {
      updated.push(val);
    }
    setQuickFilters(updated);
    onQuickFiltersChange?.(updated);
  };

  const handleClearAllFilters = () => {
    setQuickFilters([]);
    onQuickFiltersChange?.([]);
    setFilterCategory('all');
    setFilterClient('all');
    setFilterResponsible('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('deadline');
    setSearchQuery('');
  };

  const uniqueCategories = useMemo(() => {
    if (categories.length > 0) return categories.map((c) => c.name);
    return Array.from(new Set(projects.map((p) => p.type).filter(Boolean)));
  }, [categories, projects]);

  const uniqueClients = useMemo(() => {
    if (clients.length > 0) return Array.from(new Set(clients.map((c) => c.name).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    return Array.from(new Set(projects.map((p) => p.clientName).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [clients, projects]);

  const otherResponsibles = useMemo(() => {
    const currentName = currentUser?.name?.trim().toLowerCase();
    const source = users.length > 0 ? users.map((u) => u.name) : projects.map((p) => p.responsible);
    const setOfNames = new Set(source.filter(Boolean) as string[]);
    return Array.from(setOfNames)
      .filter((r) => !currentName || r.trim().toLowerCase() !== currentName)
      .sort((a, b) => a.localeCompare(b));
  }, [users, projects, currentUser]);

  const responsibleOptions = useMemo(() => {
    if (isProjectsRestricted) {
      return currentUser?.name ? [currentUser.name] : [];
    }
    const list: string[] = [];
    if (currentUser?.name) list.push(currentUser.name);
    list.push(...otherResponsibles);
    return list;
  }, [currentUser?.name, otherResponsibles, isProjectsRestricted]);

  const sortOptions = useMemo(() => [
    { value: 'deadline', label: t('deadline') },
    { value: 'name', label: t('colProject') },
    { value: 'start', label: t('start') },
    { value: 'progress', label: t('progress') },
    { value: 'createdAt', label: t('lblCreatedDate') },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: 'creation', label: t('statInCreation') },
    { value: 'overdue', label: t('statOverdueUrgent') },
    { value: 'stale', label: t('statStale') },
    { value: 'done', label: t('statDone') },
  ], [t]);



  const activeFilterCount =
    (filterCategory !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterResponsible !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterDateFrom || filterDateTo ? 1 : 0) +
    quickFilters.length;

  const clearFilters = () => {
    handleClearAllFilters();
  };

  const renderRemindersPanel = (isFullHeight = false, hideNotch = false) => (
    <ReminderPanel
      projects={projects}
      reminders={displayReminders}
      clients={clients}
      users={users}
      onSaveReminder={onSaveReminder}
      onDeleteReminder={onDeleteReminder}
      onStatusChangeReminder={onStatusChangeReminder}
      isFullHeight={isFullHeight}
      hideNotch={hideNotch}
      openNewReminderTrigger={newReminderTrigger}
      onNewReminderTriggerHandled={() => setNewReminderTrigger(0)}
      myRemindersOnly={quickFilterDashboardReminders}
      onMyRemindersOnlyChange={onQuickFilterDashboardRemindersChange}
      rowsPerPageOptions={remindersRowsPerPageOptions}
      onRowsPerPageOptionsChange={onRemindersRowsPerPageOptionsChange}
      rowsPerPage={remindersRowsPerPage}
      onRowsPerPageChange={onRemindersRowsPerPageChange}
      onRefresh={() => withLoading(() => refetchReminders(), t('loadingRefreshing') || 'Refreshing data...')}
      isRefreshing={isRefetchingReminders}
    />
  );

  const renderApproachingInvoicesPanel = (isFullHeight = false, hideNotch = false) => (
    <ApproachingInvoicesPanel
      invoices={invoices}
      providedServices={providedServices}
      clients={clients}
      projects={projects}
      isFullHeight={isFullHeight}
      hideNotch={hideNotch}
      openNewInvoiceTrigger={newInvoiceTrigger}
      onNewInvoiceTriggerHandled={() => setNewInvoiceTrigger(0)}
      onSaveInvoice={onSaveInvoice}
      onSaveProvidedService={onSaveProvidedService}
      onDeleteInvoice={onDeleteInvoice}
      onStatusChangeInvoice={handleStatusChangeInvoice}
      onViewProject={onViewProject || onEditProject}
      onNavigateToInvoices={onNavigateToInvoices}
      rowsPerPageOptions={invoicesRowsPerPageOptions}
      onRowsPerPageOptionsChange={onInvoicesRowsPerPageOptionsChange}
      rowsPerPage={invoicesRowsPerPage}
      onRowsPerPageChange={onInvoicesRowsPerPageChange}
      onRefresh={() => withLoading(() => refetchInvoices(), t('loadingRefreshing') || 'Refreshing data...')}
      isRefreshing={isRefetchingInvoices}
    />
  );

  const wasteProvidedServices = useMemo(() => {
    return providedServices.filter((item) => {
      const srv = item.service || services.find((s) => s.id === item.serviceId);
      return isWasteDisposalService(srv);
    });
  }, [providedServices, services]);

  const renderWasteDisposalPanel = (isFullHeight = false, hideNotch = false) => (
    <WasteDisposalPanel
      providedServices={providedServices}
      services={services}
      clients={clients}
      projects={projects}
      invoices={invoices}
      categories={categories}
      isFullHeight={isFullHeight}
      hideNotch={hideNotch}
      openNewTrigger={newWasteServiceTrigger}
      onNewTriggerHandled={() => setNewWasteServiceTrigger(0)}
      onSaveProvidedService={onSaveProvidedService}
      onDeleteProvidedService={onDeleteProvidedService}
      onSaveInvoice={onSaveInvoice}
      onDeleteInvoice={onDeleteInvoice}
      onStatusChangeInvoice={handleStatusChangeInvoice}
      rowsPerPageOptions={wasteManagementRowsPerPageOptions}
      onRowsPerPageOptionsChange={onWasteManagementRowsPerPageOptionsChange}
      rowsPerPage={wasteManagementRowsPerPage}
      onRowsPerPageChange={onWasteManagementRowsPerPageChange}
      onRefresh={() => withLoading(() => refetchProvidedServices(), t('loadingRefreshing') || 'Refreshing data...')}
      isRefreshing={isRefetchingProvidedServices}
    />
  );

  return (
    <Stack spacing={2.5}>
      {/* STATISTIC ONLY VIEW */}
      {dashboardSubTab === 'statistic' && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('projectsStatistic')}
            </Typography>
          </Box>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
            <ProjectsStatistics
              projects={isProjectsRestricted && currentUser ? projects.filter((p) => {
                const isMyName = p.responsible && currentUser.name && p.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
                const isMyId = (p as any).responsibleId && (p as any).responsibleId === currentUser.id;
                return isMyName || isMyId;
              }) : projects}
              clients={clients}
              users={users}
              categories={categories}
              services={services}
              invoices={invoices}
            />
          </Suspense>
        </Box>
      )}

      {/* WASTE DISPOSAL STATISTIC VIEW */}
      {(dashboardSubTab === 'statistic-waste-disposal' || dashboardSubTab === 'statistic-waste-management' || dashboardSubTab === 'waste-management') && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
            <WasteDisposalStatistics
              providedServices={providedServices}
              services={services}
              clients={clients}
              categories={categories}
              projects={projects}
              invoices={invoices}
              title={t('subTabWasteDisposal')}
            />
          </Suspense>
        </Box>
      )}

      {/* REMINDERS ONLY VIEW */}
      {dashboardSubTab === 'reminders' && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('remindersTitle')}
              </Typography>
              <Chip label={(displayReminders || []).length} size="small" color="primary" sx={{ fontWeight: 700 }} />
            </Box>
            {true && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setNewReminderTrigger((prev) => prev + 1)}
                size="small"
                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
              >
                {t('btnNewReminder')}
              </Button>
            )}
          </Box>
          {renderRemindersPanel(true, true)}
        </Box>
      )}

      {/* INVOICES ONLY VIEW */}
      {dashboardSubTab === 'invoices' && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('tabInvoices')}
              </Typography>
              <Chip label={invoices.length} size="small" color="primary" sx={{ fontWeight: 700 }} />
            </Box>
            {true && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setNewInvoiceTrigger((prev) => prev + 1)}
                size="small"
                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
              >
                {t('modalNewInvoice')}
              </Button>
            )}
          </Box>
          {renderApproachingInvoicesPanel(true, true)}
        </Box>
      )}

      {/* WASTE DISPOSAL ONLY VIEW */}
      {dashboardSubTab === 'waste-disposal' && canViewWasteDisposal && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('subTabWasteDisposal')}
              </Typography>
              <Chip label={wasteProvidedServices.length} size="small" color="primary" sx={{ fontWeight: 700 }} />
            </Box>
            {true && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setNewWasteServiceTrigger((prev) => prev + 1)}
                size="small"
                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
              >
                {t('btnNewWasteDisposal')}
              </Button>
            )}
          </Box>
          {renderWasteDisposalPanel(true, true)}
        </Box>
      )}

      {/* PROJECT UPDATES SUBTAB VIEW */}
      {dashboardSubTab === 'updates' && canViewUpdates && (
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
          <ProjectUpdatesPanel
            onOpenProjectDiff={(proj, r) => {
              if (onOpenProjectDiff) {
                onOpenProjectDiff(proj, r);
              } else if (onViewProject) {
                onViewProject(proj, r);
              }
            }}
            onEditProject={onEditProject}
            onViewProject={onViewProject}
          />
        </Suspense>
      )}

      {/* PROJECTS SUBTAB VIEW */}
      {dashboardSubTab === 'projects' && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* TITLE HEADER */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('subTabProjects')}
              </Typography>
              <Chip
                label={totalCardsCount > 0 ? `${infiniteProjects.length} / ${totalCardsCount}` : '0'}
                size="small"
                color="primary"
                sx={{ fontWeight: 700 }}
              />
            </Box>
            {onOpenNewProject && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={onOpenNewProject}
                size="small"
              >
                {t('btnNewProject')}
              </Button>
            )}
          </Box>

          {/* FILTERS BAR ON TOP */}
          <Card variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: { xs: 'stretch', lg: 'center' }, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {/* QUICK FILTER CHECKBOXES */}
                <TableQuickFilters
                  options={projectQuickFilterOptions}
                  selectedKeys={quickFilters}
                  onChange={handleQuickFiltersChange}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {/* SEARCH FIELD */}
                <TableSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                />

                {/* REFRESH BUTTON */}
                <Tooltip title={t('btnRefresh') || 'Refresh'}>
                  <span>
                    <IconButton
                      onClick={() => withLoading(async () => {
                        await Promise.all([refetchProjects(), refetchInfiniteProjects()]);
                      }, t('loadingRefreshing') || 'Refreshing data...')}
                      disabled={isRefetchingProjects}
                      color="primary"
                      size="small"
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
                          animation: isRefetchingProjects ? 'spin 1s linear infinite' : undefined,
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                        }}
                      />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* POPOVER FILTERS */}
                <TableFilterSelector
                  activeCount={activeFilterCount}
                  onClear={clearFilters}
                  onOpen={() => setIsProjectsFilterOpen(true)}
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
                          if (newValue) handleSortOptionChange(newValue.value as any);
                        }}
                        renderInput={(params) => <TextField {...params} label={t('lblSortBy')} size="small" />}
                      />
                      <IconButton
                        size="small"
                        onClick={handleSortDirectionToggle}
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
                        { value: 'deadline', label: t('deadline') },
                        { value: 'start', label: t('start') },
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
                        options={uniqueCategories}
                        getOptionLabel={(cat) => getServiceLabel(cat, services)}
                        value={filterCategory === 'all' ? null : filterCategory}
                        onChange={(_, newValue) => setFilterCategory(newValue || 'all')}
                        renderInput={(params) => <TextField {...params} label={t('colService')} size="small" />}
                      />

                      <Autocomplete
                        size="small"
                        fullWidth
                        disablePortal
                        options={uniqueClients}
                        value={filterClient === 'all' ? null : filterClient}
                        onChange={(_, newValue) => setFilterClient(newValue || 'all')}
                        renderInput={(params) => <TextField {...params} label={t('colClient')} size="small" />}
                      />

                      <Autocomplete
                        size="small"
                        fullWidth
                        disablePortal
                        options={responsibleOptions}
                        getOptionLabel={(option) => {
                          if (currentUser?.name && option === currentUser.name) {
                            return `${t('lblMe')} (${currentUser.name})`;
                          }
                          return option;
                        }}
                        value={filterResponsible === 'all' ? null : filterResponsible}
                        onChange={(_, newValue) => handleFilterResponsibleChange(newValue || 'all')}
                        renderInput={(params) => <TextField {...params} label={t('colResponsible')} size="small" />}
                      />

                      <Autocomplete
                        size="small"
                        fullWidth
                        disablePortal
                        options={statusOptions}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, val) => option.value === val.value}
                        value={statusOptions.find((o) => o.value === filterStatus) || null}
                        onChange={(_, newValue) => handleFilterStatusChange(newValue ? newValue.value : 'all')}
                        renderInput={(params) => <TextField {...params} label={t('colDeadlineStatus')} size="small" />}
                      />
                    </>
                  }
                />
              </Box>
            </Box>
          </Card>

          {/* ALL PROJECTS BELOW THAT */}
          {infiniteProjects.length > 0 ? (
            <>
              <Grid container spacing={2}>
                {infiniteProjects.map((p) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
                    <ProjectCard
                      project={p}
                      services={services}
                      reminders={reminders}
                      invoices={invoices}
                      onView={() => onViewProject?.(p)}
                      onEdit={() => onEditProject?.(p)}
                      onDelete={() => wrappedOnDelete(p.id)}
                      onToggleDone={() => toggleDoneMutation.mutate({ id: p.id, isCompleting: !p.done })}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Sentinel for infinite scroll */}
              <Box ref={observerSentinelCallback} sx={{ height: 20, width: '100%', mt: 2 }} />

              {/* Loading indicator or fallback load more button */}
              {isFetchingNextPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {hasNextPage && !isFetchingNextPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button variant="outlined" size="small" onClick={() => fetchNextPage()}>
                    {t('btnLoadMore') || 'Load More'}
                  </Button>
                </Box>
              )}
            </>
          ) : isInfiniteLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('emptyProjects')}</Typography>
            </Paper>
          )}
        </Box>
      )}

      <ConfirmDialog
        open={deleteConfirmState.open}
        title={t('confirmDeleteTitle')}
        message={deleteConfirmState.message}
        confirmLabel={t('btnDelete')}
        onConfirm={deleteConfirmState.onConfirm}
        onClose={() => setDeleteConfirmState((prev) => ({ ...prev, open: false }))}
        confirmColor="warning"
      />
    </Stack>
  );
};

export default DashboardView;
