import React from 'react';
import { Box } from '@mui/material';
import type { Project } from '../../types';
import ProjectUpdatesPanel from '../../components/tracker/ProjectUpdatesPanel';

import { useProjectModal } from '../../context/ProjectModalContext';

export interface TrackerUpdatesPageProps {
  onViewProject?: (project: Project, diffRange?: { dateFrom: string; dateTo: string } | null) => void;
  onOpenProjectDiff?: (project: Project, diffRange: { dateFrom: string; dateTo: string }) => void;
}

export const TrackerUpdatesPage: React.FC<TrackerUpdatesPageProps> = ({
  onViewProject: propOnViewProject,
  onOpenProjectDiff: propOnOpenProjectDiff,
}) => {
  const projectModal = useProjectModal();
  const onViewProject = propOnViewProject || projectModal.openViewProject;
  const onOpenProjectDiff = propOnOpenProjectDiff || ((project: Project, diffRange: { dateFrom: string; dateTo: string }) => {
    projectModal.openViewProject(project, diffRange);
  });

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <ProjectUpdatesPanel
        onViewProject={onViewProject}
        onOpenProjectDiff={onOpenProjectDiff}
      />
    </Box>
  );
};

export default TrackerUpdatesPage;
