import { useState, useCallback } from 'react';
import type { Project, SaveResult, AppFetchers } from '../types';
import { apiFetch } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { useCrudOperations } from './useCrudOperations';

/**
 * Manages project state and all project-related API operations.
 */
export function useProjects(
  authHeaders: () => Record<string, string>,
  fetchers: AppFetchers,
  onDeleteConfirm: (message: string, onConfirm: () => void) => void,
  onCompleteConfirm: (message: string, onConfirm: () => void) => void,
) {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);

  const onSuccess = useCallback(() => {
    fetchers.fetchProjects();
    fetchers.fetchStats();
  }, [fetchers]);

  const { handleSave, handleDelete } = useCrudOperations<Project>({
    basePath: '/api/projects',
    items: projects,
    authHeaders,
    onSuccess,
    onDeleteConfirm,
    deleteConfirmMessageKey: 'confirmDeleteProject',
    errorSaveMessageKey: 'errorSavingProject',
    permissionDeniedMessageKey: 'permissionDeniedOnlyOwnProjects',
  });

  const handleToggleDone = useCallback(
    (id: string) => {
      const targetProj = projects.find((p) => p.id === id);
      const isCompleting = targetProj ? !targetProj.done : true;

      const executeToggle = async () => {
        const previousProjects = [...projects];
        setProjects(projects.map((p) => (p.id === id ? { ...p, done: isCompleting } : p)));

        try {
          const res = await apiFetch(`/api/projects/${id}/toggle-done`, {
            method: 'PATCH',
            headers: authHeaders(),
          });
          if (res.ok) {
            fetchers.fetchProjects();
            fetchers.fetchStats();
          } else {
            setProjects(previousProjects);
            const err = await res.json();
            alert(err.error || t('permissionDeniedOnlyOwnProjects'));
          }
        } catch (e) {
          setProjects(previousProjects);
          console.error(e);
        }
      };

      if (isCompleting) {
        onCompleteConfirm(t('confirmCompleteProject'), executeToggle);
      } else {
        executeToggle();
      }
    },
    [projects, authHeaders, fetchers, onCompleteConfirm, t]
  );

  const handleMarkSampled = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetch(`/api/projects/${id}/sample`, {
          method: 'PATCH',
          headers: authHeaders(),
        });
        if (res.ok) {
          fetchers.fetchProjects();
          fetchers.fetchStats();
        } else {
          const err = await res.json();
          alert(err.error || t('permissionDeniedOnlyOwnProjects'));
        }
      } catch (e) {
        console.error(e);
      }
    },
    [authHeaders, fetchers, t]
  );

  return {
    projects,
    setProjects,
    handleToggleDone,
    handleMarkSampled,
    handleDeleteProject: handleDelete,
    handleSaveProject: handleSave,
  };
}
