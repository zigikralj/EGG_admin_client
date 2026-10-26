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
  Chip,
  IconButton,
  Box,
  Typography,
  Autocomplete,
  Tooltip,
  CircularProgress,
} from '@mui/material';








import type { Project, TableViewProps } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { stripHtmlToText } from '../../components/common/RichTextEditor';
import { TableOptionsSelector, type ColumnDef } from '../../components/common/ColumnSelector';
import { TableFilterSelector } from '../../components/common/TableFilterSelector';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { TableQuickFilters, type QuickFilterItem } from '../../components/common/TableQuickFilters';
import { useTableView } from '../../hooks/useTableView';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  VisibilityIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  RefreshIcon,
  NotesIcon,
  HistoryIcon,
} from '../../components/icons';
import { HistoryTimelineModal } from '../../components/history';

interface Props extends TableViewProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNew: () => void;
  onView?: (project: Project) => void;
  onEdit: (project: Project) => void;
  quickFilters?: string[];
  onQuickFiltersChange?: (val: string[]) => void;
  quickFilter?: any;
  onQuickFilterChange?: (val: any) => void;
}

const DEFAULT_COLUMNS = ['name', 'client', 'category', 'responsible', 'start', 'deadline', 'progress', 'status'];

function isStale(startStr: string | null, done: boolean): boolean {
  if (done || !startStr) return false;
  const start = new Date(startStr);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 2);
  return start < cutoff;
}

function isLate(deadlineStr: string | null, done: boolean): boolean {
  if (done || !deadlineStr) return false;
  return new Date(deadlineStr) < new Date(new Date().toDateString());
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  const [y, m, day] = parts;
  return `${day}.${m}.${y}.`;
}

import {
  usePaginatedProjectsQuery,
  useProjectsMutations,
  useProjectDetailsQuery,
} from '../../queries';
import {
  ClientAutocomplete,
  ServiceAutocomplete,
  UserAutocomplete,
} from '../../components/common/autocomplete';
import { useDebounce } from '../../hooks/useDebounce';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';

interface ProjectNotesTableCellProps {
  project: Project;
  onView?: (p: Project) => void;
  onEdit: (p: Project) => void;
}

const ProjectNotesTableCell: React.FC<ProjectNotesTableCellProps> = ({ project: p, onView, onEdit }) => {
  const { t } = useLanguage();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const hasNotes = Boolean(
    (p.notesPreview && p.notesPreview.trim().length > 0) ||
    (p.notes && stripHtmlToText(p.notes).length > 0)
  );

  const { data: details, isLoading } = useProjectDetailsQuery(
    p.id,
    isTooltipOpen
  );

  if (!hasNotes) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  }

  const displayText = p.notesPreview || (p.notes ? stripHtmlToText(p.notes) : '') || t('viewProjectNotes');
  const fullHtml = details?.notes || p.notes || null;

  return (
    <Tooltip
      open={isTooltipOpen}
      onOpen={() => setIsTooltipOpen(true)}
      onClose={() => setIsTooltipOpen(false)}
      title={
        <Box
          sx={{
            p: 0.5,
            maxHeight: 250,
            maxWidth: 320,
            overflowY: 'auto',
            fontSize: '0.8rem',
            '& p': { m: 0, mb: 0.5 },
            '& ul, & ol': { m: 0, pl: 2 },
            '& blockquote': { m: 0, pl: 1, borderLeft: '2px solid white' },
          }}
        >
          {isLoading && !fullHtml ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
              <CircularProgress size={16} color="inherit" />
            </Box>
          ) : (
            <Box dangerouslySetInnerHTML={{ __html: fullHtml || p.notesPreview || '' }} />
          )}
        </Box>
      }
      arrow
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          cursor: 'pointer',
          color: 'primary.main',
          fontWeight: 500,
        }}
        onClick={() => (onView ? onView(p) : onEdit(p))}
      >
        <NotesIcon fontSize="small" sx={{ flexShrink: 0 }} />
        <Typography
          variant="caption"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 160,
            color: 'text.primary',
          }}
        >
          {displayText}
        </Typography>
      </Box>
    </Tooltip>
  );
};

const ProjectsPage: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onOpenNew,
  onView,
  onEdit,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  sortState,
  onSortChange,
  quickFilters: quickFiltersProp,
  onQuickFiltersChange,
  quickFilter: quickFilterProp,
  onQuickFilterChange,
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { canEditProject, canDeleteProject, hasPermission, currentUser, isRestrictedToOwn } = useAuth();
  const isProjectsRestricted = isRestrictedToOwn('projects') || isRestrictedToOwn('tracker_projects');
  const canCreateProject = hasPermission('projects', 'create') || hasPermission('tracker_projects', 'create');
  const canViewHistory = hasPermission('history', 'view');

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterDateField, setFilterDateField] = useState<string>('deadline');

  const { handleDelete } = useProjectsMutations();
  const [completeConfirmState, setCompleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const [historyModalState, setHistoryModalState] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });

  const onDelete = (id: string) => handleDelete(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));

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
    handleRefresh,
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
    onRefresh: () => { refetchProjects(); },
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
  });



  // Quick Filter state
  const [quickFilters, setQuickFilters] = useState<string[]>(() => {
    let initial: string[] = [];
    if (Array.isArray(quickFiltersProp)) initial = quickFiltersProp;
    else if (typeof quickFilterProp === 'string' && quickFilterProp !== 'all') initial = [quickFilterProp];
    return isProjectsRestricted ? initial.filter((k) => k !== 'my') : initial;
  });



  useEffect(() => {
    if (Array.isArray(quickFiltersProp)) {
      setQuickFilters(isProjectsRestricted ? quickFiltersProp.filter((k) => k !== 'my') : quickFiltersProp);
    } else if (typeof quickFilterProp === 'string') {
      const initial = quickFilterProp === 'all' ? [] : [quickFilterProp];
      setQuickFilters(isProjectsRestricted ? initial.filter((k) => k !== 'my') : initial);
    }
  }, [quickFiltersProp, quickFilterProp, isProjectsRestricted]);

  useEffect(() => {
    if (isProjectsRestricted) {
      setQuickFilters((prev) => prev.filter((k) => k !== 'my'));
    }
  }, [isProjectsRestricted]);

  const handleToggleFilter = (filterKey: string, checked: boolean) => {
    const updated = checked
      ? [...quickFilters, filterKey]
      : quickFilters.filter((k) => k !== filterKey);
    setQuickFilters(updated);
    onQuickFiltersChange?.(updated);
    onQuickFilterChange?.(updated[0] || 'all');

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
      onQuickFilterChange?.(newKeys[0] || 'all');
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
    const statusKeys = ['overdue', 'stale'];
    const updated = quickFilters.filter((k) => !statusKeys.includes(k));
    if (statusKeys.includes(val)) {
      updated.push(val);
    }
    setQuickFilters(updated);
    onQuickFiltersChange?.(updated);
  };

  const activeFilterCount =
    quickFilters.length +
    (filterCategory !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterResponsible !== 'all' ? 1 : 0) +
    (filterDateFrom || filterDateTo ? 1 : 0) +
    (sortColumn !== 'createdAt' || sortDirection !== 'desc' ? 1 : 0);

  const clearFilters = () => {
    setQuickFilters([]);
    onQuickFiltersChange?.([]);
    onQuickFilterChange?.('all');
    setFilterCategory('all');
    setFilterClient('all');
    setFilterStatus('all');
    setFilterResponsible('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('deadline');
    resetSort();
  };

  const columnDefs: ColumnDef[] = [
    { id: 'name', label: t('colProject') },
    { id: 'client', label: t('colClient') },
    { id: 'category', label: t('colService') },
    { id: 'responsible', label: t('colResponsible') },
    { id: 'start', label: t('start') },
    { id: 'deadline', label: t('deadline') },
    { id: 'progress', label: t('progress') },
    { id: 'status', label: t('colDeadlineStatus') },
    { id: 'notes', label: t('lblProjectNotes') },
  ];

  const debouncedSearch = useDebounce(searchQuery, 500);

  const statusParam = useMemo(() => {
    if (filterStatus !== 'all') return filterStatus;
    if (quickFilters.includes('overdue')) return 'overdue';
    if (quickFilters.includes('stale')) return 'stale';
    if (quickFilters.includes('active')) return 'active';
    if (quickFilters.includes('done')) return 'done';
    if (quickFilters.includes('missing_invoice')) return 'missing_invoice';
    return undefined;
  }, [filterStatus, quickFilters]);

  const responsibleParam = useMemo(() => {
    if (quickFilters.includes('my') && currentUser?.name) return currentUser.name;
    if (filterResponsible !== 'all') return filterResponsible;
    return undefined;
  }, [quickFilters, currentUser, filterResponsible]);

  const {
    data: paginatedData,
    refetch: refetchProjects,
    isRefetching,
  } = usePaginatedProjectsQuery({
    page,
    rowsPerPage: activeRowsPerPage,
    sortBy: sortColumn,
    sortOrder: sortDirection,
    search: debouncedSearch,
    status: statusParam,
    type: filterCategory !== 'all' ? filterCategory : undefined,
    clientName: filterClient !== 'all' ? filterClient : undefined,
    responsible: responsibleParam,
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
    dateField: filterDateField,
  });

  const projects = paginatedData?.items || [];
  const totalProjects = paginatedData?.total || 0;

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, quickFilters, filterCategory, filterClient, filterStatus, filterResponsible, filterDateFrom, filterDateTo, filterDateField, sortColumn, sortDirection, setPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

  const sortOptions = useMemo(() => [
    { value: 'name', label: t('colProject') },
    { value: 'client', label: t('colClient') },
    { value: 'category', label: t('colService') },
    { value: 'responsible', label: t('colResponsible') },
    { value: 'progress', label: t('progress') },
    { value: 'start', label: t('start') },
    { value: 'deadline', label: t('deadline') },
    { value: 'status', label: t('colDeadlineStatus') },
    { value: 'createdAt', label: t('lblCreatedDate') },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: 'creation', label: t('statInCreation') },
    { value: 'overdue', label: t('statOverdueUrgent') },
    { value: 'stale', label: t('statStale') },
    { value: 'done', label: t('statDone') },
  ], [t]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', flex: 1, minHeight: 0 }}>
      {/* TOP ACTION BAR */}
      {canCreateProject && (
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onOpenNew}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {t('btnNewProject')}
          </Button>
        </Box>
      )}

      {/* TABLE CONTAINER CARD */}
      <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('projectsListTitle')}
            </Typography>
            <Tooltip title={t('btnRefresh')}>
              <span>
                <IconButton
                  size="small"
                  onClick={handleRefresh}
                  disabled={isRefetching}
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
                      animation: isRefetching ? 'spin 1s linear infinite' : undefined,
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            {/* QUICK FILTERS */}
            <TableQuickFilters
              options={projectQuickFilterOptions}
              selectedKeys={quickFilters}
              onChange={handleQuickFiltersChange}
            />

            {/* SEARCH FIELD */}
            <TableSearchInput
              value={searchQuery}
              onChange={onSearchChange}
            />

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
          <Table stickyHeader sx={{ width: '100%', minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {activeCols.includes('name') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'name'}
                      direction={sortColumn === 'name' ? sortDirection : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      {t('colProject')}
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
                {activeCols.includes('category') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'category'}
                      direction={sortColumn === 'category' ? sortDirection : 'asc'}
                      onClick={() => handleSort('category')}
                    >
                      {t('colService')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('responsible') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'responsible'}
                      direction={sortColumn === 'responsible' ? sortDirection : 'asc'}
                      onClick={() => handleSort('responsible')}
                    >
                      {t('colResponsible')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('progress') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'progress'}
                      direction={sortColumn === 'progress' ? sortDirection : 'asc'}
                      onClick={() => handleSort('progress')}
                    >
                      {t('progress')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('start') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'start'}
                      direction={sortColumn === 'start' ? sortDirection : 'asc'}
                      onClick={() => handleSort('start')}
                    >
                      {t('start')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('deadline') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'deadline'}
                      direction={sortColumn === 'deadline' ? sortDirection : 'asc'}
                      onClick={() => handleSort('deadline')}
                    >
                      {t('deadline')}
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
                      {t('colDeadlineStatus')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('notes') && (
                  <TableCell>{t('lblProjectNotes')}</TableCell>
                )}
                <TableCell align="right">{t('colActions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + 1} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('emptyProjects')}
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((p) => {
                  const stale = isStale(p.start, p.done);
                  const editable = canEditProject(p);
                  const deletable = canDeleteProject(p);

                  return (
                    <TableRow key={p.id} hover>
                      {activeCols.includes('name') && (
                        <TableCell>
                          <Typography
                            variant="subtitle2"
                            onClick={() => (onView ? onView(p) : onEdit(p))}
                            sx={{
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: 'text.primary',
                              transition: 'color 0.15s ease',
                              '&:hover': {
                                color: 'primary.main',
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {p.name}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('client') && (
                        <TableCell>{p.clientName || '—'}</TableCell>
                      )}
                      {activeCols.includes('category') && (
                        <TableCell>{p.serviceName || getServiceLabel(p.type)}</TableCell>
                      )}
                      {activeCols.includes('responsible') && (
                        <TableCell>{p.responsible || '—'}</TableCell>
                      )}
                      {activeCols.includes('progress') && (
                        <TableCell>{p.progress}%</TableCell>
                      )}
                      {activeCols.includes('start') && (
                        <TableCell>{fmtDate(p.start)}</TableCell>
                      )}
                      {activeCols.includes('deadline') && (
                        <TableCell>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{
                              fontWeight: isLate(p.deadline, p.done) ? 700 : 'normal',
                              color: isLate(p.deadline, p.done) ? 'error.main' : 'inherit',
                            }}
                          >
                            {fmtDate(p.deadline)}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('status') && (
                        <TableCell>
                          {p.done ? (
                            <Chip label={t('statDone')} size="small" color="info" />
                          ) : isLate(p.deadline, p.done) ? (
                            <Chip label={t('statOverdueUrgent')} size="small" color="error" />
                          ) : stale ? (
                            <Chip label={t('staleFlag')} size="small" color="warning" />
                          ) : (
                            <Chip label={t('statInCreation')} size="small" color="success" variant="outlined" />
                          )}
                        </TableCell>
                      )}
                      {activeCols.includes('notes') && (
                        <TableCell sx={{ maxWidth: 220 }}>
                          <ProjectNotesTableCell project={p} onView={onView} onEdit={onEdit} />
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {canViewHistory && (
                            <Tooltip title={t('historyModalTitle')}>
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => setHistoryModalState({ open: true, project: p })}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={t('btnView')}>
                            <IconButton size="small" color="primary" onClick={() => (onView ? onView(p) : onEdit(p))}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {editable && (
                            <Tooltip title={t('btnEdit')}>
                              <IconButton size="small" color="info" onClick={() => onEdit(p)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {deletable && (
                            <Tooltip title={t('btnDelete')}>
                              <IconButton size="small" color="error" onClick={() => onDelete(p.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
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
          count={totalProjects}
          rowsPerPage={activeRowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      <ConfirmDialog
        open={completeConfirmState.open}
        title={t('confirmCompleteTitle')}
        message={completeConfirmState.message}
        confirmLabel={t('btnConfirm')}
        confirmColor="success"
        iconType="success"
        onConfirm={() => {
          completeConfirmState.onConfirm();
          setCompleteConfirmState(prev => ({ ...prev, open: false }));
        }}
        onClose={() => setCompleteConfirmState(prev => ({ ...prev, open: false }))}
      />
      <ConfirmDialog
        open={deleteConfirmState.open}
        title={t('confirmDeleteTitle')}
        message={deleteConfirmState.message}
        confirmLabel={t('btnDelete')}
        confirmColor="warning"
        iconType="warning"
        onConfirm={() => {
          deleteConfirmState.onConfirm();
          setDeleteConfirmState(prev => ({ ...prev, open: false }));
        }}
        onClose={() => setDeleteConfirmState(prev => ({ ...prev, open: false }))}
      />

      {historyModalState.project && (
        <HistoryTimelineModal
          open={historyModalState.open}
          onClose={() => setHistoryModalState({ open: false, project: null })}
          entityType="Project"
          entityId={historyModalState.project.id}
          entityTitle={historyModalState.project.name}
          onRestored={() => {
            refetchProjects();
          }}
        />
      )}
    </Box>
  );
};

export default ProjectsPage;
