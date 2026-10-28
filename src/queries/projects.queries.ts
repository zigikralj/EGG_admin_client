import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { fetchWithDeltaSync } from '../utils/deltaSync';
import { API_ROUTES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuthHeaders, buildPaginationQueryParams, useGenericMutations } from './queryUtils';
import type {
  Project,
  ProjectUpdateSummary,
  ProjectUpdatesDiffResult,
  PaginatedResponse,
  SaveResult,
} from '../types';

export function useProjectsQuery(searchQuery: string = '', options?: { done?: boolean; enabled?: boolean }) {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const queryKey = ['projects', currentUser?.id, searchQuery, options?.done] as const;

  return useQuery<Project[]>({
    queryKey,
    enabled: options?.enabled ?? true,
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (options?.done !== undefined) params.set('done', String(options.done));
      const q = params.toString() ? `?${params.toString()}` : '';
      return fetchWithDeltaSync<Project>({
        url: `${API_ROUTES.PROJECTS.BASE}${q}`,
        queryKey,
        queryClient,
        headers: getAuthHeaders(),
      });
    },
  });
}

export function useProjectsSummaryQuery(options?: { enabled?: boolean }) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Project[]>({
    queryKey: ['projects', 'summary'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}?fields=summary`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch projects summary');
      return res.json();
    },
    staleTime: 60_000,
  });
}

export interface PaginatedProjectsParams {
  page: number; // 0-indexed from MUI
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  type?: string;
  clientId?: string;
  clientName?: string;
  responsible?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  done?: boolean;
}

export function usePaginatedProjectsQuery(params: PaginatedProjectsParams, enabled: boolean = true) {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  const queryKey = [
    'projects',
    'paginated',
    currentUser?.id,
    params.page,
    params.rowsPerPage,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.status,
    params.type,
    params.clientId,
    params.clientName,
    params.responsible,
    params.dateFrom,
    params.dateTo,
    params.dateField,
    params.done,
  ] as const;

  return useQuery<PaginatedResponse<Project>>({
    queryKey,
    queryFn: async () => {
      const q = buildPaginationQueryParams(
        {
          page: params.page,
          rowsPerPage: params.rowsPerPage,
          sortColumn: params.sortBy,
          sortDirection: params.sortOrder,
          searchQuery: params.search,
        },
        {
          status: params.status,
          type: params.type,
          clientId: params.clientId,
          clientName: params.clientName,
          responsible: params.responsible,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          dateField: params.dateField,
          done: params.done,
        }
      );

      const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch paginated projects');
      const data = await res.json();
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          page: params.page + 1,
          limit: params.rowsPerPage,
          totalPages: Math.ceil(data.length / (params.rowsPerPage || 1)) || 1,
          hasMore: false,
        };
      }
      return data;
    },
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 30_000,
  });
}

export interface InfiniteProjectsParams {
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  type?: string;
  clientId?: string;
  clientName?: string;
  responsible?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  done?: boolean;
}

export function useInfiniteProjectsQuery(params: InfiniteProjectsParams = {}, enabled: boolean = true) {
  const { currentUser } = useAuth();
  const getAuthHeaders = useAuthHeaders();
  const limit = params.limit || 12;
  const queryKey = [
    'projects',
    'infinite',
    currentUser?.id,
    limit,
    params.sortBy,
    params.sortOrder,
    params.search,
    params.status,
    params.type,
    params.clientId,
    params.clientName,
    params.responsible,
    params.dateFrom,
    params.dateTo,
    params.dateField,
    params.done,
  ] as const;

  return useInfiniteQuery<PaginatedResponse<Project>>({
    queryKey,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const q = new URLSearchParams();
      q.set('page', String(pageParam));
      q.set('limit', String(limit));
      if (params.sortBy) q.set('sortBy', params.sortBy);
      if (params.sortOrder) q.set('sortOrder', params.sortOrder);
      if (params.search?.trim()) q.set('search', params.search.trim());
      if (params.status && params.status !== 'all') q.set('status', params.status);
      if (params.type && params.type !== 'all') q.set('type', params.type);
      if (params.clientId && params.clientId !== 'all') q.set('clientId', params.clientId);
      if (params.clientName && params.clientName !== 'all') q.set('clientName', params.clientName);
      if (params.responsible && params.responsible !== 'all') q.set('responsible', params.responsible);
      if (params.dateFrom) q.set('dateFrom', params.dateFrom);
      if (params.dateTo) q.set('dateTo', params.dateTo);
      if (params.dateField) q.set('dateField', params.dateField);
      if (params.done !== undefined) q.set('done', String(params.done));

      const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      if (Array.isArray(data)) {
        const pageNum = typeof pageParam === 'number' ? pageParam : 1;
        return {
          items: data,
          total: data.length,
          page: pageNum,
          limit,
          totalPages: Math.ceil(data.length / limit) || 1,
          hasMore: false,
        };
      }
      return data;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Fetches full project details by ID, including complete rich-text HTML notes.
 * Used on-demand for modals, popovers, and expanded project cards.
 */
export function useProjectDetailsQuery(id: string | undefined, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Project>({
    queryKey: ['projects', 'details', id],
    queryFn: async () => {
      const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch project details');
      return res.json();
    },
    enabled: Boolean(id) && enabled,
    meta: { silent: true },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

export interface ProjectNoteData {
  id: string | null;
  projectId: string;
  content: string;
  version: number;
  updatedAt: string | null;
}

export function useProjectNoteQuery(projectId: string | undefined, enabled: boolean = true) {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  return useQuery<ProjectNoteData>({
    queryKey: ['projects', 'note', projectId],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.PROJECTS.NOTE(projectId!), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch project note');
      return res.json();
    },
    initialData: () => {
      if (!projectId) return undefined;
      const cached = queryClient.getQueryData<Project>(['projects', 'details', projectId]);
      if (cached && cached.notes !== undefined && cached.notes !== null) {
        return {
          id: (cached as any).note?.id || null,
          projectId,
          content: cached.notes,
          version: (cached as any).note?.version || 1,
          updatedAt: (cached as any).note?.updatedAt || null,
        };
      }
      return undefined;
    },
    enabled: Boolean(projectId) && enabled,
    meta: { silent: true },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

export interface ProjectUpdatesResponse {
  total: number;
  dateFrom: string;
  dateTo: string;
  limit: number;
  offset: number;
  updates: ProjectUpdateSummary[];
}

export function useProjectUpdatesQuery(
  params: {
    dateFrom?: string;
    dateTo?: string;
    responsibleId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  },
  enabled: boolean = true
) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ProjectUpdatesResponse>({
    queryKey: ['projects', 'updates', params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.dateFrom) q.set('dateFrom', params.dateFrom);
      if (params.dateTo) q.set('dateTo', params.dateTo);
      if (params.responsibleId) q.set('responsibleId', params.responsibleId);
      if (params.search) q.set('search', params.search);
      if (params.limit !== undefined) q.set('limit', String(params.limit));
      if (params.offset !== undefined) q.set('offset', String(params.offset));

      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await apiFetch(`${API_ROUTES.PROJECTS.UPDATES}${queryStr}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch project updates');
      return res.json();
    },
    enabled,
    meta: { silent: true },
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useProjectUpdatesDiffQuery(
  projectId: string | undefined,
  dateFrom: string | undefined,
  dateTo: string | undefined,
  enabled: boolean = true
) {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<ProjectUpdatesDiffResult>({
    queryKey: ['projects', 'updates-diff', projectId, dateFrom, dateTo],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (dateFrom) q.set('dateFrom', dateFrom);
      if (dateTo) q.set('dateTo', dateTo);

      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await apiFetch(`${API_ROUTES.PROJECTS.UPDATES_DIFF(projectId!)}${queryStr}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch project updates diff');
      return res.json();
    },
    enabled: Boolean(projectId && dateFrom) && enabled,
    meta: { silent: true },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

function updateProjectNotesInCache(
  old: any,
  targetId: string,
  notes: string | null,
  notesPreview: string | null
) {
  if (!old) return old;
  if (Array.isArray(old)) {
    return old.map((p: any) =>
      p && p.id === targetId ? { ...p, notes, notesPreview } : p
    );
  }
  if (old && typeof old === 'object' && Array.isArray(old.pages)) {
    return {
      ...old,
      pages: old.pages.map((page: any) => {
        if (!page || !Array.isArray(page.items)) return page;
        return {
          ...page,
          items: page.items.map((p: any) =>
            p && p.id === targetId ? { ...p, notes, notesPreview } : p
          ),
        };
      }),
    };
  }
  if (old && typeof old === 'object' && Array.isArray(old.items)) {
    return {
      ...old,
      items: old.items.map((p: any) =>
        p && p.id === targetId ? { ...p, notes, notesPreview } : p
      ),
    };
  }
  return old;
}

export function useProjectsMutations() {
  const generic = useGenericMutations<Project>({
    basePath: API_ROUTES.PROJECTS.BASE,
    queryKeyToInvalidate: ['projects'],
    errorSaveMessageKey: 'errorSavingProject',
    deleteConfirmMessageKey: 'confirmDeleteProject',
    permissionDeniedMessageKey: 'permissionDeniedOnlyOwnProjects',
  });

  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const toggleDoneMutation = useMutation({
    meta: { silent: true },
    mutationFn: async ({ id }: { id: string; isCompleting: boolean }) => {
      const res = await apiFetch(API_ROUTES.PROJECTS.TOGGLE_DONE(id), {
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
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['history-diff'] });
      queryClient.invalidateQueries({ queryKey: ['history-version'] });
    },
  });

  const updateNotesMutation = useMutation({
    meta: { silent: true },
    mutationFn: async ({ id, notes }: { id: string; notes: string | null }) => {
      const res = await apiFetch(API_ROUTES.PROJECTS.UPDATE_NOTES(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t('errorSavingProject'));
      }
      return await res.json();
    },
    onSuccess: (data: any, variables: { id: string; notes: string | null }) => {
      const targetProjectId = variables.id;
      const content = data.notes !== undefined ? data.notes : variables.notes;
      const preview = data.notesPreview !== undefined ? data.notesPreview : null;

      queryClient.setQueryData(['projects', 'note', targetProjectId], (old: any) => ({
        ...old,
        projectId: targetProjectId,
        content: content || '',
      }));

      queryClient.setQueryData(['projects', 'details', targetProjectId], (old: any) => {
        if (!old) return old;
        return { ...old, notes: content, notesPreview: preview };
      });

      queryClient.setQueriesData({ queryKey: ['projects'] }, (old: any) =>
        updateProjectNotesInCache(old, targetProjectId, content, preview)
      );

      queryClient.invalidateQueries({ queryKey: ['projects', 'note', 'revisions', targetProjectId] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['history-diff'] });
      queryClient.invalidateQueries({ queryKey: ['history-version'] });
    },
  });

  const updateNoteMutation = useMutation({
    meta: { silent: true },
    mutationFn: async ({ id, content, reason }: { id: string; content: string; reason?: string }) => {
      const res = await apiFetch(API_ROUTES.PROJECTS.NOTE(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ content, reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t('errorSavingProject'));
      }
      return await res.json();
    },
    onSuccess: (data: any, variables: { id: string; content: string; reason?: string }) => {
      const targetProjectId = variables.id;
      const preview = data.notesPreview !== undefined ? data.notesPreview : null;

      queryClient.setQueryData(['projects', 'note', targetProjectId], {
        id: data.noteId || data.id,
        projectId: targetProjectId,
        content: variables.content,
        version: data.version,
        updatedAt: data.updatedAt,
      });

      queryClient.setQueryData(['projects', 'details', targetProjectId], (old: any) => {
        if (!old) return old;
        return { ...old, notes: variables.content, notesPreview: preview };
      });

      queryClient.setQueriesData({ queryKey: ['projects'] }, (old: any) =>
        updateProjectNotesInCache(old, targetProjectId, variables.content, preview)
      );

      queryClient.invalidateQueries({ queryKey: ['projects', 'note', 'revisions', targetProjectId] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['history-diff'] });
      queryClient.invalidateQueries({ queryKey: ['history-version'] });
    },
  });

  return {
    ...generic,
    toggleDoneMutation,
    updateNotesMutation,
    updateNoteMutation,
    handleSaveNotes: async (id: string, notes: string | null): Promise<SaveResult> => {
      try {
        const data = await updateNotesMutation.mutateAsync({ id, notes });
        return { success: true, id: data.id, data };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    handleSaveNote: async (id: string, content: string, reason?: string): Promise<SaveResult> => {
      try {
        const data = await updateNoteMutation.mutateAsync({ id, content, reason });
        return { success: true, id: data.id, data };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  };
}
