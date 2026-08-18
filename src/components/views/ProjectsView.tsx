import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
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
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  sortState?: { field: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
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
  onEdit,
  onDelete,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  sortState,
  onSortChange,
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
  const [quickFilter, setQuickFilter] = useState<'all' | 'my' | 'active' | 'overdue'>('all');

  // Popover Filter states
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');

  const handleQuickFilterChange = (val: 'all' | 'my' | 'active' | 'overdue') => {
    setQuickFilter(val);
    if (val === 'my' && currentUser?.name) {
      setFilterResponsible(currentUser.name);
    } else if (val !== 'my' && currentUser?.name && filterResponsible === currentUser.name) {
      setFilterResponsible('all');
    }
  };

  const handleFilterResponsibleChange = (val: string) => {
    setFilterResponsible(val);
    if (currentUser?.name && val === currentUser.name) {
      if (quickFilter !== 'active' && quickFilter !== 'overdue') {
        setQuickFilter('my');
      }
    } else if (quickFilter === 'my') {
      setQuickFilter('all');
    }
  };

  const activeFilterCount =
    (quickFilter === 'active' || quickFilter === 'overdue' ? 1 : 0) +
    (filterCategory !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterResponsible !== 'all' ? 1 : 0) +
    (sortColumn !== 'createdAt' || sortDirection !== 'desc' ? 1 : 0);

  const clearFilters = () => {
    setQuickFilter('all');
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
    { id: 'category', label: t('colCategory') },
    { id: 'responsible', label: t('colResponsible') },
    { id: 'start', label: t('start') },
    { id: 'deadline', label: t('deadline') },
    { id: 'progress', label: t('progress') },
    { id: 'status', label: t('colDeadlineStatus') },
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
    if (filterResponsible !== 'all' && p.responsible !== filterResponsible) return false;
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
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('lblSortBy')}</InputLabel>
                    <Select
                      value={sortColumn}
                      label={t('lblSortBy')}
                      onChange={(e) => handleSortColumnChange(e.target.value)}
                    >
                      <MenuItem value="name">{t('colProject')}</MenuItem>
                      <MenuItem value="client">{t('colClient')}</MenuItem>
                      <MenuItem value="category">{t('colCategory')}</MenuItem>
                      <MenuItem value="responsible">{t('colResponsible')}</MenuItem>
                      <MenuItem value="progress">{t('progress')}</MenuItem>
                      <MenuItem value="start">{t('start')}</MenuItem>
                      <MenuItem value="deadline">{t('deadline')}</MenuItem>
                      <MenuItem value="status">{t('colDeadlineStatus')}</MenuItem>
                      <MenuItem value="createdAt">{t('lblCreatedDate')}</MenuItem>
                    </Select>
                  </FormControl>
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
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('colCategory')}</InputLabel>
                    <Select
                      value={filterCategory}
                      label={t('colCategory')}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <MenuItem value="all">{t('filterAll')}</MenuItem>
                      {uniqueCategories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {getServiceLabel(cat, services)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>{t('colClient')}</InputLabel>
                    <Select
                      value={filterClient}
                      label={t('colClient')}
                      onChange={(e) => setFilterClient(e.target.value)}
                    >
                      <MenuItem value="all">{t('filterAll')}</MenuItem>
                      {uniqueClients.map((client) => (
                        <MenuItem key={client} value={client}>
                          {client}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>{t('colResponsible')}</InputLabel>
                    <Select
                      value={filterResponsible}
                      label={t('colResponsible')}
                      onChange={(e) => handleFilterResponsibleChange(e.target.value)}
                    >
                      <MenuItem value="all">{t('filterAll')}</MenuItem>
                      {currentUser?.name && (
                        <MenuItem value={currentUser.name}>
                          {t('lblMe')} ({currentUser.name})
                        </MenuItem>
                      )}
                      {otherResponsibles.map((resp) => (
                        <MenuItem key={resp} value={resp}>
                          {resp}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>{t('colDeadlineStatus')}</InputLabel>
                    <Select
                      value={filterStatus}
                      label={t('colDeadlineStatus')}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">{t('filterAll')}</MenuItem>
                      <MenuItem value="creation">{t('statInCreation')}</MenuItem>
                      <MenuItem value="overdue">{t('statOverdueUrgent')}</MenuItem>
                      <MenuItem value="stale">{t('statStale')}</MenuItem>
                      <MenuItem value="done">{t('statDone')}</MenuItem>
                    </Select>
                  </FormControl>
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
                      {t('colCategory')}
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
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {p.name}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('client') && (
                        <TableCell>{p.clientName || '—'}</TableCell>
                      )}
                      {activeCols.includes('category') && (
                        <TableCell>
                          <Chip
                            label={getServiceLabel(p.type, services)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
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
                      <TableCell align="right">
                        {editable && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <IconButton size="small" color="info" onClick={() => onEdit(p)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => onDelete(p.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
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
