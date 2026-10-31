import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Paper,
  Autocomplete,
} from '@mui/material';

import type { User, TableViewProps } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TableOptionsSelector, type ColumnDef } from '../../components/common/ColumnSelector';
import { TableFilterSelector } from '../../components/common/TableFilterSelector';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { TableQuickFilters, type QuickFilterItem } from '../../components/common/TableQuickFilters';
import { UserModal } from '../../components/user';
import { type ModalMode } from '../../components/common/modal/ViewEditModalBase';
import { ErrorDialog } from '../../components/common/dialogs/ErrorDialog';
import { useTableView } from '../../hooks/useTableView';
import { AddIcon, EditIcon, DeleteIcon, HowToRegIcon, HourglassEmptyIcon, ArrowUpwardIcon, ArrowDownwardIcon, CheckCircleIcon, HighlightOffIcon, BlockIcon, ExitToAppIcon, RefreshIcon } from '../../components/icons';

interface Props extends Partial<TableViewProps> {
  initialFilterStatus?: string;
  quickFilters?: string[];
  onQuickFiltersChange?: (val: string[]) => void;
  quickFilter?: string;
  onQuickFilterChange?: (val: string) => void;
}

const DEFAULT_COLUMNS = ['name', 'role', 'status', 'email', 'phone', 'gender'];

import { usePaginatedUsersQuery, useUsersMutations, useRolesQuery, useTablePreferences } from '../../queries';
import { useDebounce } from '../../hooks/useDebounce';
import { ConfirmDialog } from '../../components/common/dialogs/ConfirmDialog';

const UsersPage: React.FC<Props> = ({
  visibleColumns: visibleColumnsProp,
  onVisibleColumnsChange: onVisibleColumnsChangeProp,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange: onRowsPerPageOptionsChangeProp,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange: onRowsPerPageChangeProp,
  sortState: sortStateProp,
  onSortChange: onSortChangeProp,
  initialFilterStatus = 'all',
  quickFilters: quickFiltersProp,
  onQuickFiltersChange: onQuickFiltersChangeProp,
  quickFilter: quickFilterProp,
  onQuickFilterChange: onQuickFilterChangeProp,
}) => {
  const tablePrefs = useTablePreferences('users');
  const visibleColumns = visibleColumnsProp ?? tablePrefs.visibleColumns ?? DEFAULT_COLUMNS;
  const onVisibleColumnsChange = onVisibleColumnsChangeProp ?? tablePrefs.onVisibleColumnsChange;
  const rowsPerPageOptions = rowsPerPageOptionsProp ?? tablePrefs.rowsPerPageOptions;
  const onRowsPerPageOptionsChange = onRowsPerPageOptionsChangeProp ?? tablePrefs.onRowsPerPageOptionsChange;
  const rowsPerPage = rowsPerPageProp ?? tablePrefs.rowsPerPage;
  const onRowsPerPageChange = onRowsPerPageChangeProp ?? tablePrefs.onRowsPerPageChange;
  const sortState = sortStateProp ?? tablePrefs.sortState;
  const onSortChange = onSortChangeProp ?? tablePrefs.onSortChange;
  const { t } = useLanguage();
  const { canEditUser, canDeleteUser, hasPermission, currentUser, pendingUsersCount = 0 } = useAuth();
  const canCreate = hasPermission('users', 'create');
  const canEditAny = hasPermission('users', 'edit');
  const canDeleteAny = hasPermission('users', 'delete');
  const hasAnyRowAction = canEditAny || canDeleteAny;
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const { handleSave, handleDelete, handleApproveUser, handleRejectUser, handleForceLogoutUser } = useUsersMutations();

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const onDeleteUser = (id: string) => handleDelete(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const prefQuickFilters = Array.isArray(tablePrefs.quickFilters)
    ? tablePrefs.quickFilters
    : (tablePrefs.quickFilters && tablePrefs.quickFilters !== 'all' ? [tablePrefs.quickFilters] : []);

  const [quickFilters, setQuickFilters] = useState<string[]>(() => {
    if (Array.isArray(quickFiltersProp)) return quickFiltersProp;
    if (typeof quickFilterProp === 'string' && quickFilterProp !== 'all') return [quickFilterProp];
    if (initialFilterStatus === 'pending') return [initialFilterStatus];
    if (prefQuickFilters.length > 0) return prefQuickFilters;
    return [];
  });

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
    isRefreshing,
    handleRefresh,
    errorDialogState,
    setErrorDialogState,
  } = useTableView({
    defaultColumns: DEFAULT_COLUMNS,
    visibleColumns,
    onVisibleColumnsChange,
    rowsPerPageProp: rowsPerPage,
    onRowsPerPageChange,
    rowsPerPageOptionsProp: rowsPerPageOptions,
    onRowsPerPageOptionsChange,
    sortState,
    onSortChange,
    onRefresh: () => {
      refetchPaginatedUsers();
    },
  });

  const effectiveStatus = quickFilters.includes('pending') ? 'pending' : filterStatus;
  const {
    data: paginatedData,
    refetch: refetchPaginatedUsers,
  } = usePaginatedUsersQuery({
    page,
    rowsPerPage: activeRowsPerPage,
    sortBy: sortColumn,
    sortOrder: sortDirection,
    search: debouncedSearchQuery,
    role: filterRole,
    status: effectiveStatus,
  });

  const rawUsers = (paginatedData as any)?.items || (Array.isArray(paginatedData) ? paginatedData : []);
  const totalUsers = paginatedData?.total ?? rawUsers.length;

  // Approve dialog state
  const [approveUserTarget, setApproveUserTarget] = useState<User | null>(null);
  const [approveRole, setApproveRole] = useState<string>('User');
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

  const shouldFetchRoles = isFilterOpen || isOpen || Boolean(approveUserTarget) || filterRole !== 'all';
  const { data: rolesList = [] } = useRolesQuery({ enabled: shouldFetchRoles });

  // Force logout dialog state
  const [forceLogoutTarget, setForceLogoutTarget] = useState<User | null>(null);
  const [isSubmittingForceLogout, setIsSubmittingForceLogout] = useState(false);

  useEffect(() => {
    if (Array.isArray(quickFiltersProp)) {
      setQuickFilters(quickFiltersProp);
    } else if (typeof quickFilterProp === 'string') {
      setQuickFilters(quickFilterProp === 'all' ? [] : [quickFilterProp]);
    }
  }, [quickFiltersProp, quickFilterProp]);

  const prevInitialFilterStatus = useRef(initialFilterStatus);
  useEffect(() => {
    if (initialFilterStatus && initialFilterStatus !== prevInitialFilterStatus.current) {
      prevInitialFilterStatus.current = initialFilterStatus;
      if (initialFilterStatus === 'pending') {
        setQuickFilters([initialFilterStatus]);
      } else {
        setFilterStatus(initialFilterStatus);
      }
    }
  }, [initialFilterStatus]);

  const handleQuickFiltersChange = (newKeys: string[]) => {
    setQuickFilters(newKeys);
    if (onQuickFiltersChangeProp) {
      onQuickFiltersChangeProp(newKeys);
    } else {
      tablePrefs.onQuickFiltersChange(newKeys);
    }
    onQuickFilterChangeProp?.(newKeys[0] || 'all');
  };

  const handleFilterStatusChange = (val: string) => {
    setFilterStatus(val);
  };

  const activeFilterCount =
    quickFilters.length +
    (filterRole !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (sortColumn !== 'name' || sortDirection !== 'asc' ? 1 : 0);

  const clearFilters = () => {
    setQuickFilters([]);
    if (onQuickFiltersChangeProp) {
      onQuickFiltersChangeProp([]);
    } else {
      tablePrefs.onQuickFiltersChange([]);
    }
    onQuickFilterChangeProp?.('all');
    setFilterRole('all');
    setFilterStatus('all');
    resetSort();
  };

  const columnDefs: ColumnDef[] = [
    { id: 'name', label: t('colFullName') },
    { id: 'role', label: t('colRole') },
    { id: 'status', label: t('colApprovalStatus') },
    { id: 'gender', label: t('colGender') },
    { id: 'email', label: t('colEmail') },
    { id: 'phone', label: t('colPhone') },
  ];

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'Administrator': return t('roleAdministrator');
      case 'Manager': return t('roleManager');
      case 'User': return t('roleUser');
      case 'Accountant': return t('roleAccountant');
      default: return r;
    }
  };

  const getGenderLabel = (g?: string | null) => {
    switch (g) {
      case 'Male': return t('genderMale');
      case 'Female': return t('genderFemale');
      case 'Other': return t('genderOther');
      default: return '—';
    }
  };

  const getRoleColor = (r: string): 'secondary' | 'primary' | 'success' | 'info' | 'default' => {
    switch (r) {
      case 'Administrator': return 'secondary';
      case 'Manager': return 'primary';
      case 'User': return 'success';
      case 'Accountant': return 'info';
      default: return 'default';
    }
  };

  const openNew = () => {
    if (!canCreate) return;
    setEditingUser(null);
    setModalMode('create');
    setIsOpen(true);
  };

  const openView = (u: User) => {
    setEditingUser(u);
    setModalMode('view');
    setIsOpen(true);
  };

  const openEdit = (u: User) => {
    if (!canEditUser(u)) return;
    setEditingUser(u);
    setModalMode('edit');
    setIsOpen(true);
  };

  const openApproveModal = (u: User) => {
    setApproveUserTarget(u);
    setApproveRole('User');
  };

  const handleConfirmApprove = async () => {
    if (!approveUserTarget) return;
    setIsSubmittingApprove(true);
    try {
      await handleApproveUser(approveUserTarget.id, approveRole);
      setApproveUserTarget(null);
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  const handleConfirmReject = async (u: User) => {
    if (window.confirm(t('confirmRejectMessage', { name: u.name }))) {
      await handleRejectUser(u.id);
    }
  };

  const handleConfirmForceLogout = async () => {
    if (!forceLogoutTarget) return;
    setIsSubmittingForceLogout(true);
    try {
      await handleForceLogoutUser(forceLogoutTarget.id);
      setForceLogoutTarget(null);
    } finally {
      setIsSubmittingForceLogout(false);
    }
  };

  const uniqueRoles = useMemo(() => rolesList.map((r) => r.name), [rolesList]);

  const userQuickFilterOptions: QuickFilterItem[] = useMemo(() => [
    {
      key: 'pending',
      label: `${t('statusPending')}${pendingUsersCount > 0 ? ` (${pendingUsersCount})` : ''}`,
      color: 'warning',
      labelColor: 'warning.main',
    },
  ], [t, pendingUsersCount]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, filterRole, filterStatus, quickFilters, setPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

  const paginatedUsers = rawUsers;

  const sortOptions = useMemo(() => [
    { value: 'name', label: t('colFullName') },
    { value: 'role', label: t('colRole') },
    { value: 'status', label: t('colApprovalStatus') },
    { value: 'email', label: t('colEmail') },
    { value: 'phone', label: t('colPhone') },
    { value: 'createdAt', label: t('lblCreatedDate') },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: 'approved', label: t('statusApproved') },
    { value: 'pending', label: t('statusPending') },
    { value: 'blocked', label: t('statusBlocked') },
  ], [t]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', flex: 1, minHeight: 0 }}>
      {/* TOP ACTION BAR */}
      {canCreate && (
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openNew} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('btnNewUser')}
          </Button>
        </Box>
      )}

      {/* TABLE CARD */}
      <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('usersListTitle', { count: totalUsers })}
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

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            {/* QUICK FILTERS */}
            <TableQuickFilters
              options={userQuickFilterOptions}
              selectedKeys={quickFilters}
              onChange={handleQuickFiltersChange}
            />

            <TableSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
            />

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
                    options={uniqueRoles}
                    getOptionLabel={(r) => getRoleLabel(r)}
                    value={filterRole === 'all' ? null : filterRole}
                    onChange={(_, newValue) => setFilterRole(newValue || 'all')}
                    renderInput={(params) => <TextField {...params} label={t('colRole')} size="small" />}
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
                    renderInput={(params) => <TextField {...params} label={t('colApprovalStatus')} size="small" />}
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
                      {t('colFullName')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('role') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'role'}
                      direction={sortColumn === 'role' ? sortDirection : 'asc'}
                      onClick={() => handleSort('role')}
                    >
                      {t('colRole')}
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
                      {t('colApprovalStatus')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('gender') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'gender'}
                      direction={sortColumn === 'gender' ? sortDirection : 'asc'}
                      onClick={() => handleSort('gender')}
                    >
                      {t('colGender')}
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
                {hasAnyRowAction && <TableCell align="right">{t('colActions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {rawUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + (hasAnyRowAction ? 1 : 0)} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('emptyUsers')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((u: any) => {
                  const editable = canEditUser(u);
                  const deletable = canDeleteUser(u);
                  const isPending = u.status === 'PENDING';
                  const isBlocked = u.status === 'BLOCKED';
                  return (
                    <TableRow key={u.id} hover sx={{ bgcolor: isPending ? 'action.hover' : 'inherit', cursor: 'pointer' }} onClick={() => openView(u)}>
                      {activeCols.includes('name') && (
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {u.name}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('role') && (
                        <TableCell>
                          <Chip
                            label={getRoleLabel(u.role)}
                            size="small"
                            color={getRoleColor(u.role)}
                          />
                        </TableCell>
                      )}
                      {activeCols.includes('status') && (
                        <TableCell>
                          {isBlocked ? (
                            <Chip
                              icon={<BlockIcon fontSize="small" />}
                              label={t('statusBlocked')}
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : isPending ? (
                            <Chip
                              icon={<HourglassEmptyIcon fontSize="small" />}
                              label={t('statusPending')}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : (
                            <Chip
                              icon={<CheckCircleIcon fontSize="small" />}
                              label={t('statusApproved')}
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </TableCell>
                      )}
                      {activeCols.includes('gender') && <TableCell>{getGenderLabel(u.gender)}</TableCell>}
                      {activeCols.includes('email') && <TableCell>{u.email || '—'}</TableCell>}
                      {activeCols.includes('phone') && <TableCell>{u.phone || '—'}</TableCell>}
                      {hasAnyRowAction && (
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          {isPending ? (
                            editable && (
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                <Tooltip title={t('btnApproveAndAssignRole')}>
                                  <IconButton size="small" color="success" onClick={() => openApproveModal(u)}>
                                    <HowToRegIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('btnRejectRegistration')}>
                                  <IconButton size="small" color="error" onClick={() => handleConfirmReject(u)}>
                                    <HighlightOffIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )
                          ) : (editable || deletable) ? (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                              {editable && u.id !== currentUser?.id && (
                                <Tooltip title={t('btnForceLogout')}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setForceLogoutTarget(u)}
                                    sx={{
                                      border: '1px solid',
                                      borderColor: 'error.light',
                                      bgcolor: 'rgba(211, 47, 47, 0.04)',
                                      '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.12)' },
                                    }}
                                  >
                                    <ExitToAppIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {editable && (
                                <IconButton size="small" color="info" onClick={() => openEdit(u)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              )}
                              {deletable && (
                                <IconButton size="small" color="error" onClick={() => onDeleteUser(u.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              🔒 Read-only
                            </Typography>
                          )}
                        </TableCell>
                      )}
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
          count={totalUsers}
          rowsPerPage={activeRowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* APPROVE & ASSIGN ROLE MODAL DIALOG */}
      <Dialog
        open={Boolean(approveUserTarget)}
        onClose={() => setApproveUserTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, flexShrink: 0 }}>
          {t('modalApproveUserTitle')}
        </DialogTitle>
        <DialogContent dividers sx={{ flex: 1, overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('modalApproveUserSubtitle', { name: approveUserTarget?.name || '' })}
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {approveUserTarget?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {approveUserTarget?.email || 'No email provided'}
              </Typography>
              {approveUserTarget?.phone && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Phone: {approveUserTarget.phone}
                </Typography>
              )}
            </Paper>

            <FormControl fullWidth size="small">
              <InputLabel>{t('lblSelectRole')}</InputLabel>
              <Select
                value={approveRole}
                label={t('lblSelectRole')}
                onChange={(e) => setApproveRole(e.target.value as string)}
              >
                {rolesList.map((r) => {
                  if (r.name === 'Administrator' && !hasPermission('roles', 'edit')) return null;
                  return (
                    <MenuItem key={r.name} value={r.name}>
                      {getRoleLabel(r.name)}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexShrink: 0 }}>
          <Button onClick={() => setApproveUserTarget(null)} variant="outlined">
            {t('btnCancel')}
          </Button>
          <Button
            onClick={handleConfirmApprove}
            variant="contained"
            color="success"
            disabled={isSubmittingApprove}
            startIcon={<HowToRegIcon />}
          >
            {t('btnApproveAndAssignRole')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* USER EDIT/CREATE MODAL */}
      <UserModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        editingUser={editingUser}
        mode={modalMode}
        onModeChange={setModalMode}
        rolesList={rolesList}
        canDelete={editingUser ? canDeleteUser(editingUser) : false}
        canEdit={editingUser ? canEditUser(editingUser) : canCreate}
        canCreate={canCreate}
        onDeleteUser={onDeleteUser}
        onSaveUser={handleSave}
        onError={(message) => setErrorDialogState({ open: true, message })}
      />

      {/* FORCE LOGOUT CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(forceLogoutTarget)}
        onClose={() => setForceLogoutTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <ExitToAppIcon color="error" />
          {t('confirmForceLogoutTitle')}
        </DialogTitle>
        <DialogContent dividers sx={{ flex: 1, overflowY: 'auto' }}>
          <Typography variant="body2" sx={{ pt: 1 }}>
            {t('confirmForceLogoutMessage', { name: forceLogoutTarget?.name || '' })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexShrink: 0 }}>
          <Button
            onClick={() => setForceLogoutTarget(null)}
            variant="outlined"
            color="inherit"
            disabled={isSubmittingForceLogout}
          >
            {t('btnCancel')}
          </Button>
          <Button
            onClick={handleConfirmForceLogout}
            variant="contained"
            color="error"
            startIcon={<ExitToAppIcon />}
            disabled={isSubmittingForceLogout}
          >
            {isSubmittingForceLogout ? '...' : t('btnForceLogout')}
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
        onConfirm={deleteConfirmState.onConfirm}
        onClose={() => setDeleteConfirmState((prev) => ({ ...prev, open: false }))}
        confirmColor="warning"
      />
    </Box>
  );
};

export default UsersPage;
