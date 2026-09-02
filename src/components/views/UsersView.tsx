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
  Alert,
  Tooltip,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
} from '@mui/material';
















import type { User, SaveResult, TableViewProps } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TableOptionsSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';
import { TableSearchInput } from '../TableSearchInput';
import { ErrorDialog } from '../ErrorDialog';
import { useTableView } from '../../hooks/useTableView';
import { AddIcon, EditIcon, DeleteIcon, LockIcon, HowToRegIcon, HourglassEmptyIcon, ArrowUpwardIcon, ArrowDownwardIcon, CheckCircleIcon, HighlightOffIcon, BlockIcon, VpnKeyIcon, Visibility, VisibilityOff, ExitToAppIcon, RefreshIcon } from '../icons';

interface Props extends TableViewProps {
  users: User[];
  onSaveUser: (user: Partial<User>) => Promise<SaveResult | void> | void;
  onDeleteUser: (id: string) => void;
  onApproveUser?: (userId: string, role: string) => Promise<void>;
  onRejectUser?: (userId: string) => Promise<void>;
  onForceLogoutUser?: (userId: string) => Promise<void>;
  initialFilterStatus?: string;
  quickFilter?: 'all' | 'pending' | 'online';
  onQuickFilterChange?: (val: 'all' | 'pending' | 'online') => void;
}

const DEFAULT_COLUMNS = ['name', 'role', 'status', 'email', 'phone', 'gender'];

const UsersView: React.FC<Props> = ({
  users,
  onSaveUser,
  onDeleteUser,
  onApproveUser,
  onRejectUser,
  onForceLogoutUser,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  sortState,
  onSortChange,
  initialFilterStatus = 'all',
  quickFilter: quickFilterProp,
  onQuickFilterChange,
  onRefresh,
}) => {
  const { t } = useLanguage();
  const { canManageUsers, canEditUser, isAdmin, currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
    onRefresh,
  });

  // Approve dialog state
  const [approveUserTarget, setApproveUserTarget] = useState<User | null>(null);
  const [approveRole, setApproveRole] = useState<string>('User');
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

  // Force logout dialog state
  const [forceLogoutTarget, setForceLogoutTarget] = useState<User | null>(null);
  const [isSubmittingForceLogout, setIsSubmittingForceLogout] = useState(false);



  // Filter state
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>(
    initialFilterStatus !== 'all' ? initialFilterStatus : (quickFilterProp || 'all')
  );

  useEffect(() => {
    if (initialFilterStatus && initialFilterStatus !== 'all') {
      setFilterStatus(initialFilterStatus);
    } else if (quickFilterProp !== undefined) {
      setFilterStatus(quickFilterProp);
    }
  }, [initialFilterStatus, quickFilterProp]);

  const handleFilterStatusChange = (val: string) => {
    setFilterStatus(val);
    onQuickFilterChange?.(val === 'pending' ? 'pending' : 'all');
  };

  const activeFilterCount =
    (filterRole !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (sortColumn !== 'name' || sortDirection !== 'asc' ? 1 : 0);

  const clearFilters = () => {
    setFilterRole('all');
    setFilterStatus('all');
    onQuickFilterChange?.('all');
    resetSort();
  };

  const columnDefs: ColumnDef[] = [
    { id: 'name', label: t('colFullName') },
    { id: 'role', label: t('colRole') },
    { id: 'status', label: t('colApprovalStatus') },
    { id: 'online', label: t('colOnlineStatus') },
    { id: 'gender', label: t('colGender') },
    { id: 'email', label: t('colEmail') },
    { id: 'phone', label: t('colPhone') },
  ];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('User');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState<string>('APPROVED');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (!canManageUsers) return;
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('User');
    setPhone('');
    setGender('');
    setStatus('APPROVED');
    setPassword('');
    setShowPassword(false);
    setIsOpen(true);
  };

  const openEdit = (u: User) => {
    if (!canEditUser(u)) return;
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email || '');
    setRole(u.role || 'User');
    setPhone(u.phone || '');
    setGender(u.gender || '');
    setStatus(u.status || (u.isApproved === false ? 'BLOCKED' : 'APPROVED'));
    setPassword('');
    setShowPassword(false);
    setIsOpen(true);
  };

  const openApproveModal = (u: User) => {
    setApproveUserTarget(u);
    setApproveRole('User');
  };

  const handleConfirmApprove = async () => {
    if (!approveUserTarget || !onApproveUser) return;
    setIsSubmittingApprove(true);
    try {
      await onApproveUser(approveUserTarget.id, approveRole);
      setApproveUserTarget(null);
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  const handleConfirmReject = async (u: User) => {
    if (!onRejectUser) return;
    if (window.confirm(t('confirmRejectMessage', { name: u.name }))) {
      await onRejectUser(u.id);
    }
  };

  const handleConfirmForceLogout = async () => {
    if (!forceLogoutTarget || !onForceLogoutUser) return;
    setIsSubmittingForceLogout(true);
    try {
      await onForceLogoutUser(forceLogoutTarget.id);
      setForceLogoutTarget(null);
    } finally {
      setIsSubmittingForceLogout(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;
    if (!name.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertUserNameRequired'),
      });
      return;
    }
    setIsSaving(true);
    try {
      const res = await onSaveUser({
        id: editingUser?.id,
        name: name.trim(),
        email: email.trim() || null,
        role: role.trim() || 'User',
        phone: phone.trim() || null,
        gender: gender || null,
        status,
        isApproved: status === 'APPROVED',
        ...(password.trim() ? { password: password.trim() } : {}),
      });

      if (res && typeof res === 'object' && 'success' in res) {
        if (res.success) {
          setIsOpen(false);
        } else {
          setErrorDialogState({
            open: true,
            message: res.error || t('errorSavingUser'),
          });
        }
      } else {
        setIsOpen(false);
      }
    } catch (err: any) {
      setErrorDialogState({
        open: true,
        message: err?.message || t('errorSavingUser'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'PENDING');
  const onlineUsers = users.filter((u) => u.isOnline);

  const uniqueRoles = Array.from(
    new Set(users.map((u) => u.role).filter(Boolean))
  ) as string[];

  // 1. Apply Filter
  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterStatus === 'pending' && u.status !== 'PENDING') return false;
    if (filterStatus === 'approved' && u.status !== 'APPROVED') return false;
    if (filterStatus === 'blocked' && u.status !== 'BLOCKED') return false;
    if (filterStatus === 'online' && !u.isOnline) return false;
    return true;
  });

  // 2. Search among filtered items
  const searchedUsers = filteredUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q))
    );
  });

  // 3. Sort final dataset
  const sortedUsers = [...searchedUsers].sort((a, b) => {
    let res = 0;
    switch (sortColumn) {
      case 'name':
        res = a.name.localeCompare(b.name);
        break;
      case 'role': {
        const roleA = getRoleLabel(a.role);
        const roleB = getRoleLabel(b.role);
        res = roleA.localeCompare(roleB);
        break;
      }
      case 'status':
        res = (a.status || '').localeCompare(b.status || '');
        break;
      case 'online':
        res = (a.isOnline ? 1 : 0) - (b.isOnline ? 1 : 0);
        break;
      case 'email':
        res = (a.email || '').localeCompare(b.email || '');
        break;
      case 'phone':
        res = (a.phone || '').localeCompare(b.phone || '');
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
  }, [searchQuery, filterRole, filterStatus, setPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

  const paginatedUsers = sortedUsers.slice(page * activeRowsPerPage, page * activeRowsPerPage + activeRowsPerPage);

  const sortOptions = useMemo(() => [
    { value: 'name', label: t('colFullName') },
    { value: 'role', label: t('colRole') },
    { value: 'status', label: t('colApprovalStatus') },
    { value: 'online', label: t('colOnlineStatus') },
    { value: 'email', label: t('colEmail') },
    { value: 'phone', label: t('colPhone') },
    { value: 'createdAt', label: t('lblCreatedDate') },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: 'approved', label: t('statusApproved') },
    { value: 'online', label: t('statusOnline') },
    { value: 'pending', label: t('statusPending') },
    { value: 'blocked', label: t('statusBlocked') },
  ], [t]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', flex: 1, minHeight: 0 }}>
      {/* PENDING USERS BANNER */}
      {pendingUsers.length > 0 && (
        <Alert
          severity="warning"
          icon={<HourglassEmptyIcon />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
              sx={{ fontWeight: 700 }}
            >
              {filterStatus === 'pending' ? t('filterAll') : t('badgePendingUsers', { count: pendingUsers.length })}
            </Button>
          }
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t('msgPendingUsersBanner', { count: pendingUsers.length })}
          </Typography>
        </Alert>
      )}

      {/* TOP ACTION BAR */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'space-between' }, alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {filterStatus === 'pending' && (
            <Chip
              label={t('lblPendingApprovals')}
              color="warning"
              onDelete={() => setFilterStatus('all')}
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {canManageUsers ? (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openNew} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('btnNewUser')}
          </Button>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <LockIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
              {t('permissionDeniedUsers')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* TABLE CARD */}
      <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('usersListTitle', { count: sortedUsers.length })}
            </Typography>
            {onRefresh && (
              <Tooltip title={t('btnRefresh')}>
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
              </Tooltip>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            {/* QUICK FILTERS */}
            <ToggleButtonGroup
              value={filterStatus === 'pending' ? 'pending' : filterStatus === 'online' ? 'online' : 'all'}
              exclusive
              onChange={(_, val) => {
                if (val) {
                  setFilterStatus(val);
                  onQuickFilterChange?.(val as any);
                }
              }}
              size="small"
              color="primary"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <ToggleButton value="all" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>
                {t('quickFilterAll')}
              </ToggleButton>
              <ToggleButton value="online" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600, color: 'success.main' }}>
                {t('quickFilterOnline')}{onlineUsers.length > 0 ? ` (${onlineUsers.length})` : ''}
              </ToggleButton>
              <ToggleButton value="pending" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>
                {t('statusPending')}{pendingUsers.length > 0 ? ` (${pendingUsers.length})` : ''}
              </ToggleButton>
            </ToggleButtonGroup>

            <TableSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
            />

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
                {activeCols.includes('online') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'online'}
                      direction={sortColumn === 'online' ? sortDirection : 'asc'}
                      onClick={() => handleSort('online')}
                    >
                      {t('colOnlineStatus')}
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
                {canManageUsers && <TableCell align="right">{t('colActions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + (canManageUsers ? 1 : 0)} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('emptyUsers')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((u) => {
                  const editable = canEditUser(u);
                  const isPending = u.status === 'PENDING';
                  const isBlocked = u.status === 'BLOCKED';
                  return (
                    <TableRow key={u.id} hover sx={{ bgcolor: isPending ? 'action.hover' : 'inherit' }}>
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
                      {activeCols.includes('online') && (
                        <TableCell>
                          {u.isOnline ? (
                            <Chip
                              icon={
                                <Box
                                  component="span"
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: '#4caf50',
                                    boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.4)',
                                    animation: 'pulse 1.5s infinite',
                                    '@keyframes pulse': {
                                      '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)' },
                                      '70%': { transform: 'scale(1.1)', boxShadow: '0 0 0 5px rgba(76, 175, 80, 0)' },
                                      '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' },
                                    },
                                  }}
                                />
                              }
                              label={t('statusOnline')}
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontWeight: 700, height: 24, fontSize: '0.75rem' }}
                            />
                          ) : (
                            <Chip
                              label={t('statusOffline')}
                              size="small"
                              variant="outlined"
                              sx={{ height: 22, fontSize: '0.7rem', color: 'text.secondary', borderColor: 'divider' }}
                            />
                          )}
                        </TableCell>
                      )}
                      {activeCols.includes('gender') && <TableCell>{getGenderLabel(u.gender)}</TableCell>}
                      {activeCols.includes('email') && <TableCell>{u.email || '—'}</TableCell>}
                      {activeCols.includes('phone') && <TableCell>{u.phone || '—'}</TableCell>}
                      {canManageUsers && (
                        <TableCell align="right">
                          {isPending ? (
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
                          ) : editable ? (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                              {u.isOnline && onForceLogoutUser && u.id !== currentUser?.id && (
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
                              <IconButton size="small" color="info" onClick={() => openEdit(u)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => onDeleteUser(u.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
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
          count={sortedUsers.length}
          rowsPerPage={activeRowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* APPROVE & ASSIGN ROLE MODAL DIALOG */}
      <Dialog open={Boolean(approveUserTarget)} onClose={() => setApproveUserTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('modalApproveUserTitle')}
        </DialogTitle>
        <DialogContent dividers>
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
                {isAdmin && <MenuItem value="Administrator">{t('roleAdministrator')}</MenuItem>}
                <MenuItem value="Manager">{t('roleManager')}</MenuItem>
                <MenuItem value="User">{t('roleUser')}</MenuItem>
                <MenuItem value="Accountant">{t('roleAccountant')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
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

      {/* USER EDIT/CREATE DIALOG */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingUser ? t('modalEditUser') : t('modalNewUser')}
            </Typography>
            {editingUser && canEditUser(editingUser) && (
              <Button
                color="error"
                size="small"
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  onDeleteUser(editingUser.id);
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
                  label={t('colFullName')}
                  placeholder={t('phFullName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblRole')}</InputLabel>
                  <Select
                    value={role}
                    label={t('lblRole')}
                    onChange={(e) => setRole(e.target.value as string)}
                  >
                    {isAdmin && <MenuItem value="Administrator">{t('roleAdministrator')}</MenuItem>}
                    <MenuItem value="Manager">{t('roleManager')}</MenuItem>
                    <MenuItem value="User">{t('roleUser')}</MenuItem>
                    <MenuItem value="Accountant">{t('roleAccountant')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblGender')}</InputLabel>
                  <Select
                    value={gender}
                    label={t('lblGender')}
                    onChange={(e) => setGender(e.target.value as string)}
                  >
                    <MenuItem value=""><em>{t('genderNotSpecified')}</em></MenuItem>
                    <MenuItem value="Male">{t('genderMale')}</MenuItem>
                    <MenuItem value="Female">{t('genderFemale')}</MenuItem>
                    <MenuItem value="Other">{t('genderOther')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {editingUser ? (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('colApprovalStatus')}</InputLabel>
                    <Select
                      value={status}
                      label={t('colApprovalStatus')}
                      onChange={(e) => setStatus(e.target.value as string)}
                    >
                      <MenuItem value="APPROVED">{t('statusApproved')}</MenuItem>
                      <MenuItem value="BLOCKED">{t('statusBlocked')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              ) : (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('colPhone')}
                    placeholder="+381 36 311 100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Grid>
              )}
              {editingUser && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('colPhone')}
                    placeholder="+381 36 311 100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label={t('colEmail')}
                  placeholder="aleksandar@ekosgreen.rs"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  type={showPassword ? 'text' : 'password'}
                  label={editingUser ? t('lblResetPassword') : t('lblPassword')}
                  placeholder={editingUser ? t('phLeaveBlankToKeep') : t('phInitialPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKeyIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
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

      {/* FORCE LOGOUT CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(forceLogoutTarget)}
        onClose={() => setForceLogoutTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExitToAppIcon color="error" />
          {t('confirmForceLogoutTitle')}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ pt: 1 }}>
            {t('confirmForceLogoutMessage', { name: forceLogoutTarget?.name || '' })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
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
    </Box>
  );
};

export default UsersView;
