import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import {
  useProjectsQuery,
  useClientsSummaryQuery,
  useUsersSummaryQuery,
  useCategoriesQuery,
  useServicesQuery,
  useInvoicesQuery,
} from '../../queries';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ProjectsStatistics } from '../../components/statistics';

export interface TrackerProjectsStatsPageProps {}

export const TrackerProjectsStatsPage: React.FC<TrackerProjectsStatsPageProps> = () => {
  const { t } = useLanguage();
  const { currentUser, isRestrictedToOwn } = useAuth();
  const isProjectsRestricted = isRestrictedToOwn('projects') || isRestrictedToOwn('tracker_projects');

  const { data: projects = [], isLoading: isLoadingProjects } = useProjectsQuery();
  const { data: clients = [] } = useClientsSummaryQuery();
  const { data: users = [] } = useUsersSummaryQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: services = [] } = useServicesQuery();
  const { data: invoices = [] } = useInvoicesQuery();

  if (isLoadingProjects) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredProjects = isProjectsRestricted && currentUser
    ? projects.filter((p) => {
        const isMyName = p.responsible && currentUser.name && p.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
        const isMyId = (p as any).responsibleId && (p as any).responsibleId === currentUser.id;
        return isMyName || isMyId;
      })
    : projects;

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t('projectsStatistic')}
        </Typography>
      </Box>
      <ProjectsStatistics
        projects={filteredProjects}
        clients={clients}
        users={users}
        categories={categories}
        services={services}
        invoices={invoices}
      />
    </Box>
  );
};

export default TrackerProjectsStatsPage;
