import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { TranslationKeys } from '../i18n/translations';
import type {
  Project,
  Client,
  User,
  Service,
  ProvidedService,
  Category,
  Reminder,
  Invoice,
  Permit,
  WasteCatalog,
  ProjectStats,
  SaveResult
} from '../types';

export function useAuthHeaders() {
  const { currentUser } = useAuth();
  return () => {
    const headers: Record<string, string> = {};
    if (currentUser?.id) headers['X-User-Id'] = currentUser.id;
    return headers;
  };
}

// --- Queries ---

export function useProjectsQuery(searchQuery: string = '') {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Project[]>({
    queryKey: ['projects', searchQuery],
    queryFn: async () => {
      const q = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const res = await apiFetch(`/api/projects${q}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    }
  });
}

export function useClientsQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await apiFetch('/api/clients', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json();
    }
  });
}

export function useUsersQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiFetch('/api/users', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });
}

export function useServicesQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await apiFetch('/api/services', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    }
  });
}

export function useProvidedServicesQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ProvidedService[]>({
    queryKey: ['provided-services'],
    queryFn: async () => {
      const res = await apiFetch('/api/provided-services', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch provided services');
      return res.json();
    }
  });
}

export function useCategoriesQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiFetch('/api/categories', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });
}


export function usePreferencesMutations() {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();

  const updatePreferenceMutation = useMutation({
    mutationKey: ['preferences'],
    meta: { silent: true },
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await apiFetch(`/api/preferences/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('Failed to update preference');
      return res.json();
    },
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['preferences'] });
      const previousPreferences = queryClient.getQueryData<Record<string, any>>(['preferences']);
      if (previousPreferences) {
        queryClient.setQueryData<Record<string, any>>(['preferences'], {
          ...previousPreferences,
          [key]: value,
        });
      }
      return { previousPreferences };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(['preferences'], context.previousPreferences);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  return { updatePreferenceMutation };
}

export function useRemindersQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: async () => {
      const res = await apiFetch('/api/reminders', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch reminders');
      return res.json();
    }
  });
}

export function useInvoicesQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await apiFetch('/api/invoices', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json();
    }
  });
}

export function usePermitsQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Permit[]>({
    queryKey: ['permits'],
    queryFn: async () => {
      const res = await apiFetch('/api/permits', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch permits');
      return res.json();
    }
  });
}

export function useWasteCatalogQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<WasteCatalog[]>({
    queryKey: ['waste-catalog'],
    queryFn: async () => {
      const res = await apiFetch('/api/waste-catalog', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch waste catalog');
      return res.json();
    }
  });
}

export function useStatsQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ProjectStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/projects/stats', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }
  });
}

export function usePreferencesQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Record<string, any>>({
    queryKey: ['preferences'],
    queryFn: async () => {
      const res = await apiFetch('/api/preferences', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch preferences');
      return res.json();
    },
    // Don't refetch preferences often as it interrupts UI state
    staleTime: 60 * 60 * 1000,
  });
}

// --- Generic Mutations ---

interface MutationConfig {
  basePath: string;
  queryKeyToInvalidate: string[];
  errorSaveMessageKey: keyof TranslationKeys;
  deleteConfirmMessageKey?: keyof TranslationKeys;
  permissionDeniedMessageKey?: keyof TranslationKeys;
  additionalInvalidates?: string[][]; // keys to invalidate additionally (like stats)
}

export function useGenericMutations<T extends { id?: string }>(config: MutationConfig) {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: config.queryKeyToInvalidate });
    if (config.additionalInvalidates) {
      config.additionalInvalidates.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
    }
  };

  const saveMutation = useMutation<SaveResult, Error, Partial<T>>({
    mutationFn: async (data) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      let res;
      if (data.id) {
        res = await apiFetch(`${config.basePath}/${data.id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
      } else {
        res = await apiFetch(config.basePath, { method: 'POST', headers, body: JSON.stringify(data) });
      }
      
      if (res.ok) {
        const savedItem = await res.json().catch(() => ({}));
        return { success: true, id: savedItem?.id, data: savedItem };
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || t(config.errorSaveMessageKey));
      }
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await apiFetch(`${config.basePath}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t(config.permissionDeniedMessageKey || 'permissionDeniedOnlyOwnProjects'));
      }
    },
    onSuccess: () => {
      invalidate();
    }
  });

  return {
    saveMutation,
    deleteMutation,
    handleSave: async (data: Partial<T>): Promise<SaveResult> => {
      try {
        return await saveMutation.mutateAsync(data);
      } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
      }
    },
    handleDelete: async (id: string, onDeleteConfirm: (msg: string, cb: () => void) => void) => {
       if (config.deleteConfirmMessageKey) {
          onDeleteConfirm(t(config.deleteConfirmMessageKey), async () => {
              try {
                  await deleteMutation.mutateAsync(id);
              } catch (e: any) {
                  alert(e.message);
              }
          });
       } else {
           try {
              await deleteMutation.mutateAsync(id);
          } catch (e: any) {
              alert(e.message);
          }
       }
    }
  };
}

// --- Specific Hooks ---

export function usePreferencesMutation() {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['preferences'],
    meta: { silent: true },
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await apiFetch(`/api/preferences/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('Failed to update preference');
      return { key, value };
    },
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['preferences'] });
      const previous = queryClient.getQueryData<Record<string, any>>(['preferences']);
      if (previous) {
        queryClient.setQueryData(['preferences'], { ...previous, [key]: value });
      }
      return { previous };
    },
    onError: (_err, _newPref, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['preferences'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
}

export function useGenericActionMutation() {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ path, method = 'POST', body, queryKeysToInvalidate }: { path: string, method?: string, body?: any, queryKeysToInvalidate: string[][] }) => {
      const res = await apiFetch(path, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
         const err = await res.json().catch(() => ({}));
         throw new Error(err.error || err.message || 'Action failed');
      }
      return { queryKeysToInvalidate };
    },
    onSuccess: (data) => {
      data.queryKeysToInvalidate.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
    }
  });
}

export function useProjectsMutations() {
  const generic = useGenericMutations<Project>({
    basePath: '/api/projects',
    queryKeyToInvalidate: ['projects'],
    additionalInvalidates: [['stats']],
    errorSaveMessageKey: 'errorSavingProject',
    deleteConfirmMessageKey: 'confirmDeleteProject',
    permissionDeniedMessageKey: 'permissionDeniedOnlyOwnProjects',
  });
  
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const toggleDoneMutation = useMutation({
    mutationFn: async ({ id, isCompleting: _ }: { id: string, isCompleting: boolean }) => {
      const res = await apiFetch(`/api/projects/${id}/toggle-done`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t('permissionDeniedOnlyOwnProjects'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  const markSampledMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/projects/${id}/sample`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t('permissionDeniedOnlyOwnProjects'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  return {
    ...generic,
    toggleDoneMutation,
    markSampledMutation,
  };
}

export function useClientsMutations() {
  return useGenericMutations<Client>({
    basePath: '/api/clients',
    queryKeyToInvalidate: ['clients'],
    additionalInvalidates: [['stats'], ['permits']],
    errorSaveMessageKey: 'errorSavingClient',
    deleteConfirmMessageKey: 'confirmDeleteClient',
    permissionDeniedMessageKey: 'permissionDeniedClients',
  });
}

export function useUsersMutations() {
  const generic = useGenericMutations<User>({
    basePath: '/api/users',
    queryKeyToInvalidate: ['users'],
    additionalInvalidates: [['stats']],
    errorSaveMessageKey: 'errorSavingUser',
    deleteConfirmMessageKey: 'confirmDeleteUser',
    permissionDeniedMessageKey: 'permissionDeniedUsers',
  });
  
  const actionMutation = useGenericActionMutation();
  
  const handleApproveUser = (userId: string, role: string) => {
    return actionMutation.mutateAsync({
      path: `/api/users/${userId}/approve`,
      body: { role },
      queryKeysToInvalidate: [['users'], ['stats']],
    });
  };
  
  const handleRejectUser = (userId: string) => {
    return actionMutation.mutateAsync({
      path: `/api/users/${userId}/reject`,
      queryKeysToInvalidate: [['users'], ['stats']],
    });
  };
  
  const handleForceLogoutUser = (userId: string) => {
    return actionMutation.mutateAsync({
      path: `/api/users/${userId}/force-logout`,
      queryKeysToInvalidate: [['users'], ['stats']],
    });
  };

  return {
    ...generic,
    handleApproveUser,
    handleRejectUser,
    handleForceLogoutUser,
  };
}

export function useServicesMutations() {
  return useGenericMutations<Service>({
    basePath: '/api/services',
    queryKeyToInvalidate: ['services'],
    additionalInvalidates: [['stats']],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteService',
  });
}

export function useProvidedServicesMutations() {
  return useGenericMutations<ProvidedService>({
    basePath: '/api/provided-services',
    queryKeyToInvalidate: ['provided-services'],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteProvidedService' as any,
  });
}

export function useCategoriesMutations() {
  return useGenericMutations<Category>({
    basePath: '/api/categories',
    queryKeyToInvalidate: ['categories'],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteCategory' as any,
  });
}

export function useRemindersMutations() {
  const generic = useGenericMutations<Reminder>({
    basePath: '/api/reminders',
    queryKeyToInvalidate: ['reminders'],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteReminder' as any,
  });
  
  const actionMutation = useGenericActionMutation();
  
  const handleStatusChangeReminder = (id: string, newStatus: string) => {
     return actionMutation.mutateAsync({
        path: `/api/reminders/${id}/status`,
        method: 'PATCH',
        body: { status: newStatus },
        queryKeysToInvalidate: [['reminders']],
     });
  };
  
  return {
    ...generic,
    handleStatusChangeReminder,
  };
}

export function useInvoicesMutations() {
  const generic = useGenericMutations<Invoice>({
    basePath: '/api/invoices',
    queryKeyToInvalidate: ['invoices'],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeleteInvoice' as any,
  });
  
  const actionMutation = useGenericActionMutation();
  
  const handleUpdateInvoiceStatus = (id: string, status: string, paymentDate?: string | null) => {
     return actionMutation.mutateAsync({
        path: `/api/invoices/${id}/status`,
        method: 'PATCH',
        body: { status, paymentDate },
        queryKeysToInvalidate: [['invoices']],
     });
  };
  
  return {
    ...generic,
    handleUpdateInvoiceStatus,
  };
}

export function usePermitsMutations() {
  return useGenericMutations<Permit>({
    basePath: '/api/permits',
    queryKeyToInvalidate: ['permits'],
    additionalInvalidates: [['clients'], ['stats']],
    errorSaveMessageKey: 'errorSavingService',
    deleteConfirmMessageKey: 'confirmDeletePermit' as any,
  });
}
