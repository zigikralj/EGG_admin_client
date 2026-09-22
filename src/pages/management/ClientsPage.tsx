import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Autocomplete,
  Tooltip,
} from '@mui/material';

import type { Client, Permit, TableViewProps } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTableView } from '../../hooks/useTableView';
import { TableOptionsSelector, type ColumnDef } from '../../components/common/ColumnSelector';
import { TableFilterSelector } from '../../components/common/TableFilterSelector';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { ErrorDialog } from '../../components/dialogs/ErrorDialog';
import { AddIcon, EditIcon, DeleteIcon, ArrowUpwardIcon, ArrowDownwardIcon, RefreshIcon } from '../../components/icons';

interface Props extends TableViewProps {}

const DEFAULT_COLUMNS = ['name', 'city', 'contactPerson', 'email', 'phone', 'permit', 'projectCount'];

import { useClientsQuery, usePermitsQuery, useClientsMutations } from '../../queries';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';

const ClientsPage: React.FC<Props> = ({
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  sortState,
  onSortChange,
}) => {
  const { t } = useLanguage();
  const { isAdmin, hasPermission } = useAuth();
  const canCreate = isAdmin || hasPermission('clients', 'create');
  const canEdit = isAdmin || hasPermission('clients', 'edit');
  const canDelete = isAdmin || hasPermission('clients', 'delete');
  const hasAnyRowAction = canEdit || canDelete;
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data: clients = [], refetch: refetchClients, isRefetching } = useClientsQuery();
  const { data: permits = [] } = usePermitsQuery();
  const { handleSave, handleDelete } = useClientsMutations();

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const onDeleteClient = (id: string) => handleDelete(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));

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
    isSaving,
    setIsSaving,
    errorDialogState,
    setErrorDialogState,
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
    onRefresh: () => { refetchClients(); },
  });

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
    resetSort();
  };

  const columnDefs: ColumnDef[] = [
    { id: 'name', label: t('colClientName') },
    { id: 'city', label: t('colCity') },
    { id: 'contactPerson', label: t('colContactPerson') },
    { id: 'email', label: t('colEmail') },
    { id: 'phone', label: t('colPhone') },
    { id: 'permit', label: t('colPermit') },
    { id: 'projectCount', label: t('colProjectCount') },
  ];

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [selectedPermitIds, setSelectedPermitIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const getClientPermits = useCallback((c: Client): Permit[] => {
    if (c.permits && c.permits.length > 0) return c.permits;
    const byClientId = permits.filter((p) => p.clientId === c.id);
    if (byClientId.length > 0) return byClientId;
    if (c.permit) return [c.permit];
    if (c.permitId) {
      const found = permits.find((p) => p.id === c.permitId);
      if (found) return [found];
    }
    if (c.extraData?.permitId) {
      const found = permits.find((p) => p.id === c.extraData!.permitId);
      if (found) return [found];
    }
    return [];
  }, [permits]);

  const openNew = () => {
    if (!canCreate) return;
    setEditingClient(null);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setCity('');
    setSelectedPermitIds([]);
    setIsOpen(true);
  };

  const openEdit = (c: Client) => {
    if (!canEdit) return;
    setEditingClient(c);
    setName(c.name);
    setContactPerson(c.contactPerson || '');
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setCity(c.city || '');
    const clientPermits = getClientPermits(c);
    setSelectedPermitIds(clientPermits.map((p) => p.id));
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit && !canCreate) return;
    if (!name.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertClientNameRequired'),
      });
      return;
    }
    setIsSaving(true);
    try {
      const res = await handleSave({
        id: editingClient?.id,
        name: name.trim(),
        contactPerson: contactPerson.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        permitId: selectedPermitIds[0] || null,
        permitIds: selectedPermitIds,
      } as any);

      if (res.success) {
        setIsOpen(false);
      } else {
        setErrorDialogState({ open: true, message: res.error || t('errorSavingClient') });
      }
    } finally {
      setIsSaving(false);
    }
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
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      Boolean(
        getClientPermits(c).some((p) =>
          p.permitNumber.toLowerCase().includes(q) ||
          Boolean(p.indexNumber && p.indexNumber.toLowerCase().includes(q))
        )
      )
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
      case 'permit': {
        const pListA = getClientPermits(a);
        const pListB = getClientPermits(b);
        const pA = pListA.map((p) => `${p.permitNumber} ${p.indexNumber || ''}`).join(', ');
        const pB = pListB.map((p) => `${p.permitNumber} ${p.indexNumber || ''}`).join(', ');
        res = pA.localeCompare(pB);
        break;
      }
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

  useEffect(() => {
    setPage(0);
  }, [searchQuery, filterCity, filterProjectCountOp, filterProjectCountVal, setPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

  const paginatedClients = sortedClients.slice(page * activeRowsPerPage, page * activeRowsPerPage + activeRowsPerPage);

  const sortOptions = useMemo(() => [
    { value: 'name', label: t('colClientName') },
    { value: 'city', label: t('colCity') },
    { value: 'contactPerson', label: t('colContactPerson') },
    { value: 'email', label: t('colEmail') },
    { value: 'phone', label: t('colPhone') },
    { value: 'permit', label: t('colPermit') },
    { value: 'projectCount', label: t('colProjectCount') },
    { value: 'createdAt', label: t('lblCreatedDate') },
  ], [t]);

  const operatorOptions = useMemo(() => [
    { value: 'gt', label: '>' },
    { value: 'gte', label: '≥' },
    { value: 'eq', label: '=' },
    { value: 'lte', label: '≤' },
    { value: 'lt', label: '<' },
  ], []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', flex: 1, minHeight: 0 }}>
      {/* TOP ACTION BAR */}
      {canCreate && (
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, alignItems: 'center' }}>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openNew} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('btnNewClient')}
          </Button>
        </Box>
      )}

      {/* TABLE CARD */}
      <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('clientsListTitle')}
            </Typography>
            <Tooltip title={t('btnRefresh')}>
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
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            {/* SEARCH FIELD */}
            <TableSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
            />

            {/* FILTER POPOVER */}
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
                    options={uniqueCities}
                    value={filterCity === 'all' ? null : filterCity}
                    onChange={(_, newValue) => setFilterCity(newValue || 'all')}
                    renderInput={(params) => <TextField {...params} label={t('colCity')} size="small" />}
                  />

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Autocomplete
                      size="small"
                      disablePortal
                      options={operatorOptions}
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, val) => option.value === val.value}
                      value={operatorOptions.find((o) => o.value === filterProjectCountOp) || null}
                      onChange={(_, newValue) => {
                        setFilterProjectCountOp(newValue ? newValue.value : 'all');
                      }}
                      sx={{ width: 110 }}
                      renderInput={(params) => <TextField {...params} label={t('colProjectCount')} size="small" />}
                    />
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
                {activeCols.includes('permit') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'permit'}
                      direction={sortColumn === 'permit' ? sortDirection : 'asc'}
                      onClick={() => handleSort('permit')}
                    >
                      {t('colPermit')}
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
                {hasAnyRowAction && <TableCell align="right">{t('colActions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + (hasAnyRowAction ? 1 : 0)} align="center" sx={{ py: 3, color: 'text.secondary' }}>
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
                    {activeCols.includes('permit') && (
                      <TableCell>
                        {(() => {
                          const clientPermits = getClientPermits(c);
                          if (!clientPermits.length) return '—';
                          return (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {clientPermits.map((p) => (
                                <Chip
                                  key={p.id}
                                  label={`${p.permitNumber}${p.indexNumber ? ` (${p.indexNumber})` : ''}`}
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                />
                              ))}
                            </Box>
                          );
                        })()}
                      </TableCell>
                    )}
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
                    {hasAnyRowAction && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {canEdit && (
                            <IconButton size="small" color="info" onClick={() => openEdit(c)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton size="small" color="error" onClick={() => onDeleteClient(c.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
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
          rowsPerPageOptions={activeRowsPerPageOptions}
          component="div"
          count={sortedClients.length}
          rowsPerPage={activeRowsPerPage}
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
            {editingClient && canDelete && (
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  multiple
                  options={permits}
                  getOptionLabel={(option) =>
                    typeof option === 'string'
                      ? option
                      : `${option.permitNumber}${option.indexNumber ? ` (${option.indexNumber})` : ''}`
                  }
                  value={permits.filter((p) => selectedPermitIds.includes(p.id))}
                  onChange={(_, newValues) => {
                    setSelectedPermitIds(
                      newValues.map((v) => (typeof v === 'string' ? v : v.id))
                    );
                  }}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label={t('lblPermit')}
                      placeholder={t('phSelectPermit')}
                      helperText={!permits.length ? t('emptyPermits') : undefined}
                    />
                  )}
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

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState((prev) => ({ ...prev, open: false }))}
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
    </Box>
  );
};

export default ClientsPage;
