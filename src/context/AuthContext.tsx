import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, UserRole, Project, Role } from '../types';
import { apiFetch } from '../api';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  pendingUsersCount: number;
  setCurrentUser: (user: User | null) => void;
  login: (emailOrName: string, password: string) => Promise<{ success: boolean; errorCode?: string; message?: string }>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  setUsersList: (users: User[]) => void;
  role: UserRole;
  actualRole: UserRole;
  isRealAdmin: boolean;
  isRestrictedToOwn: (resource: string) => boolean;
  roles: Role[];
  canManageInvoices: boolean;
  canManageProvidedServices: boolean;
  canManageClients: boolean;
  canManagePermits: boolean;
  canManageServices: boolean;
  canManageUsers: boolean;
  isRolesLoading: boolean;
  refreshRoles: () => Promise<void>;
  canEditUser: (targetUser: User) => boolean;
  canDeleteUser: (targetUser: User) => boolean;
  canEditProject: (project: Project) => boolean;
  canDeleteProject: (project: Project) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const expiresAt = localStorage.getItem('auth_session_expires_at');
      if (expiresAt && Date.now() >= Number(expiresAt)) {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_session_expires_at');
        return null;
      }
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) return parsed;
      }
      return null;
    } catch (e) {
      console.error('Error loading stored auth user:', e);
      return null;
    }
  });

  const [roles, setRolesState] = useState<Role[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState<boolean>(() => Boolean(currentUser?.id));

  const refreshRoles = React.useCallback(async () => {
    if (!currentUser?.id) {
      setRolesState([]);
      setIsRolesLoading(false);
      return;
    }
    try {
      setIsRolesLoading(true);
      const res = await apiFetch('/api/roles', { headers: { 'X-User-Id': currentUser.id } });
      if (res.ok) {
        const data: Role[] = await res.json();
        setRolesState(data);
        const myUpdatedRole = data.find((r: Role) => r.name === currentUser.role);
        if (myUpdatedRole) {
          setCurrentUser((prev) => {
            if (!prev) return null;
            if (JSON.stringify(prev.roleEntity) === JSON.stringify(myUpdatedRole)) return prev;
            const next = { ...prev, roleEntity: myUpdatedRole };
            localStorage.setItem('auth_user', JSON.stringify(next));
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Error fetching roles for AuthContext:', err);
    } finally {
      setIsRolesLoading(false);
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    refreshRoles();
  }, [refreshRoles]);

  useEffect(() => {
    const handleRolesChanged = () => {
      refreshRoles();
    };
    window.addEventListener('roles:changed', handleRolesChanged);
    return () => {
      window.removeEventListener('roles:changed', handleRolesChanged);
    };
  }, [refreshRoles]);

  const logout = React.useCallback(() => {
    try {
      queryClient.clear();
    } catch (e) {}
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_session_expires_at');
    setCurrentUser(null);
  }, [queryClient]);

  // Keep currentUser synced when users list updates, logging out if blocked
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const updated = users.find((u) => u.id === currentUser.id);
      if (updated) {
        if (updated.status === 'BLOCKED' || (updated.isApproved === false && updated.status !== 'PENDING')) {
          logout();
          return;
        }
        setCurrentUser((prev) => {
          if (!prev) return updated;
          if (
            prev.id === updated.id &&
            prev.name === updated.name &&
            prev.email === updated.email &&
            prev.role === updated.role &&
            prev.phone === updated.phone &&
            prev.isApproved === updated.isApproved &&
            prev.status === updated.status
          ) {
            return prev;
          }
          localStorage.setItem('auth_user', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [users, currentUser, logout]);

  // Periodic auth check to log out blocked users.
  // Uses Page Visibility API to pause polling when the tab is hidden,
  // eliminating all auth requests for inactive/background tabs.
  useEffect(() => {
    if (!currentUser) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const checkAuth = async () => {
      try {
        const res = await apiFetch('/api/auth/me', {
          headers: { 'X-User-Id': currentUser.id },
        });
        if (res.status === 403) {
          const data = await res.json();
          if (data.error === 'ACCOUNT_BLOCKED') {
            logout();
          }
        } else if (res.ok) {
          const updatedUser = await res.json();
          if (updatedUser) {
            setCurrentUser((prev) => {
              if (!prev) return updatedUser;
              if (
                prev.id === updatedUser.id &&
                prev.name === updatedUser.name &&
                prev.email === updatedUser.email &&
                prev.role === updatedUser.role &&
                JSON.stringify(prev.roleEntity) === JSON.stringify(updatedUser.roleEntity)
              ) {
                return prev;
              }
              const merged = { ...prev, ...updatedUser };
              localStorage.setItem('auth_user', JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (e) {}
    };

    const startPolling = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(checkAuth, 30000); // 30s — ~120 req/hr vs old 4s (~900 req/hr)
    };

    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Tab became visible: check immediately then resume polling
        checkAuth();
        startPolling();
      }
    };

    // Check auth immediately on mount to ensure fresh roleEntity & permissions
    checkAuth();

    // Start polling only if tab is currently visible
    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, logout]);

  useEffect(() => {
    const checkSession = () => {
      const expiresAt = localStorage.getItem('auth_session_expires_at');
      if (expiresAt && Date.now() >= Number(expiresAt)) {
        logout();
      }
    };

    const onAuthExpired = () => {
      logout();
    };

    window.addEventListener('auth:expired', onAuthExpired);
    const interval = setInterval(checkSession, 15000); // Check every 15 seconds

    return () => {
      window.removeEventListener('auth:expired', onAuthExpired);
      clearInterval(interval);
    };
  }, [logout]);

  const login = React.useCallback(async (emailOrName: string, password: string) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrName, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          errorCode: data.error || 'LOGIN_FAILED',
          message: data.message || 'Login failed. Please check your credentials.',
        };
      }

      if (data.user) {
        try {
          queryClient.clear();
        } catch (e) {}
        setCurrentUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        const expiresInMs = (data.expiresIn || 9 * 3600) * 1000;
        localStorage.setItem('auth_session_expires_at', (Date.now() + expiresInMs).toString());
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server.' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }, [queryClient]);

  const register = React.useCallback(async (userData: { name: string; email: string; phone?: string; password: string }) => {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.error || 'Registration failed.',
        };
      }

      return {
        success: true,
        message: data.message || 'Registration submitted successfully!',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }, []);


  const handleSetCurrentUser = React.useCallback((user: User | null) => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
    setCurrentUser(user);
  }, []);

  const pendingUsersCount = React.useMemo(() => {
    return users.filter((u) => u.status === 'PENDING').length;
  }, [users]);

  const actualRole: UserRole = (currentUser?.role as UserRole) || 'User';

  const currentRoleEntity = React.useMemo(() => {
    if (!currentUser) return null;
    return roles.find((r) => r.name === currentUser.role) || currentUser.roleEntity || null;
  }, [currentUser, roles]);

  const isRealAdmin = Boolean(currentRoleEntity?.isSystemAdmin || actualRole === 'Administrator');
  const isSystemAdmin = isRealAdmin;
  
  const isRestrictedToOwn = React.useCallback((resource: string): boolean => {
    if (isSystemAdmin) return false;
    const roleEnt = currentRoleEntity;
    if (!roleEnt) return false;
    if (roleEnt.isSystemAdmin) return false;

    const perms = roleEnt.permissions || {};
    const checkOnlyOwn = (key: string) => {
      const val = perms[key];
      if (val === true) return true;
      if (Array.isArray(val) && val.length > 0) return true;
      return false;
    };

    const directKey = `${resource}_onlyOwn`;
    if (typeof perms[directKey] === 'boolean') {
      return perms[directKey];
    }
    if (checkOnlyOwn(directKey)) return true;

    // Legacy fallback ONLY if tracker_* is not configured
    if (resource.startsWith('tracker_')) {
      const base = resource.replace('tracker_', '');
      if (typeof perms[`${base}_onlyOwn`] === 'boolean') {
        return perms[`${base}_onlyOwn`];
      }
      if (checkOnlyOwn(`${base}_onlyOwn`)) return true;
    }

    return false;
  }, [isSystemAdmin, currentRoleEntity]);

  const hasPermission = React.useCallback((resource: string, action: string): boolean => {
    if (isSystemAdmin) return true;

    const roleEnt = currentRoleEntity;
    if (!roleEnt) {
      return false;
    }

    if (roleEnt.isSystemAdmin) return true;
    const perms = roleEnt.permissions || {};

    if (resource === 'apps') {
      return Array.isArray(perms.apps) && perms.apps.includes(action);
    }

    // Direct check: if explicitly configured for this resource, obey it.
    if (Array.isArray(perms[resource])) {
      return perms[resource].includes(action);
    }

    // Legacy fallback ONLY if the key is undefined in perms (e.g. older role schema before separation)
    if (resource.startsWith('tracker_')) {
      const base = resource.replace('tracker_', '');
      if (Array.isArray(perms[base])) {
        return perms[base].includes(action);
      }
    } else if (resource === 'wasteDisposal') {
      if (Array.isArray(perms.providedServices)) {
        return perms.providedServices.includes(action);
      }
    }

    return false;
  }, [isSystemAdmin, currentRoleEntity]);

  const canManageClients = Boolean(hasPermission('clients', 'edit') || hasPermission('clients', 'create'));
  const canManagePermits = Boolean(hasPermission('permits', 'edit') || hasPermission('permits', 'create'));
  const canManageServices = Boolean(hasPermission('services', 'edit') || hasPermission('services', 'create'));
  const canManageUsers = Boolean(hasPermission('users', 'edit') || hasPermission('users', 'create'));
  const canManageInvoices = Boolean(hasPermission('invoices', 'edit') || hasPermission('invoices', 'create'));
  const canManageProvidedServices = Boolean(hasPermission('providedServices', 'edit') || hasPermission('providedServices', 'create'));

  const canEditUser = React.useCallback(
    (targetUser: User): boolean => {
      if (isSystemAdmin) return true;
      const targetRoleEnt = roles.find((r) => r.name === targetUser.role) || targetUser.roleEntity;
      const isTargetAdmin = targetRoleEnt?.isSystemAdmin || targetUser.role === 'Administrator';
      if (isTargetAdmin) return false;
      return hasPermission('users', 'edit');
    },
    [isSystemAdmin, roles, hasPermission]
  );

  const canDeleteUser = React.useCallback(
    (targetUser: User): boolean => {
      if (!currentUser) return false;
      if (targetUser.id === currentUser.id) return false;
      if (isSystemAdmin) return true;
      const targetRoleEnt = roles.find((r) => r.name === targetUser.role) || targetUser.roleEntity;
      const isTargetAdmin = targetRoleEnt?.isSystemAdmin || targetUser.role === 'Administrator';
      if (isTargetAdmin) return false;
      return hasPermission('users', 'delete');
    },
    [isSystemAdmin, roles, hasPermission, currentUser]
  );

  const canEditProject = React.useCallback(
    (project: Project): boolean => {
      const isOwner = Boolean(
        currentUser && (
          ((project.responsible || '').trim().toLowerCase() === (currentUser.name || '').trim().toLowerCase()) ||
          ((project as any).responsibleId && (project as any).responsibleId === currentUser.id)
        )
      );

      const hasEdit = hasPermission('projects', 'edit') || hasPermission('tracker_projects', 'edit');
      if (!hasEdit) return false;

      if (isRestrictedToOwn('projects') || isRestrictedToOwn('tracker_projects')) {
        return isOwner;
      }

      return true;
    },
    [hasPermission, isRestrictedToOwn, currentUser]
  );

  const canDeleteProject = React.useCallback(
    (project: Project): boolean => {
      const isOwner = Boolean(
        currentUser && (
          ((project.responsible || '').trim().toLowerCase() === (currentUser.name || '').trim().toLowerCase()) ||
          ((project as any).responsibleId && (project as any).responsibleId === currentUser.id)
        )
      );

      const hasDelete = hasPermission('projects', 'delete') || hasPermission('tracker_projects', 'delete');
      if (!hasDelete) return false;

      if (isRestrictedToOwn('projects') || isRestrictedToOwn('tracker_projects')) {
        return isOwner;
      }

      return true;
    },
    [hasPermission, isRestrictedToOwn, currentUser]
  );

  const value = React.useMemo(
    () => ({
      currentUser,
      users,
      pendingUsersCount,
      setCurrentUser: handleSetCurrentUser,
      login,
      register,
      logout,
      setUsersList: setUsers,
      role: actualRole,
      actualRole,
      isRealAdmin,
      isRestrictedToOwn,
      roles,
      canManageInvoices,
      canManageProvidedServices,
      canManageClients,
      canManagePermits,
      canManageServices,
      canManageUsers,
      isRolesLoading,
      refreshRoles,
      canEditUser,
      canDeleteUser,
      canEditProject,
      canDeleteProject,
      hasPermission,
    }),
    [
      currentUser,
      users,
      pendingUsersCount,
      handleSetCurrentUser,
      login,
      register,
      logout,
      actualRole,
      isRealAdmin,
      isRestrictedToOwn,
      roles,
      canManageInvoices,
      canManageProvidedServices,
      canManageClients,
      canManagePermits,
      canManageServices,
      canManageUsers,
      isRolesLoading,
      refreshRoles,
      canEditUser,
      canDeleteUser,
      canEditProject,
      canDeleteProject,
      hasPermission,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
