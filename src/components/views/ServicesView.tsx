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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import type { Service, Category } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ColumnSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';

interface Props {
  services: Service[];
  categories?: Category[];
  onSaveService: (service: Partial<Service>) => void;
  onDeleteService: (id: string) => void;
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  sortState?: { field: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
}

const DEFAULT_COLUMNS = ['name', 'group', 'frequency', 'description'];

export const ServicesView: React.FC<Props> = ({
  services,
  categories = [],
  onSaveService,
  onDeleteService,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  sortState,
  onSortChange,
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { canManageServices } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [localColumns, setLocalColumns] = useState<string[]>(visibleColumns);

  const [sortColumn, setSortColumn] = useState<string>(sortState?.field || 'code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(sortState?.direction || 'asc');

  useEffect(() => {
    if (sortState) {
      setSortColumn(sortState.field || 'code');
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

  // Filter states
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterFrequency, setFilterFrequency] = useState<string>('all');

  const activeFilterCount =
    (filterGroup !== 'all' ? 1 : 0) + (filterFrequency !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setFilterGroup('all');
    setFilterFrequency('all');
  };

  const activeCols = onVisibleColumnsChange ? visibleColumns : localColumns;
  const setCols = (cols: string[]) => {
    setLocalColumns(cols);
    if (onVisibleColumnsChange) onVisibleColumnsChange(cols);
  };

  const columnDefs: ColumnDef[] = [
    { id: 'code', label: t('colCode') },
    { id: 'name', label: t('colServiceName') },
    { id: 'group', label: t('colCategory') },
    { id: 'frequency', label: t('colPeriodicSampling') },
    { id: 'description', label: t('colDescription') },
  ];

  const groupLabels: Record<string, string> = {
    'grp-waste': t('groupWaste'),
    'grp-legal': t('groupLegal'),
    'grp-testing': t('groupTesting'),
    'grp-advisory': t('groupAdvisory'),
    'grp-standards': t('groupStandards'),
    'grp-otpad': t('groupWaste'),
    'grp-pravno': t('groupLegal'),
    'grp-ispitivanje': t('groupTesting'),
    'grp-savetnik': t('groupAdvisory'),
    'grp-standardi': t('groupStandards'),
  };

  const getCategoryName = (grpCode: string) => {
    const matched = categories.find((c) => c.code === grpCode);
    if (matched) return matched.name;
    return groupLabels[grpCode] || grpCode;
  };

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('grp-legal');
  const [frequency, setFrequency] = useState(0);
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const openNew = () => {
    if (!canManageServices) return;
    setEditingService(null);
    setCode('');
    setName('');
    setGroup('grp-legal');
    setFrequency(0);
    setDescription('');
    setIsOpen(true);
  };

  const openEdit = (s: Service) => {
    if (!canManageServices) return;
    setEditingService(s);
    setCode(s.code);
    setName(s.name);
    setGroup(s.group);
    setFrequency(s.frequency);
    setDescription(s.description || '');
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageServices) return;
    if (!code.trim() || !name.trim()) {
      alert(t('alertServiceRequired'));
      return;
    }
    onSaveService({
      id: editingService?.id,
      code: code.trim().toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      group,
      frequency: Number(frequency) || 0,
      description: description.trim() || null,
    });
    setIsOpen(false);
  };

  // 1. Apply Filter
  const filteredServices = services.filter((s) => {
    if (filterGroup !== 'all' && s.group !== filterGroup) return false;
    if (filterFrequency !== 'all') {
      if (filterFrequency === '0' && s.frequency !== 0) return false;
      if (filterFrequency === '3' && s.frequency !== 3) return false;
      if (filterFrequency === '6' && s.frequency !== 6) return false;
      if (filterFrequency === '12' && s.frequency !== 12) return false;
      if (filterFrequency === 'other' && [0, 3, 6, 12].includes(s.frequency)) return false;
    }
    return true;
  });

  // 2. Search among filtered items
  const searchedServices = filteredServices.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const serviceLabel = getServiceLabel(s.code).toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      serviceLabel.includes(q) ||
      s.group.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  // 3. Sort final dataset
  const sortedServices = [...searchedServices].sort((a, b) => {
    let res = 0;
    switch (sortColumn) {
      case 'code':
        res = a.code.localeCompare(b.code);
        break;
      case 'name': {
        const nameA = a.name || getServiceLabel(a.code);
        const nameB = b.name || getServiceLabel(b.code);
        res = nameA.localeCompare(nameB);
        break;
      }
      case 'group': {
        const grpA = getCategoryName(a.group);
        const grpB = getCategoryName(b.group);
        res = grpA.localeCompare(grpB);
        break;
      }
      case 'frequency':
        res = a.frequency - b.frequency;
        break;
      case 'description':
        res = (a.description || '').localeCompare(b.description || '');
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
  }, [searchQuery, filterGroup, filterFrequency]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedServices = sortedServices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', flex: 1, minHeight: 0 }}>
      {/* TOP ACTION BAR */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {canManageServices ? (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openNew}>
            {t('btnNewService')}
          </Button>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <LockIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
              {t('permissionDeniedServices')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* TABLE CARD */}
      <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('servicesListTitle', { count: sortedServices.length })}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              variant="standard"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: '100%', sm: 200 }, pb: 0.5 }}
            />

            <TableFilterSelector activeCount={activeFilterCount} onClear={clearFilters}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('colCategory')}</InputLabel>
                <Select
                  value={filterGroup}
                  label={t('colCategory')}
                  onChange={(e) => setFilterGroup(e.target.value)}
                >
                  <MenuItem value="all">{t('filterAll')}</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.code}>
                      {cat.name}
                    </MenuItem>
                  ))}
                  <MenuItem value="other">{t('other')}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>{t('colPeriodicSampling')}</InputLabel>
                <Select
                  value={filterFrequency}
                  label={t('colPeriodicSampling')}
                  onChange={(e) => setFilterFrequency(e.target.value)}
                >
                  <MenuItem value="all">{t('filterAll')}</MenuItem>
                  <MenuItem value="0">{t('freqNoReminder')}</MenuItem>
                  <MenuItem value="3">{t('freqQuarterly')}</MenuItem>
                  <MenuItem value="6">{t('freqSemiAnnually')}</MenuItem>
                  <MenuItem value="12">{t('freqEveryXMonths', { freq: 12 })}</MenuItem>
                  <MenuItem value="other">{t('other')}</MenuItem>
                </Select>
              </FormControl>
            </TableFilterSelector>

            <ColumnSelector
              columns={columnDefs}
              visibleColumns={activeCols}
              onChange={setCols}
            />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                {activeCols.includes('code') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'code'}
                      direction={sortColumn === 'code' ? sortDirection : 'asc'}
                      onClick={() => handleSort('code')}
                    >
                      {t('colCode')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('name') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'name'}
                      direction={sortColumn === 'name' ? sortDirection : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      {t('colServiceName')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('group') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'group'}
                      direction={sortColumn === 'group' ? sortDirection : 'asc'}
                      onClick={() => handleSort('group')}
                    >
                      {t('colCategory')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('frequency') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'frequency'}
                      direction={sortColumn === 'frequency' ? sortDirection : 'asc'}
                      onClick={() => handleSort('frequency')}
                    >
                      {t('colPeriodicSampling')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('description') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'description'}
                      direction={sortColumn === 'description' ? sortDirection : 'asc'}
                      onClick={() => handleSort('description')}
                    >
                      {t('colDescription')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {canManageServices && <TableCell align="right">{t('colActions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + (canManageServices ? 1 : 0)} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('emptyServices')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedServices.map((s) => (
                  <TableRow key={s.id} hover>
                    {activeCols.includes('code') && (
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {s.code}
                        </Typography>
                      </TableCell>
                    )}
                    {activeCols.includes('name') && (
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {s.name || getServiceLabel(s.code)}
                        </Typography>
                      </TableCell>
                    )}
                    {activeCols.includes('group') && (
                      <TableCell>
                        <Chip
                          label={getCategoryName(s.group)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                    )}
                    {activeCols.includes('frequency') && (
                      <TableCell>
                        {s.frequency === 0
                          ? t('freqNoReminder')
                          : s.frequency === 3
                          ? t('freqQuarterly')
                          : s.frequency === 6
                          ? t('freqSemiAnnually')
                          : t('freqEveryXMonths', { freq: s.frequency })}
                      </TableCell>
                    )}
                    {activeCols.includes('description') && (
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
                          {s.description || '—'}
                        </Typography>
                      </TableCell>
                    )}
                    {canManageServices && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton size="small" color="info" onClick={() => openEdit(s)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => onDeleteService(s.id)}>
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
          count={sortedServices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* SERVICE DIALOG */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingService ? t('modalEditService') : t('modalNewService')}
            </Typography>
            {editingService && canManageServices && (
              <Button
                color="error"
                size="small"
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  onDeleteService(editingService.id);
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
                  label={t('lblServiceCode')}
                  placeholder={t('phServiceCode')}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={Boolean(editingService)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblServiceName')}
                  placeholder={t('phServiceName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblCategoryGroup')}</InputLabel>
                  <Select
                    value={group}
                    label={t('lblCategoryGroup')}
                    onChange={(e) => setGroup(e.target.value as string)}
                  >
                    {categories.length > 0
                      ? categories.map((c) => (
                          <MenuItem key={c.id} value={c.code}>
                            {c.name}
                          </MenuItem>
                        ))
                      : [
                          <MenuItem key="grp-waste" value="grp-waste">{t('groupWaste')}</MenuItem>,
                          <MenuItem key="grp-legal" value="grp-legal">{t('groupLegal')}</MenuItem>,
                          <MenuItem key="grp-testing" value="grp-testing">{t('groupTesting')}</MenuItem>,
                          <MenuItem key="grp-advisory" value="grp-advisory">{t('groupAdvisory')}</MenuItem>,
                          <MenuItem key="grp-standards" value="grp-standards">{t('groupStandards')}</MenuItem>,
                        ]}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  slotProps={{ htmlInput: { min: 0, max: 24 } }}
                  label={t('lblFrequencyMonths')}
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  helperText={t('hintFrequencyZero')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label={t('lblDescription')}
                  placeholder={t('phDescription')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
