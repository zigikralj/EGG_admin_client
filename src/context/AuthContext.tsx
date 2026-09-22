import React, { createContext, useContext, useState, useEffect } from 'react';
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
  roleView: UserRole;
  setRoleView: (role: UserRole) => void;
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  isAccountant: boolean;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const expiresAt = localStorage.getItem('auth_session_expires_at');
      if (expiresAt && Date.now() >= Number(expiresAt)) {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_session_expires_at');
        localStorage.removeItem('admin_role_view');
        return null;
      }
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error('Error loading stored auth user:', e);
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

  const [roleViewState, setRoleViewState] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem('admin_role_view');
      if (stored && ['Administrator', 'Manager', 'User', 'Accountant'].includes(stored)) {
        return stored as UserRole;
      }
    } catch (e) {}
    return 'Administrator';
  });



  const logout = React.useCallback(() => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_session_expires_at');
    localStorage.removeItem('admin_role_view');
    setRoleViewState('Administrator');
    setCurrentUser(null);
  }, []);

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
  }, []);

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

  const roleView: UserRole = isRealAdmin ? roleViewState : actualRole;

  const setRoleView = React.useCallback((newRole: UserRole) => {
    setRoleViewState(newRole);
    try {
      localStorage.setItem('admin_role_view', newRole);
    } catch (e) {}
  }, []);

  const effectiveRole: UserRole = isRealAdmin ? roleView : actualRole;

  const effectiveRoleEntity = React.useMemo(() => {
    if (isRealAdmin && roleView !== actualRole) {
      return roles.find((r) => r.name === roleView) || null;
    }
    return currentRoleEntity;
  }, [isRealAdmin, roleView, actualRole, roles, currentRoleEntity]);

  const hasPermission = React.useCallback((resource: string, action: string): boolean => {
    const roleEnt = effectiveRoleEntity;
    if (!roleEnt) {
      // Safe defaults while roles are still loading or if role entity is not yet found
      if (resource === 'apps') {
        if (action === 'project-tracker') return true;
        if (action === 'data-management') {
          return Boolean(isRealAdmin || actualRole === 'Administrator' || actualRole === 'Manager');
        }
      }
      return false;
    }

    if (roleEnt.isSystemAdmin) return true;
    const perms = roleEnt.permissions || {};

    if (resource === 'apps') {
      if (action === 'project-tracker') {
        if (!Array.isArray(perms.apps)) return true;
        return perms.apps.includes('project-tracker');
      }
      if (action === 'data-management') {
        if (roleEnt.isSystemAdmin || roleEnt.name === 'Administrator' || roleEnt.name === 'Manager') return true;
        if (Array.isArray(perms.apps)) {
          return perms.apps.includes('data-management');
        }
        // Fallback: if role has permissions for ANY data management resources, allow data-management app access
        return Boolean(
          perms.projects?.length ||
          perms.clients?.length ||
          perms.permits?.length ||
          perms.invoices?.length ||
          perms.services?.length ||
          perms.providedServices?.length ||
          perms.categories?.length ||
          perms.reminders?.length ||
          perms.users?.length ||
          perms.roles?.length ||
          perms.companyInfo?.length
        );
      }
      return Array.isArray(perms.apps) && perms.apps.includes(action);
    }

    if (!perms[resource] || !Array.isArray(perms[resource])) {
      if (resource.startsWith('tracker_')) {
        const base = resource.replace('tracker_', '');
        if (perms[base] && Array.isArray(perms[base])) {
          return perms[base].includes(action);
        }
      }
      if (resource === 'wasteDisposal') {
        if (perms.providedServices && Array.isArray(perms.providedServices)) {
          return perms.providedServices.includes(action);
        }
      }
      return false;
    }
    return perms[resource].includes(action);
  }, [effectiveRoleEntity, isRealAdmin, actualRole]);

  const isAdmin = Boolean(effectiveRoleEntity?.isSystemAdmin || effectiveRole === 'Administrator');
  const isManager = effectiveRole === 'Manager';
  const isAccountant = effectiveRole === 'Accountant';
  const isUser = effectiveRole === 'User';

  const canManageClients = Boolean(isAdmin || hasPermission('clients', 'edit') || hasPermission('clients', 'create'));
  const canManagePermits = Boolean(isAdmin || hasPermission('permits', 'edit') || hasPermission('permits', 'create'));
  const canManageServices = Boolean(isAdmin || hasPermission('services', 'edit') || hasPermission('services', 'create'));
  const canManageUsers = Boolean(isAdmin || hasPermission('users', 'edit') || hasPermission('users', 'create'));
  const canManageInvoices = Boolean(isAdmin || hasPermission('invoices', 'edit') || hasPermission('invoices', 'create'));
  const canManageProvidedServices = Boolean(isAdmin || hasPermission('providedServices', 'edit') || hasPermission('providedServices', 'create'));

  const canEditUser = React.useCallback(
    (targetUser: User): boolean => {
      if (isAdmin) return true;
      const targetRoleEnt = roles.find((r) => r.name === targetUser.role) || targetUser.roleEntity;
      const isTargetAdmin = targetRoleEnt?.isSystemAdmin || targetUser.role === 'Administrator';
      if (isTargetAdmin) return false;
      return hasPermission('users', 'edit');
    },
    [isAdmin, roles, hasPermission]
  );

  const canDeleteUser = React.useCallback(
    (targetUser: User): boolean => {
      if (!currentUser) return false;
      if (targetUser.id === currentUser.id) return false;
      if (isAdmin) return true;
      const targetRoleEnt = roles.find((r) => r.name === targetUser.role) || targetUser.roleEntity;
      const isTargetAdmin = targetRoleEnt?.isSystemAdmin || targetUser.role === 'Administrator';
      if (isTargetAdmin) return false;
      return hasPermission('users', 'delete');
    },
    [isAdmin, roles, hasPermission, currentUser]
  );

  const canEditProject = React.useCallback(
    (project: Project): boolean => {
      if (isAdmin || hasPermission('projects', 'edit') || hasPermission('tracker_projects', 'edit')) return true;
      if (!currentUser) return false;

      const respName = (project.responsible || '').trim().toLowerCase();
      const curName = (currentUser.name || '').trim().toLowerCase();

      if (respName && respName === curName) return true;
      if ((project as any).responsibleId && (project as any).responsibleId === currentUser.id) return true;

      return false;
    },
    [isAdmin, hasPermission, currentUser]
  );

  const canDeleteProject = React.useCallback(
    (project: Project): boolean => {
      if (isAdmin || hasPermission('projects', 'delete') || hasPermission('tracker_projects', 'delete')) return true;
      if (!currentUser) return false;

      const respName = (project.responsible || '').trim().toLowerCase();
      const curName = (currentUser.name || '').trim().toLowerCase();

      if (respName && respName === curName) return true;
      if ((project as any).responsibleId && (project as any).responsibleId === currentUser.id) return true;

      return false;
    },
    [isAdmin, hasPermission, currentUser]
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
      role: effectiveRole,
      actualRole,
      isRealAdmin,
      roleView,
      setRoleView,
      isAdmin,
      isManager,
      isUser,
      isAccountant,
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
      effectiveRole,
      actualRole,
      isRealAdmin,
      roleView,
      setRoleView,
      isAdmin,
      isManager,
      isUser,
      isAccountant,
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
