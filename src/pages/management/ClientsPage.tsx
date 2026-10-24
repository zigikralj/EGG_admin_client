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
import { AddIcon, EditIcon, DeleteIcon, ArrowUpwardIcon, ArrowDownwardIcon, RefreshIcon, HistoryIcon } from '../../components/icons';
import { HistoryTimelineModal } from '../../components/history';

interface Props extends TableViewProps {}

const DEFAULT_COLUMNS = ['name', 'city', 'contactPerson', 'email', 'phone', 'permit', 'projectCount'];

import { useClientsSummaryQuery, usePaginatedClientsQuery, usePermitsSummaryQuery, useClientsMutations } from '../../queries';
import { useDebounce } from '../../hooks/useDebounce';
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
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('clients', 'create');
  const canEdit = hasPermission('clients', 'edit');
  const canDelete = hasPermission('clients', 'delete');
  const canViewHistory = hasPermission('history', 'view');
  const hasAnyRowAction = canEdit || canDelete || canViewHistory;
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [historyModalState, setHistoryModalState] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterProjectCountOp, setFilterProjectCountOp] = useState<string>('all');
  const [filterProjectCountVal, setFilterProjectCountVal] = useState<string>('');

  const shouldFetchClientsSummary = isFilterOpen || filterCity !== 'all';
  const { data: clientsSummary = [] } = useClientsSummaryQuery({ enabled: shouldFetchClientsSummary });
  const { data: permits = [] } = usePermitsSummaryQuery({ enabled: isOpen });
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
    isRefreshing,
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
    onRefresh: () => {
      refetchPaginatedClients();
    },
  });

  const {
    data: paginatedData,
    refetch: refetchPaginatedClients,
  } = usePaginatedClientsQuery({
    page,
    rowsPerPage: activeRowsPerPage,
    sortBy: sortColumn,
    sortOrder: sortDirection,
    search: debouncedSearchQuery,
    city: filterCity,
  });

  const rawClients = (paginatedData as any)?.items || (Array.isArray(paginatedData) ? paginatedData : []);
  const totalClients = paginatedData?.total ?? rawClients.length;

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
    new Set((clientsSummary.length > 0 ? clientsSummary : rawClients).map((c: any) => c.city).filter(Boolean))
  ) as string[];

  // Apply project count filter if specified
  const displayedClients = rawClients.filter((c: Client) => {
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
              <span>
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
              </span>
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
              onOpen={() => setIsFilterOpen(true)}
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
              {displayedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + (hasAnyRowAction ? 1 : 0)} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('emptyClients')}
                  </TableCell>
                </TableRow>
              ) : (
                displayedClients.map((c: Client) => (
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
                          {canViewHistory && (
                            <Tooltip title={t('historyModalTitle')}>
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => setHistoryModalState({ open: true, client: c })}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
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
          count={totalClients}
          rowsPerPage={activeRowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* CLIENT DIALOG */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            component: 'form',
            onSubmit: handleSubmit,
            sx: {
              maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
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
        <DialogContent dividers sx={{ flex: 1, overflowY: 'auto' }}>
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
          <DialogActions sx={{ p: 2, flexShrink: 0 }}>
            <Button onClick={() => setIsOpen(false)} variant="outlined" disabled={isSaving}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
              {isSaving ? '...' : t('btnSave')}
            </Button>
          </DialogActions>
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

      {historyModalState.client && (
        <HistoryTimelineModal
          open={historyModalState.open}
          onClose={() => setHistoryModalState({ open: false, client: null })}
          entityType="Client"
          entityId={historyModalState.client.id}
          entityTitle={historyModalState.client.name}
          onRestored={() => {
            refetchPaginatedClients();
          }}
        />
      )}
    </Box>
  );
};

export default ClientsPage;
