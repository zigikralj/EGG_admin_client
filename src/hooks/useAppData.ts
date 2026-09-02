import { useState, useCallback } from 'react';
import type { Project, Client, User, Service, ProvidedService, Category, Reminder, Invoice, ProjectStats } from '../types';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

interface AppDataSetters {
  setProjects: (projects: Project[]) => void;
  setClients: (clients: Client[]) => void;
  setUsers: (users: User[]) => void;
  setServices: (services: Service[]) => void;
  setProvidedServices: (providedServices: ProvidedService[]) => void;
  setCategories: (categories: Category[]) => void;
  setReminders: (reminders: Reminder[]) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setStats: (stats: ProjectStats) => void;
}

function useFetcher<T>(
  path: string,
  setter: (data: T) => void,
  authHeaders: () => Record<string, string>
) {
  return useCallback(async () => {
    try {
      const res = await apiFetch(path, { headers: authHeaders() });
      if (res.ok) setter(await res.json());
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
    }
  }, [path, setter, authHeaders]);
}

/**
 * Orchestrates all data-fetching and user preferences for the application.
 *
 * Accepts state setters from domain hooks (useProjects, useClients, etc.) so it
 * can populate them without owning the state itself.
 *
 * NOTE: fetchAllData currently fires 8 parallel requests on every mutation.
 *       Phase 4 will replace this with targeted per-domain fetches.
 *
 * @param authHeaders - Returns current auth headers
 * @param searchQuery - Current project search query (affects /api/projects fetch)
 * @param setters - State setters from each domain hook
 */
export function useAppData(
  authHeaders: () => Record<string, string>,
  searchQuery: string,
  setters: AppDataSetters,
) {
  const { currentUser, setUsersList, logout } = useAuth();
  const [userPreferences, setUserPreferences] = useState<Record<string, any>>({});

  const {
    setProjects,
    setClients,
    setUsers,
    setServices,
    setProvidedServices,
    setCategories,
    setReminders,
    setInvoices,
    setStats,
  } = setters;

  const fetchProjects = useCallback(async () => {
    try {
      const q = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const res = await apiFetch(`/api/projects${q}`, { headers: authHeaders() });
      if (res.ok) setProjects(await res.json());
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, [searchQuery, authHeaders, setProjects]);

  const fetchClients = useFetcher('/api/clients', setClients, authHeaders);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiFetch('/api/users', { headers: authHeaders() });
      if (res.ok) {
        const fetchedUsers = await res.json();
        setUsers(fetchedUsers);
        setUsersList(fetchedUsers);

        if (currentUser) {
          const currentInList = fetchedUsers.find((u: any) => u.id === currentUser.id);
          if (
            currentInList &&
            (currentInList.status === 'BLOCKED' ||
              (currentInList.isApproved === false && currentInList.status !== 'PENDING'))
          ) {
            logout();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [authHeaders, setUsers, setUsersList, currentUser, logout]);

  const fetchServices = useFetcher('/api/services', setServices, authHeaders);
  const fetchProvidedServices = useFetcher('/api/provided-services', setProvidedServices, authHeaders);
  const fetchCategories = useFetcher('/api/categories', setCategories, authHeaders);
  const fetchReminders = useFetcher('/api/reminders', setReminders, authHeaders);
  const fetchInvoices = useFetcher('/api/invoices', setInvoices, authHeaders);
  const fetchStats = useFetcher('/api/projects/stats', setStats, authHeaders);

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchProjects(),
      fetchClients(),
      fetchUsers(),
      fetchServices(),
      fetchProvidedServices(),
      fetchCategories(),
      fetchReminders(),
      fetchInvoices(),
      fetchStats(),
    ]);
  }, [
    fetchProjects,
    fetchClients,
    fetchUsers,
    fetchServices,
    fetchProvidedServices,
    fetchCategories,
    fetchReminders,
    fetchInvoices,
    fetchStats,
  ]);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await apiFetch('/api/preferences', { headers: authHeaders() });
      if (res.ok) {
        setUserPreferences(await res.json());
      }
    } catch (e) {
      console.error('Error fetching user preferences:', e);
    }
  }, [authHeaders]);

  const updatePreference = useCallback(
    async (key: string, value: any) => {
      // Optimistic update — apply locally immediately
      setUserPreferences((prev) => ({ ...prev, [key]: value }));
      try {
        await apiFetch(`/api/preferences/${key}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ value }),
        });
      } catch (e) {
        console.error('Error updating user preference:', e);
      }
    },
    [authHeaders]
  );

  return {
    fetchAllData,
    fetchPreferences,
    updatePreference,
    userPreferences,
    fetchers: {
      fetchProjects,
      fetchClients,
      fetchUsers,
      fetchServices,
      fetchProvidedServices,
      fetchCategories,
      fetchReminders,
      fetchInvoices,
      fetchStats,
    }
  };
}
