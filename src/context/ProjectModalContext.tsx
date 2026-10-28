import React, { createContext, useContext, useState, useCallback, Suspense } from 'react';
import type { Project } from '../types';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';

const ProjectModal = React.lazy(() => import('../components/project/ProjectModal'));
const ProjectViewModal = React.lazy(() => import('../components/project/ProjectViewModal'));

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
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectViewModalOpen, setIsProjectViewModalOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [projectDiffRange, setProjectDiffRange] = useState<{ dateFrom: string; dateTo: string } | null>(null);

  const openViewProject = useCallback((project: Project, diffRange?: { dateFrom: string; dateTo: string } | null) => {
    setViewingProject(project);
    setProjectDiffRange(diffRange || null);
    setIsProjectViewModalOpen(true);
  }, []);

  const openEditProject = useCallback((project: Project | null) => {
    setIsProjectViewModalOpen(false);
    setViewingProject(null);
    setEditingProject(project);
    setIsProjectModalOpen(true);
  }, []);

  const openNewProject = useCallback(() => {
    openEditProject(null);
  }, [openEditProject]);

  const openProjectById = useCallback(async (projectId: string) => {
    try {
      const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}/${projectId}`);
      if (res.ok) {
        const target: Project = await res.json();
        setViewingProject(target);
        setIsProjectViewModalOpen(true);
      }
    } catch (e) {
      console.error('Error fetching project by id:', e);
    }
  }, []);

  const closeProjectModal = useCallback(() => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
  }, []);

  const closeProjectViewModal = useCallback(() => {
    setIsProjectViewModalOpen(false);
    setViewingProject(null);
    setProjectDiffRange(null);
  }, []);

  const contextValue = React.useMemo<ProjectModalContextType>(() => ({
    openViewProject,
    openEditProject,
    openNewProject,
    openProjectById,
    closeProjectModal,
    closeProjectViewModal,
  }), [openViewProject, openEditProject, openNewProject, openProjectById, closeProjectModal, closeProjectViewModal]);

  return (
    <ProjectModalContext.Provider value={contextValue}>
      {children}

      {isProjectViewModalOpen && viewingProject && (
        <Suspense fallback={null}>
          <ProjectViewModal
            isOpen={isProjectViewModalOpen}
            project={viewingProject}
            diffRange={projectDiffRange}
            onClose={closeProjectViewModal}
            onEdit={openEditProject}
          />
        </Suspense>
      )}

      {isProjectModalOpen && (
        <Suspense fallback={null}>
          <ProjectModal
            isOpen={isProjectModalOpen}
            projectToEdit={editingProject}
            onClose={closeProjectModal}
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
