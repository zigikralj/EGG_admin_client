import { useState, useCallback } from 'react';
import type { User, AppFetchers } from '../types';
import { useCrudOperations } from './useCrudOperations';
import { useApiAction } from './useStatusUpdate';

/**
 * Manages user state and all user-related API operations.
 */
export function useUsers(
  authHeaders: () => Record<string, string>,
  fetchers: AppFetchers,
  onDeleteConfirm: (message: string, onConfirm: () => void) => void,
) {
  const [users, setUsers] = useState<User[]>([]);

  const onSuccess = useCallback(() => {
    fetchers.fetchUsers();
    fetchers.fetchStats();
  }, [fetchers]);

  const { handleSave, handleDelete } = useCrudOperations<User>({
    basePath: '/api/users',
    items: users,
    authHeaders,
    onSuccess,
    onDeleteConfirm,
    deleteConfirmMessageKey: 'confirmDeleteUser',
    errorSaveMessageKey: 'errorSavingUser',
    permissionDeniedMessageKey: 'permissionDeniedUsers',
  });

  const performAction = useApiAction({
    authHeaders,
    onSuccess,
  });

  const handleApproveUser = useCallback(
    (userId: string, role: string) => performAction(`/api/users/${userId}/approve`, 'POST', { role }),
    [performAction]
  );

  const handleRejectUser = useCallback(
    (userId: string) => performAction(`/api/users/${userId}/reject`, 'POST'),
    [performAction]
  );

  const handleForceLogoutUser = useCallback(
    (userId: string) => performAction(`/api/users/${userId}/force-logout`, 'POST'),
    [performAction]
  );

  return {
    users,
    setUsers,
    handleSaveUser: handleSave,
    handleDeleteUser: handleDelete,
    handleApproveUser,
    handleRejectUser,
    handleForceLogoutUser,
  };
}
