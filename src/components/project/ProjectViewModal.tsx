import React from 'react';
import type { Project } from '../../types';
import ProjectModal from './ProjectModal';

export interface ProjectViewModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onEdit: (project: Project) => void;
  diffRange?: { dateFrom: string; dateTo: string } | null;
}

export const ProjectViewModal: React.FC<ProjectViewModalProps> = ({
  isOpen,
  project,
  onClose,
  onEdit,
  diffRange,
}) => {
  return (
    <ProjectModal
      isOpen={isOpen}
      project={project}
      initialMode="view"
      diffRange={diffRange}
      onClose={onClose}
      onEdit={onEdit}
    />
  );
};

export default ProjectViewModal;
