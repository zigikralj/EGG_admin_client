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
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  CircularProgress,
} from '@mui/material';





import type { Project, ProjectStats, Reminder, Invoice, DashboardSubTab, User, Category, Service, Client, ProvidedService, SaveResult } from '../../types';
import { ReminderPanel } from '../ReminderPanel';
import { ApproachingInvoicesPanel } from '../ApproachingInvoicesPanel';
import { ProjectCard } from '../ProjectCard';

import { TableFilterSelector } from '../TableFilterSelector';
import { DateRangeFilter } from '../DateRangeFilter';
import { TableSearchInput } from '../TableSearchInput';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowUpwardIcon, ArrowDownwardIcon, AddIcon } from '../icons';

const StatisticsCharts = React.lazy(() => import('../StatisticsCharts'));


interface Props {
  dashboardSubTab?: DashboardSubTab;
  stats?: ProjectStats;
  projects: Project[];
  clients?: Client[];
  users?: User[];
  categories?: Category[];
  services?: Service[];
  providedServices?: ProvidedService[];
  reminders?: Reminder[];
  invoices?: Invoice[];
  onMarkSampled: (id: string) => void;
  onToggleDone: (id: string) => void;
  onSaveReminder?: (reminder: Partial<Reminder>) => void;
  onDeleteReminder?: (id: string) => void;
  onStatusChangeReminder?: (id: string, status: string) => void;
  onSaveProvidedService?: (ps: Partial<ProvidedService>) => Promise<SaveResult | void> | void;
  onViewProject?: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onNavigateToProjects?: () => void;
  onNavigateToInvoices?: () => void;
  onOpenNewProject?: () => void;
  onSaveInvoice?: (invoice: Partial<Invoice>) => Promise<any> | void;
  onDeleteInvoice?: (id: string) => void;
  onStatusChangeInvoice?: (id: string, status: string, paymentDate?: string) => Promise<void> | void;
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
}

const DashboardView: React.FC<Props> = ({
  dashboardSubTab = 'projects',
  stats: _stats,
  projects,
  clients = [],
  users = [],
  categories = [],
  services = [],
  providedServices = [],
  reminders = [],
  invoices = [],
  onMarkSampled,
  onToggleDone,
  onSaveReminder,
  onDeleteReminder,
  onStatusChangeReminder,
  onSaveProvidedService,
  onViewProject,
  onEditProject,
  onDeleteProject,
  onNavigateToProjects: _onNavigateToProjects,
  onNavigateToInvoices,
  onOpenNewProject,
  onSaveInvoice,
  onDeleteInvoice,
  onStatusChangeInvoice,
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
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { currentUser, isAccountant } = useAuth();

  // Projects subtab state & filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilters, setQuickFilters] = useState<string[]>(() =>
    quickFiltersProp !== undefined ? quickFiltersProp : (isAccountant ? ['active'] : ['my', 'active'])
  );

  useEffect(() => {
    if (quickFiltersProp !== undefined) {
      setQuickFilters(quickFiltersProp);
      if (quickFiltersProp.includes('my') && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      }
      if (quickFiltersProp.includes('overdue')) {
        setFilterStatus('overdue');
      } else if (quickFiltersProp.includes('stale')) {
        setFilterStatus('stale');
      } else if (quickFiltersProp.includes('done')) {
        setFilterStatus('done');
      }
    } else {
      setQuickFilters(isAccountant ? ['active'] : ['my', 'active']);
    }
  }, [quickFiltersProp, currentUser?.name, isAccountant]);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('deadline');
  const [sortOption, setSortOption] = useState<'deadline' | 'name' | 'start' | 'progress' | 'createdAt'>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [newInvoiceTrigger, setNewInvoiceTrigger] = useState(0);
  const [newReminderTrigger, setNewReminderTrigger] = useState(0);

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
    return Array.from(new Set(projects.map((p) => p.type).filter(Boolean)));
  }, [projects]);

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.clientName).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const otherResponsibles = useMemo(() => {
    const currentName = currentUser?.name?.trim().toLowerCase();
    const setOfNames = new Set(projects.map((p) => p.responsible).filter(Boolean) as string[]);
    return Array.from(setOfNames)
      .filter((r) => !currentName || r.trim().toLowerCase() !== currentName)
      .sort((a, b) => a.localeCompare(b));
  }, [projects, currentUser]);

  const responsibleOptions = useMemo(() => {
    const list: string[] = [];
    if (currentUser?.name) list.push(currentUser.name);
    list.push(...otherResponsibles);
    return list;
  }, [currentUser?.name, otherResponsibles]);

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

  const filteredDashboardProjects = useMemo(() => {
    const isStaleProject = (p: Project): boolean => {
      if (p.done || !p.start) return false;
      const start = new Date(p.start);
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 2);
      return start < cutoff;
    };

    const isLateProject = (p: Project): boolean => {
      if (p.done || !p.deadline) return false;
      return new Date(p.deadline) < new Date(new Date().toDateString());
    };

    const hasInvoices = (p: Project): boolean => {
      if (invoices && invoices.length > 0) {
        const has = invoices.some(
          (inv) =>
            (inv.projectId && inv.projectId === p.id) ||
            (!inv.projectId && inv.projectName && inv.projectName.trim().toLowerCase() === p.name.trim().toLowerCase())
        );
        if (has) return true;
      }
      if (p.invoices && p.invoices.length > 0) return true;
      return false;
    };

    return projects
      .filter((p) => {
        if (quickFilters.includes('my') && currentUser) {
          const isMyName =
            p.responsible &&
            currentUser.name &&
            p.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
          const isMyId = (p as any).responsibleId && (p as any).responsibleId === currentUser.id;
          if (!isMyName && !isMyId) return false;
        }
        if (quickFilters.includes('active') && p.done) return false;
        if (quickFilters.includes('missing_invoice') && hasInvoices(p)) return false;
        if (quickFilters.includes('stale') && (!isStaleProject(p) || p.done)) return false;
        if (quickFilters.includes('overdue') && (!isLateProject(p) || p.done)) return false;
        if (quickFilters.includes('done') && !p.done) return false;

        if (filterCategory !== 'all' && p.type !== filterCategory) return false;
        if (filterClient !== 'all' && p.clientName !== filterClient) return false;
        if (filterResponsible !== 'all') {
          const isMyName =
            currentUser?.name &&
            filterResponsible === currentUser.name &&
            ((p.responsible &&
              currentUser.name &&
              p.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
              ((p as any).responsibleId && (p as any).responsibleId === currentUser.id));
          if (!isMyName && p.responsible !== filterResponsible) return false;
        }
        if (filterStatus !== 'all') {
          const stale = isStaleProject(p);
          const late = isLateProject(p);
          if (filterStatus === 'done' && !p.done) return false;
          if (filterStatus === 'overdue' && (!late || p.done)) return false;
          if (filterStatus === 'stale' && (!stale || p.done)) return false;
          if (filterStatus === 'creation' && (p.done || stale || late)) return false;
        }

        // Date range filter
        if (filterDateFrom || filterDateTo) {
          let rawDate: string | null | undefined = null;
          if (filterDateField === 'start') {
            rawDate = p.start;
          } else if (filterDateField === 'createdAt') {
            rawDate = p.createdAt;
          } else {
            rawDate = p.deadline;
          }
          const dateVal = rawDate ? rawDate.slice(0, 10) : '';
          if (dateVal) {
            if (filterDateFrom && dateVal < filterDateFrom) return false;
            if (filterDateTo && dateVal > filterDateTo) return false;
          } else {
            return false;
          }
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesClient = p.clientName && p.clientName.toLowerCase().includes(q);
          const matchesResp = p.responsible && p.responsible.toLowerCase().includes(q);
          const matchesCat = getServiceLabel(p.type, services).toLowerCase().includes(q);
          if (!matchesName && !matchesClient && !matchesResp && !matchesCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let res = 0;
        switch (sortOption) {
          case 'name':
            res = a.name.localeCompare(b.name);
            break;
          case 'deadline': {
            const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity;
            const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity;
            res = aTime - bTime;
            break;
          }
          case 'start': {
            const aStart = a.start ? new Date(a.start).getTime() : 0;
            const bStart = b.start ? new Date(b.start).getTime() : 0;
            res = aStart - bStart;
            break;
          }
          case 'progress':
            res = a.progress - b.progress;
            break;
          case 'createdAt': {
            const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            res = aCreated - bCreated;
            break;
          }
          default:
            res = 0;
        }
        return sortDirection === 'asc' ? res : -res;
      });
  }, [projects, invoices, quickFilters, currentUser, filterCategory, filterClient, filterResponsible, filterStatus, filterDateFrom, filterDateTo, filterDateField, searchQuery, getServiceLabel, sortOption, sortDirection]);

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
      reminders={reminders}
      clients={clients}
      users={users}
      onMarkSampled={onMarkSampled}
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
      onStatusChangeInvoice={onStatusChangeInvoice}
      onViewProject={onViewProject || onEditProject}
      onNavigateToInvoices={onNavigateToInvoices}
      rowsPerPageOptions={invoicesRowsPerPageOptions}
      onRowsPerPageOptionsChange={onInvoicesRowsPerPageOptionsChange}
      rowsPerPage={invoicesRowsPerPage}
      onRowsPerPageChange={onInvoicesRowsPerPageChange}
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
            <StatisticsCharts
              projects={projects}
              clients={clients}
              users={users}
              categories={categories}
              services={services}
              invoices={invoices}
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
              <Chip label={(reminders || []).length} size="small" color="primary" sx={{ fontWeight: 700 }} />
            </Box>
            {onSaveReminder && (
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
            {onSaveInvoice && (
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

      {/* PROJECTS SUBTAB VIEW */}
      {dashboardSubTab === 'projects' && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* TITLE HEADER */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('subTabProjects')}
              </Typography>
              <Chip label={filteredDashboardProjects.length} size="small" color="primary" sx={{ fontWeight: 700 }} />
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
              {/* SEARCH FIELD */}
              <TableSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
              />

              {/* QUICK FILTER CHECKBOXES */}
              <FormGroup row sx={{ gap: 1, alignItems: 'center' }}>
                {!isAccountant && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={quickFilters.includes('my')}
                        onChange={(e) => handleToggleFilter('my', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t('quickFilterMyProjects')}
                      </Typography>
                    }
                  />
                )}
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={quickFilters.includes('active')}
                      onChange={(e) => handleToggleFilter('active', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('quickFilterActive')}
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={quickFilters.includes('missing_invoice')}
                      onChange={(e) => handleToggleFilter('missing_invoice', e.target.checked)}
                      color="warning"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('quickFilterMissingInvoice')}
                    </Typography>
                  }
                />
                {!isAccountant && (
                  <>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={quickFilters.includes('stale')}
                          onChange={(e) => handleToggleFilter('stale', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {t('statStale')}
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={quickFilters.includes('overdue')}
                          onChange={(e) => handleToggleFilter('overdue', e.target.checked)}
                          color="error"
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                          {t('statOverdueUrgent')}
                        </Typography>
                      }
                    />
                  </>
                )}
              </FormGroup>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {/* POPOVER FILTERS */}
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
          {filteredDashboardProjects.length > 0 ? (
            <Grid container spacing={2}>
              {filteredDashboardProjects.map((p) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
                  <ProjectCard
                    project={p}
                    services={services}
                    reminders={reminders}
                    invoices={invoices}
                    onToggleDone={onToggleDone}
                    onMarkSampled={onMarkSampled}
                    onView={onViewProject || onEditProject}
                    onEdit={onEditProject}
                    onDelete={onDeleteProject}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('emptyProjects')}</Typography>
            </Paper>
          )}
        </Box>
      )}


    </Stack>
  );
};


export default DashboardView;
