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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { Client } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ColumnSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';

interface Props {
  clients: Client[];
  onSaveClient: (client: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  sortState?: { field: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
}

const DEFAULT_COLUMNS = ['name', 'city', 'contactPerson', 'email', 'phone', 'projectCount'];

export const ClientsView: React.FC<Props> = ({
  clients,
  onSaveClient,
  onDeleteClient,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  sortState,
  onSortChange,
}) => {
  const { t } = useLanguage();
  const { canManageClients } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [localColumns, setLocalColumns] = useState<string[]>(visibleColumns);

  const [sortColumn, setSortColumn] = useState<string>(sortState?.field || 'name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(sortState?.direction || 'asc');

  useEffect(() => {
    if (sortState) {
      setSortColumn(sortState.field || 'name');
      setSortDirection(sortState.direction || 'asc');
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
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterProjectCountOp, setFilterProjectCountOp] = useState<string>('all');
  const [filterProjectCountVal, setFilterProjectCountVal] = useState<string>('');

  const isProjectCountActive = filterProjectCountOp !== 'all' && filterProjectCountVal.trim() !== '';
  const activeFilterCount =
    (filterCity !== 'all' ? 1 : 0) +
    (isProjectCountActive ? 1 : 0) +
    (sortColumn !== 'name' || sortDirection !== 'asc' ? 1 : 0);

  const clearFilters = () => {
    setFilterCity('all');
    setFilterProjectCountOp('all');
    setFilterProjectCountVal('');
    setSortColumn('name');
    setSortDirection('asc');
    if (onSortChange) {
      onSortChange({ field: 'name', direction: 'asc' });
    }
  };

  const activeCols = onVisibleColumnsChange ? visibleColumns : localColumns;
  const setCols = (cols: string[]) => {
    setLocalColumns(cols);
    if (onVisibleColumnsChange) onVisibleColumnsChange(cols);
  };

  const columnDefs: ColumnDef[] = [
    { id: 'name', label: t('colClientName') },
    { id: 'city', label: t('colCity') },
    { id: 'contactPerson', label: t('colContactPerson') },
    { id: 'email', label: t('colEmail') },
    { id: 'phone', label: t('colPhone') },
    { id: 'projectCount', label: t('colProjectCount') },
  ];

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const openNew = () => {
    if (!canManageClients) return;
    setEditingClient(null);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setCity('');
    setIsOpen(true);
  };

  const openEdit = (c: Client) => {
    if (!canManageClients) return;
    setEditingClient(c);
    setName(c.name);
    setContactPerson(c.contactPerson || '');
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setCity(c.city || '');
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients) return;
    if (!name.trim()) {
      alert(t('alertClientNameRequired'));
      return;
    }
    onSaveClient({
      id: editingClient?.id,
      name: name.trim(),
      contactPerson: contactPerson.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      city: city.trim() || null,
    });
    setIsOpen(false);
  };

  const uniqueCities = Array.from(
    new Set(clients.map((c) => c.city).filter(Boolean))
  ) as string[];

  // 1. Apply Filter
  const filteredClients = clients.filter((c) => {
    if (filterCity !== 'all' && c.city !== filterCity) return false;

    if (filterProjectCountOp !== 'all' && filterProjectCountVal.trim() !== '') {
      const count = c.projects ? c.projects.length : 0;
      const target = Number(filterProjectCountVal);
      if (!isNaN(target)) {
        switch (filterProjectCountOp) {
          case 'eq': if (count !== target) return false; break;
          case 'gt': if (count <= target) return false; break;
          case 'lt': if (count >= target) return false; break;
          case 'gte': if (count < target) return false; break;
          case 'lte': if (count > target) return false; break;
        }
      }
    }

    return true;
  });

  // 2. Search among filtered items
  const searchedClients = filteredClients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  // 3. Sort final dataset
  const sortedClients = [...searchedClients].sort((a, b) => {
    let res = 0;
    switch (sortColumn) {
      case 'name':
        res = a.name.localeCompare(b.name);
        break;
      case 'city':
        res = (a.city || '').localeCompare(b.city || '');
        break;
      case 'contactPerson':
        res = (a.contactPerson || '').localeCompare(b.contactPerson || '');
        break;
      case 'email':
        res = (a.email || '').localeCompare(b.email || '');
        break;
      case 'phone':
        res = (a.phone || '').localeCompare(b.phone || '');
        break;
      case 'projectCount':
        res = (a.projects ? a.projects.length : 0) - (b.projects ? b.projects.length : 0);
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
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, filterCity, filterProjectCountOp, filterProjectCountVal]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedClients = sortedClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', flex: 1, minHeight: 0 }}>
      {/* TOP ACTION BAR */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, alignItems: 'center' }}>
        {canManageClients ? (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openNew} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('btnNewClient')}
          </Button>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <LockIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
              {t('permissionDeniedClients')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* TABLE CARD */}
      <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('clientsListTitle')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            {/* SEARCH FIELD */}
            <TextField
              size="small"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* FILTER POPOVER */}
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
                      <MenuItem value="name">{t('colClientName')}</MenuItem>
                      <MenuItem value="city">{t('colCity')}</MenuItem>
                      <MenuItem value="contactPerson">{t('colContactPerson')}</MenuItem>
                      <MenuItem value="email">{t('colEmail')}</MenuItem>
                      <MenuItem value="phone">{t('colPhone')}</MenuItem>
                      <MenuItem value="projectCount">{t('colProjectCount')}</MenuItem>
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
                    <InputLabel>{t('colCity')}</InputLabel>
                    <Select
                      value={filterCity}
                      label={t('colCity')}
                      onChange={(e) => setFilterCity(e.target.value)}
                    >
                      <MenuItem value="all">{t('filterAll')}</MenuItem>
                      {uniqueCities.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <InputLabel>{t('colProjectCount')}</InputLabel>
                      <Select
                        value={filterProjectCountOp}
                        label={t('colProjectCount')}
                        onChange={(e) => setFilterProjectCountOp(e.target.value)}
                      >
                        <MenuItem value="all">{t('filterAll')}</MenuItem>
                        <MenuItem value="gt">&gt;</MenuItem>
                        <MenuItem value="gte">&ge;</MenuItem>
                        <MenuItem value="eq">=</MenuItem>
                        <MenuItem value="lte">&le;</MenuItem>
                        <MenuItem value="lt">&lt;</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="0"
                      value={filterProjectCountVal}
                      onChange={(e) => setFilterProjectCountVal(e.target.value)}
                      sx={{ flex: 1 }}
                      disabled={filterProjectCountOp === 'all'}
                    />
                  </Box>
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
          <Table stickyHeader sx={{ width: '100%', minWidth: 600 }}>
            <TableHead>
              <TableRow>
                {activeCols.includes('name') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'name'}
                      direction={sortColumn === 'name' ? sortDirection : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      {t('colClientName')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('city') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'city'}
                      direction={sortColumn === 'city' ? sortDirection : 'asc'}
                      onClick={() => handleSort('city')}
                    >
                      {t('colCity')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('contactPerson') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'contactPerson'}
                      direction={sortColumn === 'contactPerson' ? sortDirection : 'asc'}
                      onClick={() => handleSort('contactPerson')}
                    >
                      {t('colContactPerson')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('email') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'email'}
                      direction={sortColumn === 'email' ? sortDirection : 'asc'}
                      onClick={() => handleSort('email')}
                    >
                      {t('colEmail')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('phone') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'phone'}
                      direction={sortColumn === 'phone' ? sortDirection : 'asc'}
                      onClick={() => handleSort('phone')}
                    >
                      {t('colPhone')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('projectCount') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'projectCount'}
                      direction={sortColumn === 'projectCount' ? sortDirection : 'asc'}
                      onClick={() => handleSort('projectCount')}
                    >
                      {t('colProjectCount')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {canManageClients && <TableCell align="right">{t('colActions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + (canManageClients ? 1 : 0)} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('emptyClients')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClients.map((c) => (
                  <TableRow key={c.id} hover>
                    {activeCols.includes('name') && (
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {c.name}
                        </Typography>
                      </TableCell>
                    )}
                    {activeCols.includes('city') && <TableCell>{c.city || '—'}</TableCell>}
                    {activeCols.includes('contactPerson') && <TableCell>{c.contactPerson || '—'}</TableCell>}
                    {activeCols.includes('email') && <TableCell>{c.email || '—'}</TableCell>}
                    {activeCols.includes('phone') && <TableCell>{c.phone || '—'}</TableCell>}
                    {activeCols.includes('projectCount') && (
                      <TableCell>
                        <Chip
                          label={c.projects ? c.projects.length : 0}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                    )}
                    {canManageClients && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton size="small" color="info" onClick={() => openEdit(c)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => onDeleteClient(c.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[15, 25, 50]}
          component="div"
          count={sortedClients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* CLIENT DIALOG */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingClient ? t('modalEditClient') : t('modalNewClient')}
            </Typography>
            {editingClient && canManageClients && (
              <Button
                color="error"
                size="small"
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  onDeleteClient(editingClient.id);
                  setIsOpen(false);
                }}
              >
                {t('btnDelete')}
              </Button>
            )}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblClientCompany')}
                  placeholder={t('phClientCompany')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblCity')}
                  placeholder={t('phCity')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblContactPerson')}
                  placeholder={t('phContactPerson')}
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label={t('lblEmail')}
                  placeholder={t('phEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblPhone')}
                  placeholder={t('phPhone')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsOpen(false)} variant="outlined">
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {t('btnSave')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
