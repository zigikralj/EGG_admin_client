import React, { useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import { ProjectsStatistics, type FilterStatus } from '../../components/statistics';
import { useProjectStatisticsQuery } from '../../queries/projects.queries';

export interface TrackerProjectsStatsPageProps {}

export const TrackerProjectsStatsPage: React.FC<TrackerProjectsStatsPageProps> = () => {
  const { t } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const { data: stats, isLoading } = useProjectStatisticsQuery({ status: filterStatus });

  if (isLoading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t('projectsStatistic')}
        </Typography>
      </Box>
      <ProjectsStatistics
        stats={stats}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
      />
    </Box>
  );
};

export default TrackerProjectsStatsPage;
