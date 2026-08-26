import { useState, useCallback } from 'react';
import type { User, SaveResult, AppFetchers } from '../types';
import { apiFetch } from '../api';
import { useCrudOperations } from './useCrudOperations';

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

  const handleApproveUser = useCallback(
    async (userId: string, role: string) => {
      try {
        const res = await apiFetch(`/api/users/${userId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ role }),
        });
        if (res.ok) {
          fetchers.fetchUsers();
          fetchers.fetchStats();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to approve user.');
        }
      } catch (e) {
        console.error('Error approving user:', e);
      }
    },
    [authHeaders, fetchers]
  );

  const handleRejectUser = useCallback(
    async (userId: string) => {
      try {
        const res = await apiFetch(`/api/users/${userId}/reject`, {
          method: 'POST',
          headers: authHeaders(),
        });
        if (res.ok) {
          fetchers.fetchUsers();
          fetchers.fetchStats();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to reject user.');
        }
      } catch (e) {
        console.error('Error rejecting user:', e);
      }
    },
    [authHeaders, fetchers]
  );

  const handleForceLogoutUser = useCallback(
    async (userId: string) => {
      try {
        const res = await apiFetch(`/api/users/${userId}/force-logout`, {
          method: 'POST',
          headers: authHeaders(),
        });
        if (res.ok) {
          fetchers.fetchUsers();
          fetchers.fetchStats();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.error || err.message || 'Failed to force log out user');
        }
      } catch (e) {
        console.error('Error force logging out user:', e);
      }
    },
    [authHeaders, fetchers]
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
