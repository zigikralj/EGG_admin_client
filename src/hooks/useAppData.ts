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

  const fetchClients = useCallback(async () => {
    try {
      const res = await apiFetch('/api/clients', { headers: authHeaders() });
      if (res.ok) setClients(await res.json());
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, [authHeaders, setClients]);

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

  const fetchServices = useCallback(async () => {
    try {
      const res = await apiFetch('/api/services', { headers: authHeaders() });
      if (res.ok) setServices(await res.json());
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }, [authHeaders, setServices]);

  const fetchProvidedServices = useCallback(async () => {
    try {
      const res = await apiFetch('/api/provided-services', { headers: authHeaders() });
      if (res.ok) setProvidedServices(await res.json());
    } catch (error) {
      console.error('Error fetching provided services:', error);
    }
  }, [authHeaders, setProvidedServices]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiFetch('/api/categories', { headers: authHeaders() });
      if (res.ok) setCategories(await res.json());
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [authHeaders, setCategories]);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await apiFetch('/api/reminders', { headers: authHeaders() });
      if (res.ok) setReminders(await res.json());
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  }, [authHeaders, setReminders]);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await apiFetch('/api/invoices', { headers: authHeaders() });
      if (res.ok) setInvoices(await res.json());
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  }, [authHeaders, setInvoices]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch('/api/projects/stats', { headers: authHeaders() });
      if (res.ok) setStats(await res.json());
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [authHeaders, setStats]);

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
