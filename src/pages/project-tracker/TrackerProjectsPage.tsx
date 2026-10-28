import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Grid,
  Card,
  Typography,
  Button,
  Box,
  Stack,
  Paper,
  TextField,
  Autocomplete,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';

import type { Project } from '../../types';
import { ConfirmDialog } from '../../components/common/dialogs/ConfirmDialog';
import { ProjectCard } from '../../components/project/ProjectCard';
import { TableFilterSelector } from '../../components/common/TableFilterSelector';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { TableQuickFilters, type QuickFilterItem } from '../../components/common/TableQuickFilters';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';
import { ArrowUpwardIcon, ArrowDownwardIcon, RefreshIcon } from '../../components/icons';
import {
  ClientAutocomplete,
  UserAutocomplete,
  ServiceAutocomplete,
} from '../../components/common/autocomplete';
import {
  useInfiniteProjectsQuery,
  useServicesQuery,
  useRemindersQuery,
  useInvoicesQuery,
  useProjectsMutations,
  useTablePreferences,
} from '../../queries';
import { useDebounce } from '../../hooks/useDebounce';

export interface TrackerProjectsPageProps {
  onViewProject?: (project: Project, diffRange?: { dateFrom: string; dateTo: string } | null) => void;
  onEditProject?: (project: Project) => void;
}

export const TrackerProjectsPage: React.FC<TrackerProjectsPageProps> = ({
  onViewProject,
  onEditProject,
}) => {
  const { t } = useLanguage();
  const { currentUser, isRestrictedToOwn } = useAuth();
  const isProjectsRestricted = isRestrictedToOwn('projects') || isRestrictedToOwn('tracker_projects');
  const { withLoading } = useLoading();

  const {
    sortState,
    onSortChange,
    quickFilters: savedQuickFilters,
    onQuickFiltersChange,
  } = useTablePreferences('tracker_projects');

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({
    open: false,
    message: '',
    onConfirm: () => {},
  });

  const { handleDelete, toggleDoneMutation } = useProjectsMutations();
  const wrappedOnDelete = (id: string) => {
    handleDelete(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));
  };

  const { data: services = [] } = useServicesQuery();
  const { data: reminders = [] } = useRemindersQuery();
  const { data: invoices = [] } = useInvoicesQuery();

  const [quickFilters, setQuickFilters] = useState<string[]>(() => {
    if (savedQuickFilters && Array.isArray(savedQuickFilters)) {
      return isProjectsRestricted ? savedQuickFilters.filter((k: string) => k !== 'my') : savedQuickFilters;
    }
    return isProjectsRestricted ? ['active'] : ['my', 'active'];
  });

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('deadline');

  const [sortOption, setSortOption] = useState<'deadline' | 'name' | 'start' | 'progress' | 'createdAt'>(() => {
    return (sortState?.field as any) || 'deadline';
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    return sortState?.direction || 'asc';
  });

  const handleSortOptionChange = (newField: 'deadline' | 'name' | 'start' | 'progress' | 'createdAt') => {
    setSortOption(newField);
    onSortChange({ field: newField, direction: sortDirection });
  };

  const handleSortDirectionToggle = () => {
    const nextDir = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(nextDir);
    onSortChange({ field: sortOption, direction: nextDir });
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
    true
  );

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInfiniteLoading,
    refetch: refetchInfiniteProjects,
    isRefetching: isRefetchingProjects,
  } = infiniteProjectsQuery;

  const infiniteProjects = useMemo(() => {
    if (!infiniteData?.pages) return [];
    return infiniteData.pages.flatMap((page) => page.items);
  }, [infiniteData?.pages]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const observerSentinelCallback = useCallback(
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

  const handleToggleFilter = (filterKey: string, checked: boolean) => {
    const updated = checked
      ? [...quickFilters, filterKey]
      : quickFilters.filter((k) => k !== filterKey);
    setQuickFilters(updated);
    onQuickFiltersChange(updated);

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
      onQuickFiltersChange(newKeys);
    }
  };

  const handleFilterResponsibleChange = (val: string) => {
    setFilterResponsible(val);
    if (currentUser?.name && val === currentUser.name) {
      if (!quickFilters.includes('my')) {
        const updated = [...quickFilters, 'my'];
        setQuickFilters(updated);
        onQuickFiltersChange(updated);
      }
    } else if (quickFilters.includes('my')) {
      const updated = quickFilters.filter((k) => k !== 'my');
      setQuickFilters(updated);
      onQuickFiltersChange(updated);
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
    onQuickFiltersChange(updated);
  };

  const handleClearAllFilters = () => {
    setQuickFilters([]);
    onQuickFiltersChange([]);
    setFilterCategory('all');
    setFilterClient('all');
    setFilterResponsible('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('deadline');
    setSearchQuery('');
  };

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

  return (
    <Stack spacing={2} sx={{ width: '100%', py: 1 }}>
      {/* FILTERS BAR ON TOP */}
      <Card variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: { xs: 'stretch', lg: 'center' }, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <TableQuickFilters
              options={projectQuickFilterOptions}
              selectedKeys={quickFilters}
              onChange={handleQuickFiltersChange}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <TableSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
            />

            <Tooltip title={t('btnRefresh') || 'Refresh'}>
              <span>
                <IconButton
                  onClick={() => withLoading(async () => {
                    await refetchInfiniteProjects();
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
                  <ServiceAutocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    value={filterCategory === 'all' ? null : filterCategory}
                    valueMode="code"
                    onChange={(val) => setFilterCategory(val || 'all')}
                    label={t('colService')}
                  />

                  <ClientAutocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    value={filterClient === 'all' ? null : filterClient}
                    valueMode="name"
                    onChange={(val) => setFilterClient(val || 'all')}
                    label={t('colClient')}
                  />

                  <UserAutocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    value={filterResponsible === 'all' ? null : filterResponsible}
                    valueMode="name"
                    restrictedPermission="projects"
                    onChange={(val) => handleFilterResponsibleChange(val || 'all')}
                    label={t('colResponsible')}
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

      {/* ALL PROJECTS CARDS */}
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

export default TrackerProjectsPage;
