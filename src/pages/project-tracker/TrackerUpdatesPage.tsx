import React from 'react';
import { Box } from '@mui/material';
import type { Project } from '../../types';
import ProjectUpdatesPanel from '../../components/tracker/ProjectUpdatesPanel';

export interface TrackerUpdatesPageProps {
  onViewProject?: (project: Project, diffRange?: { dateFrom: string; dateTo: string } | null) => void;
  onOpenProjectDiff?: (project: Project, diffRange: { dateFrom: string; dateTo: string }) => void;
}

export const TrackerUpdatesPage: React.FC<TrackerUpdatesPageProps> = ({
  onViewProject,
  onOpenProjectDiff,
}) => {
  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <ProjectUpdatesPanel
        onViewProject={onViewProject}
        onOpenProjectDiff={onOpenProjectDiff || (() => {})}
      />
    </Box>
  );
};

export default TrackerUpdatesPage;
