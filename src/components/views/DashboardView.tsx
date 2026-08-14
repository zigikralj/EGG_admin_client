import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Stack,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { Project, ProjectStats, Reminder, DashboardSubTab, User, Category, Service } from '../../types';
import { ReminderPanel } from '../ReminderPanel';
import { ProjectCard } from '../ProjectCard';
import { StatisticsCharts } from '../StatisticsCharts';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  dashboardSubTab?: DashboardSubTab;
  stats: ProjectStats;
  projects: Project[];
  users?: User[];
  categories?: Category[];
  services?: Service[];
  reminders?: Reminder[];
  onMarkSampled: (id: string) => void;
  onToggleDone: (id: string) => void;
  onSaveReminder?: (reminder: Partial<Reminder>) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onNavigateToProjects: () => void;
}

export const DashboardView: React.FC<Props> = ({
  dashboardSubTab = 'default',
  stats,
  projects,
  users = [],
  categories = [],
  services = [],
  reminders,
  onMarkSampled,
  onToggleDone,
  onSaveReminder,
  onEditProject,
  onDeleteProject,
  onNavigateToProjects,
}) => {
  const { t } = useLanguage();
  const activeProjects = projects.filter((p) => !p.done);

  const kpis = [
    { title: t('statInCreation'), value: stats.active, color: 'primary.main' },
    { title: t('statDone'), value: stats.done, color: 'info.main' },
    { title: t('statStale'), value: stats.stale, color: 'warning.main' },
    { title: t('statMonitorSoon'), value: stats.monitor, color: 'secondary.main' },
  ];

  const renderStatisticsCard = (isFullWidth = false) => (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        width: isFullWidth ? '100%' : undefined,
        mt: 1,
      }}
    >
      {/* NOTCHED TITLE */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: -8,
          left: isFullWidth ? '24px' : '15%',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          px: 0.75,
          py: 0.1,
          color: 'text.secondary',
          fontWeight: 700,
          fontSize: '0.8rem',
          letterSpacing: '0.4px',
          lineHeight: 1,
          zIndex: 1,
        }}
      >
        {t('projectsStatistic')}
      </Typography>

      <CardContent
        sx={{
          p: 2,
          pt: 2.25,
          '&:last-child': { pb: 2 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Stack
          spacing={1.5}
          direction={isFullWidth ? { xs: 'column', sm: 'row' } : 'column'}
          divider={<Divider flexItem orientation={isFullWidth ? 'vertical' : 'horizontal'} />}
          sx={{ justifyContent: isFullWidth ? 'space-around' : 'flex-start', py: isFullWidth ? 1 : 0 }}
        >
          {kpis.map((kpi, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 3,
                flex: isFullWidth ? 1 : undefined,
                px: isFullWidth ? 2 : 0,
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, textAlign: 'left' }}>
                {kpi.title}:
              </Typography>
              <Typography
                sx={{
                  color: kpi.color,
                  fontWeight: 800,
                  lineHeight: 1,
                  fontSize: isFullWidth ? '1.5rem' : '1.25rem',
                  textAlign: 'right',
                }}
              >
                {kpi.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderRemindersPanel = (isFullHeight = false) => (
    <ReminderPanel
      projects={projects}
      reminders={reminders}
      onMarkSampled={onMarkSampled}
      onSaveReminder={onSaveReminder}
      isFullHeight={isFullHeight}
    />
  );

  const renderActiveProjectsSection = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('activeProjects')}
          </Typography>
          <Chip label={activeProjects.length} size="small" color="primary" sx={{ fontWeight: 700 }} />
        </Box>
        <Button
          size="small"
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          onClick={onNavigateToProjects}
        >
          {t('btnShowAllProjects')}
        </Button>
      </Box>

      {activeProjects.length > 0 ? (
        <Grid container spacing={2}>
          {activeProjects.map((p) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
              <ProjectCard
                project={p}
                onToggleDone={onToggleDone}
                onMarkSampled={onMarkSampled}
                onEdit={onEditProject}
                onDelete={onDeleteProject}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('emptyDashboardActive')}</Typography>
        </Paper>
      )}
    </Box>
  );

  return (
    <Stack spacing={2.5}>
      {/* STATISTIC ONLY VIEW */}
      {dashboardSubTab === 'statistic' && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {renderStatisticsCard(true)}
          <StatisticsCharts
            projects={projects}
            users={users}
            categories={categories}
            services={services}
          />
        </Box>
      )}

      {/* REMINDERS ONLY VIEW */}
      {dashboardSubTab === 'reminders' && (
        <Box sx={{ width: '100%' }}>
          {renderRemindersPanel(true)}
        </Box>
      )}

      {/* PROJECTS ONLY VIEW */}
      {dashboardSubTab === 'projects' && (
        <Box sx={{ width: '100%' }}>
          {renderActiveProjectsSection()}
        </Box>
      )}

      {/* DEFAULT COMBINED VIEW */}
      {dashboardSubTab === 'default' && (
        <>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', width: '100%', maxWidth: '100%', minWidth: 0 }}>
            <Box sx={{ width: { xs: '100%', md: 'fit-content' }, maxWidth: '100%', minWidth: 0 }}>
              {renderStatisticsCard(false)}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, width: '100%', maxWidth: '100%' }}>
              {renderRemindersPanel()}
            </Box>
          </Box>

          {renderActiveProjectsSection()}
        </>
      )}
    </Stack>
  );
};

