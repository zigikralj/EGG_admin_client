import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, Project } from '../types';
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
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  isAccountant: boolean;
  canManageInvoices: boolean;
  canToggleEntityWorkMode: boolean;
  workOnEntities: boolean;
  setWorkOnEntities: (val: boolean) => void;
  canManageClients: boolean;
  canManageServices: boolean;
  canManageUsers: boolean;
  canEditUser: (targetUser: User) => boolean;
  canEditProject: (project: Project) => boolean;
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
    return null;
  });

  const [workOnEntities, setWorkOnEntitiesState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('work_on_entities');
      if (stored !== null) return JSON.parse(stored);
    } catch (e) {}
    return true;
  });

  const setWorkOnEntities = React.useCallback((val: boolean) => {
    setWorkOnEntitiesState(val);
    try {
      localStorage.setItem('work_on_entities', JSON.stringify(val));
    } catch (e) {}
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_session_expires_at');
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

  // Periodic auth check to log out blocked users immediately
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/api/auth/me', {
          headers: { 'X-User-Id': currentUser.id },
        });
        if (res.status === 403) {
          const data = await res.json();
          if (data.error === 'ACCOUNT_BLOCKED') {
            logout();
          }
        }
      } catch (e) {}
    }, 4000);
    return () => clearInterval(interval);
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
  const isAccountant = actualRole === 'Accountant';
  const canToggleEntityWorkMode = actualRole === 'Administrator' || actualRole === 'Manager';

  const isAdmin = actualRole === 'Administrator' && (canToggleEntityWorkMode ? workOnEntities : true);
  const isManager = actualRole === 'Manager' && (canToggleEntityWorkMode ? workOnEntities : true);
  const isUser = canToggleEntityWorkMode ? !workOnEntities : actualRole === 'User';

  const canManageClients = canToggleEntityWorkMode && workOnEntities;
  const canManageServices = canToggleEntityWorkMode && workOnEntities;
  const canManageUsers = canToggleEntityWorkMode && workOnEntities;
  const canManageInvoices = actualRole === 'Administrator' || actualRole === 'Manager' || actualRole === 'Accountant';

  const canEditUser = React.useCallback(
    (targetUser: User): boolean => {
      if (actualRole === 'Administrator') return true;
      if (actualRole === 'Manager') {
        return targetUser.role !== 'Administrator';
      }
      return false;
    },
    [actualRole]
  );

  const canEditProject = React.useCallback(
    (project: Project): boolean => {
      // Manager and Administrator can edit projects of other users even in User View mode
      if (actualRole === 'Administrator' || actualRole === 'Manager') return true;
      if (!currentUser) return false;

      const respName = (project.responsible || '').trim().toLowerCase();
      const curName = (currentUser.name || '').trim().toLowerCase();

      if (respName && respName === curName) return true;
      if ((project as any).responsibleId && (project as any).responsibleId === currentUser.id) return true;

      return false;
    },
    [actualRole, currentUser]
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
      isAdmin,
      isManager,
      isUser,
      isAccountant,
      canManageInvoices,
      canToggleEntityWorkMode,
      workOnEntities,
      setWorkOnEntities,
      canManageClients,
      canManageServices,
      canManageUsers,
      canEditUser,
      canEditProject,
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
      isAdmin,
      isManager,
      isUser,
      isAccountant,
      canManageInvoices,
      canToggleEntityWorkMode,
      workOnEntities,
      setWorkOnEntities,
      canManageClients,
      canManageServices,
      canManageUsers,
      canEditUser,
      canEditProject,
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
