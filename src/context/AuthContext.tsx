import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, UserRole, Project } from '../types';
import { apiFetch } from '../api';
import { API_ROUTES, STORAGE_KEYS, APP_EVENTS, USER_STATUSES, TIME_MS } from '../constants';
import { clearPersistedQueries } from '../utils/queryPersistence';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  pendingUsersCount: number;
  setPendingUsersCount: (count: number) => void;
  setCurrentUser: (user: User | null) => void;
  login: (emailOrName: string, password: string) => Promise<{ success: boolean; errorCode?: string; message?: string }>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  setUsersList: (users: User[]) => void;
  role: UserRole;
  actualRole: UserRole;
  isRealAdmin: boolean;
  isRestrictedToOwn: (resource: string) => boolean;
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
  const [serverPendingUsersCount, setServerPendingUsersCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const expiresAt = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION_EXPIRES_AT);
      if (expiresAt && Date.now() >= Number(expiresAt)) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION_EXPIRES_AT);
        return null;
      }
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          if (!expiresAt) {
            localStorage.setItem(STORAGE_KEYS.AUTH_SESSION_EXPIRES_AT, (Date.now() + TIME_MS.NINE_HOURS).toString());
          }
          return parsed;
        }
      }
      return null;
    } catch (e) {
      console.error('Error loading stored auth user:', e);
      return null;
    }
  });

  const [isRolesLoading, setIsRolesLoading] = useState<boolean>(() => {
    if (!currentUser?.id) return false;
    if (
      currentUser.permissions !== undefined ||
      currentUser.roleEntity !== undefined ||
      currentUser.isSystemAdmin !== undefined ||
      currentUser.role === 'Administrator'
    ) {
      return false;
    }
    return true;
  });

  const inFlightAuthPromiseRef = React.useRef<Promise<void> | null>(null);
  const lastAuthRefreshAtRef = React.useRef<number>(0);

  const logout = React.useCallback(() => {
    try {
      queryClient.clear();
    } catch (e) {}
    clearPersistedQueries();
    inFlightAuthPromiseRef.current = null;
    lastAuthRefreshAtRef.current = 0;
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION_EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_SESSION_LAST_ACTIVE);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGIN_LOGGED);
    sessionStorage.removeItem(STORAGE_KEYS.ACTIVITY_SESSION_ID);
    sessionStorage.removeItem(STORAGE_KEYS.ACTIVITY_SESSION_LAST_ACTIVE);
    sessionStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGIN_LOGGED);
    setServerPendingUsersCount(0);
    setCurrentUser(null);
  }, [queryClient]);

  const performAuthRefresh = React.useCallback(async (force = false) => {
    if (!currentUser?.id) {
      setIsRolesLoading(false);
      return;
    }
    if (inFlightAuthPromiseRef.current) {
      return inFlightAuthPromiseRef.current;
    }
    if (!force && Date.now() - lastAuthRefreshAtRef.current < 5000) {
      setIsRolesLoading(false);
      return;
    }

    const requestPromise = (async () => {
      try {
        const res = await apiFetch(API_ROUTES.AUTH.ME);
        lastAuthRefreshAtRef.current = Date.now();
        if (res.status === 403) {
          const data = await res.json();
          if (data.error === 'ACCOUNT_BLOCKED') {
            logout();
          }
        } else if (res.ok) {
          const updatedUser = await res.json();
          if (updatedUser) {
            setCurrentUser((prev) => {
              if (!prev) return null;
              const roleUnchanged = prev.role === updatedUser.role;
              const nextPermissions = updatedUser.permissions ?? (roleUnchanged ? prev.permissions : undefined);
              const nextRoleEntity = updatedUser.roleEntity ?? (roleUnchanged ? prev.roleEntity : undefined);
              const nextIsSystemAdmin = updatedUser.isSystemAdmin ?? (roleUnchanged ? prev.isSystemAdmin : undefined);
              const nextActivityLoggingEnabled = updatedUser.activityLoggingEnabled ?? prev.activityLoggingEnabled;
              if (
                prev.id === updatedUser.id &&
                prev.name === updatedUser.name &&
                prev.email === updatedUser.email &&
                prev.role === updatedUser.role &&
                prev.isSystemAdmin === nextIsSystemAdmin &&
                prev.activityLoggingEnabled === nextActivityLoggingEnabled &&
                JSON.stringify(prev.permissions) === JSON.stringify(nextPermissions) &&
                JSON.stringify(prev.roleEntity) === JSON.stringify(nextRoleEntity)
              ) {
                return prev;
              }
              const merged = {
                ...prev,
                ...updatedUser,
                permissions: nextPermissions,
                roleEntity: nextRoleEntity,
                isSystemAdmin: nextIsSystemAdmin,
                activityLoggingEnabled: nextActivityLoggingEnabled,
              };
              localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (err) {
        console.error('Error refreshing user session permissions:', err);
      } finally {
        inFlightAuthPromiseRef.current = null;
        setIsRolesLoading(false);
      }
    })();

    inFlightAuthPromiseRef.current = requestPromise;
    return requestPromise;
  }, [currentUser?.id, logout]);

  const refreshRoles = React.useCallback(async () => {
    await performAuthRefresh(true);
  }, [performAuthRefresh]);

  useEffect(() => {
    const handleRolesChanged = () => {
      void performAuthRefresh(true);
    };
    const handleActivityLoggingChanged = (e: Event) => {
      const enabled = (e as CustomEvent<boolean>).detail;
      if (typeof enabled === 'boolean') {
        setCurrentUser((prev) => {
          if (!prev || prev.activityLoggingEnabled === enabled) return prev;
          const merged = { ...prev, activityLoggingEnabled: enabled };
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(merged));
          return merged;
        });
      }
    };
    window.addEventListener(APP_EVENTS.ROLES_CHANGED, handleRolesChanged);
    window.addEventListener(APP_EVENTS.ACTIVITY_LOGGING_CHANGED, handleActivityLoggingChanged);
    return () => {
      window.removeEventListener(APP_EVENTS.ROLES_CHANGED, handleRolesChanged);
      window.removeEventListener(APP_EVENTS.ACTIVITY_LOGGING_CHANGED, handleActivityLoggingChanged);
    };
  }, [performAuthRefresh]);

  // Keep currentUser synced when users list updates, logging out if blocked
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const updated = users.find((u) => u.id === currentUser.id);
      if (updated) {
        if (updated.status === USER_STATUSES.BLOCKED || !updated.isApproved || updated.status !== USER_STATUSES.APPROVED) {
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
            prev.status === updated.status &&
            (updated.permissions === undefined || JSON.stringify(prev.permissions) === JSON.stringify(updated.permissions)) &&
            (updated.roleEntity === undefined || JSON.stringify(prev.roleEntity) === JSON.stringify(updated.roleEntity))
          ) {
            return prev;
          }
          const merged = {
            ...prev,
            ...updated,
            permissions: updated.permissions ?? prev.permissions,
            roleEntity: updated.roleEntity ?? prev.roleEntity,
            isSystemAdmin: updated.isSystemAdmin ?? prev.isSystemAdmin,
          };
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(merged));
          return merged;
        });
      }
    }
  }, [users, currentUser, logout]);

  // Periodic auth check to log out blocked users and keep session permissions fresh.
  // Uses Page Visibility API to pause polling when the tab is hidden,
  // eliminating all auth requests for inactive/background tabs.
  useEffect(() => {
    if (!currentUser) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const checkAuth = () => {
      void performAuthRefresh(false);
    };

    const startPolling = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(checkAuth, TIME_MS.ONE_MINUTE); // 60s — ~60 req/hr (optimized for egress bandwidth)
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

    // Check auth immediately on mount to ensure fresh session & permissions
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
  }, [currentUser?.id, performAuthRefresh]);

  useEffect(() => {
    const checkSession = () => {
      const expiresAt = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION_EXPIRES_AT);
      if (expiresAt && Date.now() >= Number(expiresAt)) {
        logout();
      }
    };

    const onAuthExpired = () => {
      logout();
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        checkSession();
      }
    };

    window.addEventListener(APP_EVENTS.AUTH_EXPIRED, onAuthExpired);
    window.addEventListener('focus', checkSession);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(checkSession, TIME_MS.FIFTEEN_SECONDS); // Check every 15 seconds

    return () => {
      window.removeEventListener(APP_EVENTS.AUTH_EXPIRED, onAuthExpired);
      window.removeEventListener('focus', checkSession);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [logout]);

  const login = React.useCallback(async (emailOrName: string, password: string) => {
    try {
      const res = await apiFetch(API_ROUTES.AUTH.LOGIN, {
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
        lastAuthRefreshAtRef.current = Date.now();
        setCurrentUser(data.user);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
        }
        const expiresInMs = (data.expiresIn || 9 * 3600) * TIME_MS.ONE_SECOND;
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION_EXPIRES_AT, (Date.now() + expiresInMs).toString());
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
      const res = await apiFetch(API_ROUTES.AUTH.REGISTER, {
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
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
    setCurrentUser(user);
  }, []);

  const pendingUsersCount = React.useMemo(() => {
    if (users.length > 0) {
      return users.filter((u) => u.status === USER_STATUSES.PENDING).length;
    }
    return serverPendingUsersCount;
  }, [users, serverPendingUsersCount]);

  const actualRole: UserRole = (currentUser?.role as UserRole) || 'User';

  const userPermissions = React.useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.permissions && typeof currentUser.permissions === 'object') {
      return currentUser.permissions;
    }
    if (currentUser.roleEntity?.permissions && typeof currentUser.roleEntity.permissions === 'object') {
      return currentUser.roleEntity.permissions;
    }
    return null;
  }, [currentUser]);

  const isRealAdmin = Boolean(
    currentUser?.isSystemAdmin ||
    currentUser?.roleEntity?.isSystemAdmin ||
    actualRole === 'Administrator'
  );
  const isSystemAdmin = isRealAdmin;
  
  const isRestrictedToOwn = React.useCallback((resource: string): boolean => {
    if (isSystemAdmin) return false;
    if (!userPermissions) return false;

    const perms = userPermissions;
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
    if (resource === 'tracker_updates') {
      if (typeof perms.tracker_projects_onlyOwn === 'boolean') return perms.tracker_projects_onlyOwn;
      if (checkOnlyOwn('tracker_projects_onlyOwn')) return true;
      if (typeof perms.projects_onlyOwn === 'boolean') return perms.projects_onlyOwn;
      if (checkOnlyOwn('projects_onlyOwn')) return true;
    } else if (resource.startsWith('tracker_')) {
      const base = resource.replace('tracker_', '');
      if (typeof perms[`${base}_onlyOwn`] === 'boolean') {
        return perms[`${base}_onlyOwn`];
      }
      if (checkOnlyOwn(`${base}_onlyOwn`)) return true;
    }

    return false;
  }, [isSystemAdmin, userPermissions]);

  const hasPermission = React.useCallback((resource: string, action: string): boolean => {
    if (isSystemAdmin) return true;
    if (!userPermissions) return false;

    const perms = userPermissions;

    if (resource === 'apps') {
      return Array.isArray(perms.apps) && perms.apps.includes(action);
    }

    // Direct check: if explicitly configured for this resource, obey it.
    if (Array.isArray(perms[resource])) {
      return perms[resource].includes(action);
    }

    // Legacy fallback ONLY if the key is undefined in perms (e.g. older role schema before separation)
    if (resource === 'tracker_updates') {
      if (Array.isArray(perms.tracker_projects)) {
        return perms.tracker_projects.includes(action);
      }
      if (Array.isArray(perms.projects)) {
        return perms.projects.includes(action);
      }
    } else if (resource.startsWith('tracker_')) {
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
  }, [isSystemAdmin, userPermissions]);

  const canManageClients = Boolean(hasPermission('clients', 'edit') || hasPermission('clients', 'create'));
  const canManagePermits = Boolean(hasPermission('permits', 'edit') || hasPermission('permits', 'create'));
  const canManageServices = Boolean(hasPermission('services', 'edit') || hasPermission('services', 'create'));
  const canManageUsers = Boolean(hasPermission('users', 'edit') || hasPermission('users', 'create'));
  const canManageInvoices = Boolean(hasPermission('invoices', 'edit') || hasPermission('invoices', 'create'));
  const canManageProvidedServices = Boolean(hasPermission('providedServices', 'edit') || hasPermission('providedServices', 'create'));

  const canEditUser = React.useCallback(
    (targetUser: User): boolean => {
      if (isSystemAdmin) return true;
      const isTargetAdmin = Boolean(
        targetUser.isSystemAdmin ||
        targetUser.roleEntity?.isSystemAdmin ||
        targetUser.role === 'Administrator'
      );
      if (isTargetAdmin) return false;
      return hasPermission('users', 'edit');
    },
    [isSystemAdmin, hasPermission]
  );

  const canDeleteUser = React.useCallback(
    (targetUser: User): boolean => {
      if (!currentUser) return false;
      if (targetUser.id === currentUser.id) return false;
      if (isSystemAdmin) return true;
      const isTargetAdmin = Boolean(
        targetUser.isSystemAdmin ||
        targetUser.roleEntity?.isSystemAdmin ||
        targetUser.role === 'Administrator'
      );
      if (isTargetAdmin) return false;
      return hasPermission('users', 'delete');
    },
    [isSystemAdmin, hasPermission, currentUser]
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
      setPendingUsersCount: setServerPendingUsersCount,
      setCurrentUser: handleSetCurrentUser,
      login,
      register,
      logout,
      setUsersList: setUsers,
      role: actualRole,
      actualRole,
      isRealAdmin,
      isRestrictedToOwn,
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
