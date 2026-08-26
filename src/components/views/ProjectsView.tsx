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
  InputAdornment,
  Autocomplete,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import NotesIcon from '@mui/icons-material/Notes';
import type { Project, Service } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ColumnSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';

interface Props {
  projects: Project[];
  services?: Service[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNew: () => void;
  onToggleDone?: (id: string) => void;
  onMarkSampled?: (id: string) => void;
  onView?: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  sortState?: { field: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  quickFilter?: 'all' | 'my' | 'active' | 'overdue';
  onQuickFilterChange?: (val: 'all' | 'my' | 'active' | 'overdue') => void;
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

export const ProjectsView: React.FC<Props> = ({
  projects,
  services = [],
  searchQuery,
  onSearchChange,
  onOpenNew,
  onView,
  onEdit,
  onDelete,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  sortState,
  onSortChange,
  quickFilter: quickFilterProp,
  onQuickFilterChange,
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { canEditProject, currentUser } = useAuth();
  const [localColumns, setLocalColumns] = useState<string[]>(visibleColumns);

  const [sortColumn, setSortColumn] = useState<string>(sortState?.field || 'createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(sortState?.direction || 'desc');

  useEffect(() => {
    if (sortState) {
      setSortColumn(sortState.field || 'createdAt');
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

  // Quick Filter state ('all' | 'my' | 'active' | 'overdue')
  const [quickFilter, setQuickFilter] = useState<'all' | 'my' | 'active' | 'overdue'>(
    quickFilterProp || 'all'
  );

  // Popover Filter states
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');

  useEffect(() => {
    if (quickFilterProp !== undefined) {
      setQuickFilter(quickFilterProp);
      if (quickFilterProp === 'my' && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      } else if (quickFilterProp === 'overdue') {
        setFilterStatus('overdue');
      } else if (quickFilterProp === 'all') {
        if (currentUser?.name && filterResponsible === currentUser.name) {
          setFilterResponsible('all');
        }
        if (filterStatus === 'overdue') {
          setFilterStatus('all');
        }
      }
    }
  }, [quickFilterProp, currentUser?.name]);

  const handleQuickFilterChange = (val: 'all' | 'my' | 'active' | 'overdue') => {
    setQuickFilter(val);
    onQuickFilterChange?.(val);
    if (val === 'my') {
      if (currentUser?.name) setFilterResponsible(currentUser.name);
      if (filterStatus === 'overdue') setFilterStatus('all');
    } else if (val === 'overdue') {
      setFilterStatus('overdue');
      if (currentUser?.name && filterResponsible === currentUser.name) setFilterResponsible('all');
    } else if (val === 'all') {
      if (currentUser?.name && filterResponsible === currentUser.name) setFilterResponsible('all');
      if (filterStatus === 'overdue') setFilterStatus('all');
    } else if (val === 'active') {
      if (currentUser?.name && filterResponsible === currentUser.name) setFilterResponsible('all');
      if (filterStatus === 'overdue') setFilterStatus('all');
    }
  };

  const handleFilterResponsibleChange = (val: string) => {
    setFilterResponsible(val);
    if (currentUser?.name && val === currentUser.name) {
      if (quickFilter !== 'active' && quickFilter !== 'overdue') {
        setQuickFilter('my');
        onQuickFilterChange?.('my');
      }
    } else if (quickFilter === 'my') {
      setQuickFilter('all');
      onQuickFilterChange?.('all');
    }
  };

  const handleFilterStatusChange = (val: string) => {
    setFilterStatus(val);
    if (val === 'overdue') {
      setQuickFilter('overdue');
      onQuickFilterChange?.('overdue');
    } else if (quickFilter === 'overdue') {
      setQuickFilter('all');
      onQuickFilterChange?.('all');
    }
  };

  const activeFilterCount =
    (quickFilter === 'active' ? 1 : 0) +
    (filterCategory !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterResponsible !== 'all' ? 1 : 0) +
    (sortColumn !== 'createdAt' || sortDirection !== 'desc' ? 1 : 0);

  const clearFilters = () => {
    setQuickFilter('all');
    onQuickFilterChange?.('all');
    setFilterCategory('all');
    setFilterClient('all');
    setFilterStatus('all');
    setFilterResponsible('all');
    setSortColumn('createdAt');
    setSortDirection('desc');
    if (onSortChange) {
      onSortChange({ field: 'createdAt', direction: 'desc' });
    }
  };

  const activeCols = onVisibleColumnsChange ? visibleColumns : localColumns;
  const setCols = (cols: string[]) => {
    setLocalColumns(cols);
    if (onVisibleColumnsChange) onVisibleColumnsChange(cols);
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

  const uniqueCategories = Array.from(new Set(projects.map((p) => p.type).filter(Boolean)));
  const uniqueClients = Array.from(new Set(projects.map((p) => p.clientName).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const otherResponsibles = Array.from(
    new Set(projects.map((p) => p.responsible).filter(Boolean) as string[])
  )
    .filter((r) => !currentUser?.name || r.trim().toLowerCase() !== currentUser.name.trim().toLowerCase())
    .sort((a, b) => a.localeCompare(b));

  // 1. Apply Quick & Popover Filters
  const filteredProjects = projects.filter((p) => {
    if (quickFilter === 'my' && currentUser) {
      const isMyName =
        p.responsible &&
        currentUser.name &&
        p.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
      const isMyId = (p as any).responsibleId && (p as any).responsibleId === currentUser.id;
      if (!isMyName && !isMyId) return false;
    }
    if (quickFilter === 'active' && p.done) return false;
    if (quickFilter === 'overdue' && (!isLate(p.deadline, p.done) || p.done)) return false;

    if (filterCategory !== 'all' && p.type !== filterCategory) return false;
    if (filterClient !== 'all' && p.clientName !== filterClient) return false;
    if (filterResponsible !== 'all') {
      const isMyName =
        currentUser?.name &&
        filterResponsible === currentUser.name &&
        ((p.responsible && currentUser.name && p.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
          ((p as any).responsibleId && (p as any).responsibleId === currentUser.id));
      if (!isMyName && p.responsible !== filterResponsible) return false;
    }
    if (filterStatus !== 'all') {
      const stale = isStale(p.start, p.done);
      const late = isLate(p.deadline, p.done);
      if (filterStatus === 'done' && !p.done) return false;
      if (filterStatus === 'overdue' && (!late || p.done)) return false;
      if (filterStatus === 'stale' && (!stale || p.done)) return false;
      if (filterStatus === 'creation' && (p.done || stale || late)) return false;
    }
    return true;
  });

  // 2. Search among filtered items
  const searchedProjects = filteredProjects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.clientName && p.clientName.toLowerCase().includes(q)) ||
      (p.responsible && p.responsible.toLowerCase().includes(q)) ||
      getServiceLabel(p.type, services).toLowerCase().includes(q)
    );
  });

  // 3. Sort final dataset
  const sortedProjects = [...searchedProjects].sort((a, b) => {
    let res = 0;
    switch (sortColumn) {
      case 'name':
        res = a.name.localeCompare(b.name);
        break;
      case 'client':
        res = (a.clientName || '').localeCompare(b.clientName || '');
        break;
      case 'category':
        res = getServiceLabel(a.type, services).localeCompare(getServiceLabel(b.type, services));
        break;
      case 'responsible':
        res = (a.responsible || '').localeCompare(b.responsible || '');
        break;
      case 'progress':
        res = a.progress - b.progress;
        break;
      case 'start':
        res =
          (a.start ? new Date(a.start).getTime() : 0) -
          (b.start ? new Date(b.start).getTime() : 0);
        break;
      case 'deadline':
        res =
          (a.deadline ? new Date(a.deadline).getTime() : 0) -
          (b.deadline ? new Date(b.deadline).getTime() : 0);
        break;
      case 'status': {
        const lateA = isLate(a.deadline, a.done);
        const lateB = isLate(b.deadline, b.done);
        const valA = a.done ? 3 : lateA ? 0 : isStale(a.start, a.done) ? 2 : 1;
        const valB = b.done ? 3 : lateB ? 0 : isStale(b.start, b.done) ? 2 : 1;
        res = valA - valB;
        break;
      }
      case 'createdAt':
        res =
          (a.createdAt ? new Date(a.createdAt).getTime() : 0) -
          (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        break;
      default:
        res = 0;
    }
    return sortDirection === 'asc' ? res : -res;
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, quickFilter, filterCategory, filterStatus, filterResponsible, sortColumn, sortDirection]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedProjects = sortedProjects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const responsibleOptions = useMemo(() => {
    const list: string[] = [];
    if (currentUser?.name) list.push(currentUser.name);
    list.push(...otherResponsibles);
    return list;
  }, [currentUser?.name, otherResponsibles]);

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

      {/* TABLE CONTAINER CARD */}
      <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('projectsListTitle')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            {/* QUICK FILTERS */}
            <ToggleButtonGroup
              value={quickFilter}
              exclusive
              onChange={(_, val) => val && handleQuickFilterChange(val)}
              size="small"
              color="primary"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <ToggleButton value="all" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>
                {t('quickFilterAll')}
              </ToggleButton>
              <ToggleButton value="my" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>
                {t('quickFilterMyProjects')}
              </ToggleButton>
              <ToggleButton value="active" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>
                {t('quickFilterActive')}
              </ToggleButton>
              <ToggleButton value="overdue" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600, color: 'error.main' }}>
                {t('quickFilterOverdue')}
              </ToggleButton>
            </ToggleButtonGroup>

            {/* SEARCH FIELD */}
            <TextField
              size="small"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: '100%', sm: 220 } }}
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

            {/* COLUMN SELECTOR */}
            <ColumnSelector
              columns={columnDefs}
              visibleColumns={activeCols}
              onChange={setCols}
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
              {sortedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + 1} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('emptyProjects')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProjects.map((p) => {
                  const stale = isStale(p.start, p.done);
                  const editable = canEditProject(p);

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
                        <TableCell>{getServiceLabel(p.type, services)}</TableCell>
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
                          {p.notes ? (
                            <Tooltip
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
                                  dangerouslySetInnerHTML={{ __html: p.notes }}
                                />
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
                                  {p.notes.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim() || t('viewProjectNotes')}
                                </Typography>
                              </Box>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title={t('btnView')}>
                            <IconButton size="small" color="primary" onClick={() => (onView ? onView(p) : onEdit(p))}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {editable && (
                            <>
                              <Tooltip title={t('btnEdit')}>
                                <IconButton size="small" color="info" onClick={() => onEdit(p)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('btnDelete')}>
                                <IconButton size="small" color="error" onClick={() => onDelete(p.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
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
          rowsPerPageOptions={[15, 25, 50]}
          component="div"
          count={sortedProjects.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>
    </Box>
  );
};
