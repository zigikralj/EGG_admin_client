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
  Alert,
  Tooltip,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import BlockIcon from '@mui/icons-material/Block';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import type { User, SaveResult } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ColumnSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';
import { ErrorDialog } from '../ErrorDialog';

interface Props {
  users: User[];
  onSaveUser: (user: Partial<User>) => Promise<SaveResult | void> | void;
  onDeleteUser: (id: string) => void;
  onApproveUser?: (userId: string, role: string) => Promise<void>;
  onRejectUser?: (userId: string) => Promise<void>;
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  sortState?: { field: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  initialFilterStatus?: string;
}

const DEFAULT_COLUMNS = ['name', 'role', 'status', 'gender', 'email', 'phone'];

export const UsersView: React.FC<Props> = ({
  users,
  onSaveUser,
  onDeleteUser,
  onApproveUser,
  onRejectUser,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  sortState,
  onSortChange,
  initialFilterStatus = 'all',
}) => {
  const { t } = useLanguage();
  const { canManageUsers, canEditUser, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [localColumns, setLocalColumns] = useState<string[]>(visibleColumns);
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Approve dialog state
  const [approveUserTarget, setApproveUserTarget] = useState<User | null>(null);
  const [approveRole, setApproveRole] = useState<string>('User');
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

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

  // Filter state
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>(initialFilterStatus);

  useEffect(() => {
    if (initialFilterStatus) {
      setFilterStatus(initialFilterStatus);
    }
  }, [initialFilterStatus]);

  const activeFilterCount =
    (filterRole !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (sortColumn !== 'name' || sortDirection !== 'asc' ? 1 : 0);

  const clearFilters = () => {
    setFilterRole('all');
    setFilterStatus('all');
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
    { id: 'name', label: t('colFullName') },
    { id: 'role', label: t('colRole') },
    { id: 'status', label: t('colApprovalStatus') },
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

  const getRoleColor = (r: string): 'secondary' | 'primary' | 'success' | 'default' => {
    switch (r) {
      case 'Administrator': return 'secondary';
      case 'Manager': return 'primary';
      case 'User': return 'success';
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

  const uniqueRoles = Array.from(
    new Set(users.map((u) => u.role).filter(Boolean))
  ) as string[];

  // 1. Apply Filter
  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterStatus === 'pending' && u.status !== 'PENDING') return false;
    if (filterStatus === 'approved' && u.status !== 'APPROVED') return false;
    if (filterStatus === 'blocked' && u.status !== 'BLOCKED') return false;
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

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, filterRole, filterStatus]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedUsers = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', flex: 1, minHeight: 0 }}>
      {/* PENDING APPROVALS ALERT BANNER */}
      {canManageUsers && pendingUsers.length > 0 && (
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
          sx={{ borderRadius: 2.5, boxShadow: 1 }}
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
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('usersListTitle', { count: sortedUsers.length })}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            {/* QUICK FILTERS */}
            <ToggleButtonGroup
              value={filterStatus === 'pending' ? 'pending' : 'all'}
              exclusive
              onChange={(_, val) => val && setFilterStatus(val)}
              size="small"
              color="primary"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <ToggleButton value="all" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>
                {t('quickFilterAll')}
              </ToggleButton>
              <ToggleButton value="pending" sx={{ flex: { xs: 1, sm: 'none' }, px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>
                {t('statusPending')}
              </ToggleButton>
            </ToggleButtonGroup>

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
              sx={{ width: { xs: '100%', sm: 200 } }}
            />

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
                      <MenuItem value="name">{t('colFullName')}</MenuItem>
                      <MenuItem value="role">{t('colRole')}</MenuItem>
                      <MenuItem value="status">{t('colApprovalStatus')}</MenuItem>
                      <MenuItem value="email">{t('colEmail')}</MenuItem>
                      <MenuItem value="phone">{t('colPhone')}</MenuItem>
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
                    <InputLabel>{t('colRole')}</InputLabel>
                    <Select
                      value={filterRole}
                      label={t('colRole')}
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <MenuItem value="all">{t('filterAll')}</MenuItem>
                      {uniqueRoles.map((r) => (
                        <MenuItem key={r} value={r}>
                          {getRoleLabel(r)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>{t('colApprovalStatus')}</InputLabel>
                    <Select
                      value={filterStatus}
                      label={t('colApprovalStatus')}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">{t('filterAll')}</MenuItem>
                      <MenuItem value="approved">{t('statusApproved')}</MenuItem>
                      <MenuItem value="pending">{t('statusPending')}</MenuItem>
                      <MenuItem value="blocked">{t('statusBlocked')}</MenuItem>
                    </Select>
                  </FormControl>
                </>
              }
            />

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
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
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
          rowsPerPageOptions={[15, 25, 50]}
          component="div"
          count={sortedUsers.length}
          rowsPerPage={rowsPerPage}
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

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};
