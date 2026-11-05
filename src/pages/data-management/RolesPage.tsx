import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import { EditIcon, DeleteIcon, AddIcon } from '../../components/icons';
import { useRolesQuery, useRoleMutations } from '../../queries';
import { RoleModal } from '../../components/role/RoleModal';
import { type ModalMode } from '../../components/common/modal/ViewEditModalBase';
import { ConfirmDeleteDialog } from '../../components/common/dialogs/ConfirmDeleteDialog';
import { ErrorDialog } from '../../components/common/dialogs/ErrorDialog';
import type { Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const RolesPage: React.FC = () => {
  const { data: roles, isLoading, error } = useRolesQuery();
  const { createMutation, updateMutation, deleteMutation } = useRoleMutations();
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const canCreate = hasPermission('roles', 'create');
  const canEdit = hasPermission('roles', 'edit');
  const canDelete = hasPermission('roles', 'delete');

  if (isLoading) return <Typography>{t('loadingRoles')}</Typography>;
  if (error) return <Typography color="error">{t('errorLoadingRoles')}</Typography>;

  const handleAddClick = () => {
    setEditingRole(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleViewClick = (role: Role) => {
    setEditingRole(role);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditClick = (role: Role) => {
    setEditingRole(role);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleSaveRole = (name: string, data: Partial<Role>) => {
    if (editingRole) {
      updateMutation.mutate({ name, data }, {
        onSuccess: () => setModalOpen(false),
        onError: (err: any) => setErrorDialogState({ open: true, message: err?.message || 'Failed to update role' }),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setModalOpen(false),
        onError: (err: any) => setErrorDialogState({ open: true, message: err?.message || 'Failed to create role' }),
      });
    }
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      deleteMutation.mutate(roleToDelete.name, {
        onSuccess: () => setDeleteConfirmOpen(false),
        onError: (err: any) => setErrorDialogState({ open: true, message: err?.message || 'Failed to delete role' }),
      });
    }
  };

  const systemAdminRole = roles?.find(r => r.isSystemAdmin);
  const canAssignSystemAdmin = !systemAdminRole || (editingRole?.name === systemAdminRole.name);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {t('rolesAndPermissions')}
        </Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick}>
            {t('btnCreateRole')}
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell><strong>{t('colRoleName')}</strong></TableCell>
              <TableCell><strong>{t('colDescription')}</strong></TableCell>
              <TableCell align="center"><strong>{t('colAccessLevel')}</strong></TableCell>
              <TableCell align="right"><strong>{t('colActions')}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role.name} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewClick(role)}>
                <TableCell>
                  <Typography sx={{ fontWeight: 500 }}>{role.name}</Typography>
                </TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {role.isSystemAdmin ? (
                      <Chip label={t('badgeSystemAdmin')} color="error" size="small" />
                    ) : (
                      <Chip label={t('badgeCustomRole')} color="primary" size="small" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  {canEdit && (
                    <Tooltip title={t('modalEditRole')}>
                      <IconButton onClick={() => handleEditClick(role)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canDelete && !role.isSystemAdmin && (
                    <Tooltip title={t('btnDeleteRole')}>
                      <IconButton onClick={() => handleDeleteClick(role)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {roles?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  {t('emptyRoles')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <RoleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveRole}
        role={editingRole}
        mode={modalMode}
        onModeChange={setModalMode}
        canAssignSystemAdmin={canAssignSystemAdmin}
        canEdit={canEdit}
        canDelete={canDelete}
        onDeleteRole={(name) => {
          const r = roles?.find(x => x.name === name);
          if (r) handleDeleteClick(r);
        }}
      />

      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={t('btnDeleteRole')}
        message={t('confirmDeleteRoleMessage', { name: roleToDelete?.name || '' })}
      />

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState({ open: false, message: '' })}
      />
    </Box>
  );
};

export default RolesPage;
