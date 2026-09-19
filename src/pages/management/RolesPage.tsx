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
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useRolesQuery, useRoleMutations } from '../../queries';
import { RoleModal } from '../../components/role/RoleModal';
import { ConfirmDeleteDialog } from '../../components/dialogs/ConfirmDeleteDialog';
import type { Role } from '../../types';
import { useAuth } from '../../context/AuthContext';

const RolesPage: React.FC = () => {
  const { data: roles, isLoading, error } = useRolesQuery();
  const { createMutation, updateMutation, deleteMutation } = useRoleMutations();
  const { hasPermission } = useAuth();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const canCreate = hasPermission('roles', 'create');
  const canEdit = hasPermission('roles', 'edit');
  const canDelete = hasPermission('roles', 'delete');

  if (isLoading) return <Typography>Loading roles...</Typography>;
  if (error) return <Typography color="error">Failed to load roles.</Typography>;

  const handleAddClick = () => {
    setEditingRole(null);
    setModalOpen(true);
  };

  const handleEditClick = (role: Role) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleSaveRole = (name: string, data: Partial<Role>) => {
    if (editingRole) {
      updateMutation.mutate({ name, data }, {
        onSuccess: () => setModalOpen(false)
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setModalOpen(false)
      });
    }
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      deleteMutation.mutate(roleToDelete.name, {
        onSuccess: () => setDeleteConfirmOpen(false)
      });
    }
  };

  const systemAdminRole = roles?.find(r => r.isSystemAdmin);
  const canAssignSystemAdmin = !systemAdminRole || (editingRole?.name === systemAdminRole.name);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Roles & Permissions
        </Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick}>
            Create Role
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell><strong>Role Name</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell align="center"><strong>Access Level</strong></TableCell>
              <TableCell align="center"><strong>Assigned Users</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role.name} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 500 }}>{role.name}</Typography>
                </TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell align="center">
                  {role.isSystemAdmin ? (
                    <Chip label="System Admin" color="error" size="small" />
                  ) : (
                    <Chip label="Custom" color="primary" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip label={role._count?.users || 0} size="small" />
                </TableCell>
                <TableCell align="right">
                  {canEdit && (
                    <Tooltip title="Edit Role">
                      <IconButton onClick={() => handleEditClick(role)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canDelete && role.name !== 'Administrator' && (role._count?.users || 0) === 0 && (
                    <Tooltip title="Delete Role">
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
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  No roles found.
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
        canAssignSystemAdmin={canAssignSystemAdmin}
      />

      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${roleToDelete?.name}"?`}
      />
    </Box>
  );
};

export default RolesPage;
