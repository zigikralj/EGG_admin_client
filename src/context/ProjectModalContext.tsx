import React, { createContext, useContext, useState, useCallback, Suspense } from 'react';
import type { Project } from '../types';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';

const ProjectModal = React.lazy(() => import('../components/project/ProjectModal'));

export interface ProjectModalContextType {
  openViewProject: (project: Project, diffRange?: { dateFrom: string; dateTo: string } | null) => void;
  openEditProject: (project: Project | null) => void;
  openNewProject: () => void;
  openProjectById: (projectId: string) => Promise<void>;
  closeProjectModal: () => void;
  closeProjectViewModal: () => void;
}

const ProjectModalContext = createContext<ProjectModalContextType | undefined>(undefined);

export const ProjectModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    project: Project | null;
    initialMode: 'view' | 'edit' | 'create';
    diffRange?: { dateFrom: string; dateTo: string } | null;
  }>({
    isOpen: false,
    project: null,
    initialMode: 'view',
    diffRange: null,
  });

  const openViewProject = useCallback((project: Project, diffRange?: { dateFrom: string; dateTo: string } | null) => {
    setModalState({
      isOpen: true,
      project,
      initialMode: 'view',
      diffRange: diffRange || null,
    });
  }, []);

  const openEditProject = useCallback((project: Project | null) => {
    setModalState({
      isOpen: true,
      project,
      initialMode: project ? 'edit' : 'create',
      diffRange: null,
    });
  }, []);

  const openNewProject = useCallback(() => {
    openEditProject(null);
  }, [openEditProject]);

  const openProjectById = useCallback(async (projectId: string) => {
    try {
      const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}/${projectId}`);
      if (res.ok) {
        const target: Project = await res.json();
        setModalState({
          isOpen: true,
          project: target,
          initialMode: 'view',
          diffRange: null,
        });
      }
    } catch (e) {
      console.error('Error fetching project by id:', e);
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const contextValue = React.useMemo<ProjectModalContextType>(() => ({
    openViewProject,
    openEditProject,
    openNewProject,
    openProjectById,
    closeProjectModal: closeModal,
    closeProjectViewModal: closeModal,
  }), [openViewProject, openEditProject, openNewProject, openProjectById, closeModal]);

  return (
    <ProjectModalContext.Provider value={contextValue}>
      {children}

      {modalState.isOpen && (
        <Suspense fallback={null}>
          <ProjectModal
            isOpen={modalState.isOpen}
            project={modalState.project}
            initialMode={modalState.initialMode}
            diffRange={modalState.diffRange}
            onClose={closeModal}
            onEdit={(proj) => {
              setModalState((prev) => ({
                ...prev,
                project: proj,
                initialMode: 'edit',
              }));
            }}
          />
        </Suspense>
      )}
    </ProjectModalContext.Provider>
  );
};

export const useProjectModal = (): ProjectModalContextType => {
  const context = useContext(ProjectModalContext);
  if (!context) {
    return {
      openViewProject: () => {},
      openEditProject: () => {},
      openNewProject: () => {},
      openProjectById: async () => {},
      closeProjectModal: () => {},
      closeProjectViewModal: () => {},
    };
  }
  return context;
};
