import React, { useMemo, useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  Autocomplete,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import type { Project, ProjectStats, Reminder, Invoice, DashboardSubTab, User, Category, Service, Client } from '../../types';
import { ReminderPanel } from '../ReminderPanel';
import { ProjectCard } from '../ProjectCard';
import { StatisticsCharts } from '../StatisticsCharts';
import { TableFilterSelector } from '../TableFilterSelector';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface Props {
  dashboardSubTab?: DashboardSubTab;
  stats: ProjectStats;
  projects: Project[];
  clients?: Client[];
  users?: User[];
  categories?: Category[];
  services?: Service[];
  reminders?: Reminder[];
  invoices?: Invoice[];
  onMarkSampled: (id: string) => void;
  onToggleDone: (id: string) => void;
  onSaveReminder?: (reminder: Partial<Reminder>) => void;
  onDeleteReminder?: (id: string) => void;
  onStatusChangeReminder?: (id: string, status: string) => void;
  onViewProject?: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onNavigateToProjects: () => void;
  onOpenNewProject?: () => void;
  quickFilters?: string[];
  onQuickFiltersChange?: (filters: string[]) => void;
  quickFilterDashboardReminders?: boolean;
  onQuickFilterDashboardRemindersChange?: (val: boolean) => void;
}

export const DashboardView: React.FC<Props> = ({
  dashboardSubTab = 'default',
  stats,
  projects,
  clients = [],
  users = [],
  categories = [],
  services = [],
  reminders,
  invoices = [],
  onMarkSampled,
  onToggleDone,
  onSaveReminder,
  onDeleteReminder,
  onStatusChangeReminder,
  onViewProject,
  onEditProject,
  onDeleteProject,
  onNavigateToProjects,
  onOpenNewProject,
  quickFilters: quickFiltersProp,
  onQuickFiltersChange,
  quickFilterDashboardReminders,
  onQuickFilterDashboardRemindersChange,
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { currentUser, isAdmin, isManager } = useAuth();

  // Projects subtab state & filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilters, setQuickFilters] = useState<string[]>(
    quickFiltersProp !== undefined ? quickFiltersProp : ['my', 'active']
  );

  useEffect(() => {
    if (quickFiltersProp !== undefined) {
      setQuickFilters(quickFiltersProp);
      if (quickFiltersProp.includes('my') && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      }
      if (quickFiltersProp.includes('overdue')) {
        setFilterStatus('overdue');
      } else if (quickFiltersProp.includes('stale')) {
        setFilterStatus('stale');
      } else if (quickFiltersProp.includes('done')) {
        setFilterStatus('done');
      }
    }
  }, [quickFiltersProp, currentUser?.name]);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'deadline' | 'name' | 'start' | 'progress' | 'createdAt'>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleToggleFilter = (filterKey: string, checked: boolean) => {
    const updated = checked
      ? [...quickFilters, filterKey]
      : quickFilters.filter((k) => k !== filterKey);
    setQuickFilters(updated);
    onQuickFiltersChange?.(updated);

    if (filterKey === 'my') {
      if (checked && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      } else if (!checked && currentUser?.name && filterResponsible === currentUser.name) {
        setFilterResponsible('all');
      }
    } else if (filterKey === 'overdue') {
      if (checked) {
        setFilterStatus('overdue');
      } else if (!checked && filterStatus === 'overdue') {
        setFilterStatus('all');
      }
    } else if (filterKey === 'stale') {
      if (checked) {
        setFilterStatus('stale');
      } else if (!checked && filterStatus === 'stale') {
        setFilterStatus('all');
      }
    } else if (filterKey === 'done') {
      if (checked) {
        setFilterStatus('done');
      } else if (!checked && filterStatus === 'done') {
        setFilterStatus('all');
      }
    }
  };

  const handleFilterResponsibleChange = (val: string) => {
    setFilterResponsible(val);
    if (currentUser?.name && val === currentUser.name) {
      if (!quickFilters.includes('my')) {
        const updated = [...quickFilters, 'my'];
        setQuickFilters(updated);
        onQuickFiltersChange?.(updated);
      }
    } else if (quickFilters.includes('my')) {
      const updated = quickFilters.filter((k) => k !== 'my');
      setQuickFilters(updated);
      onQuickFiltersChange?.(updated);
    }
  };

  const handleFilterStatusChange = (val: string) => {
    setFilterStatus(val);
    const statusKeys = ['overdue', 'stale', 'done'];
    const updated = quickFilters.filter((k) => !statusKeys.includes(k));
    if (statusKeys.includes(val)) {
      updated.push(val);
    }
    setQuickFilters(updated);
    onQuickFiltersChange?.(updated);
  };

  const handleClearAllFilters = () => {
    setQuickFilters([]);
    onQuickFiltersChange?.([]);
    setFilterCategory('all');
    setFilterClient('all');
    setFilterResponsible('all');
    setFilterStatus('all');
    setSearchQuery('');
  };

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.type).filter(Boolean)));
  }, [projects]);

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.clientName).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const otherResponsibles = useMemo(() => {
    const currentName = currentUser?.name?.trim().toLowerCase();
    const setOfNames = new Set(projects.map((p) => p.responsible).filter(Boolean) as string[]);
    return Array.from(setOfNames)
      .filter((r) => !currentName || r.trim().toLowerCase() !== currentName)
      .sort((a, b) => a.localeCompare(b));
  }, [projects, currentUser]);

  const responsibleOptions = useMemo(() => {
    const list: string[] = [];
    if (currentUser?.name) list.push(currentUser.name);
    list.push(...otherResponsibles);
    return list;
  }, [currentUser?.name, otherResponsibles]);

  const sortOptions = useMemo(() => [
    { value: 'deadline', label: t('deadline') },
    { value: 'name', label: t('colProject') },
    { value: 'start', label: t('start') },
    { value: 'progress', label: t('progress') },
    { value: 'createdAt', label: t('lblCreatedDate') },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: 'creation', label: t('statInCreation') },
    { value: 'overdue', label: t('statOverdueUrgent') },
    { value: 'stale', label: t('statStale') },
    { value: 'done', label: t('statDone') },
  ], [t]);

  const filteredDashboardProjects = useMemo(() => {
    const isStaleProject = (p: Project): boolean => {
      if (p.done || !p.start) return false;
      const start = new Date(p.start);
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 2);
      return start < cutoff;
    };

    const isLateProject = (p: Project): boolean => {
      if (p.done || !p.deadline) return false;
      return new Date(p.deadline) < new Date(new Date().toDateString());
    };

    return projects
      .filter((p) => {
        if (quickFilters.includes('my') && currentUser) {
          const isMyName =
            p.responsible &&
            currentUser.name &&
            p.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
          const isMyId = (p as any).responsibleId && (p as any).responsibleId === currentUser.id;
          if (!isMyName && !isMyId) return false;
        }
        if (quickFilters.includes('active') && p.done) return false;
        if (quickFilters.includes('stale') && (!isStaleProject(p) || p.done)) return false;
        if (quickFilters.includes('overdue') && (!isLateProject(p) || p.done)) return false;
        if (quickFilters.includes('done') && !p.done) return false;

        if (filterCategory !== 'all' && p.type !== filterCategory) return false;
        if (filterClient !== 'all' && p.clientName !== filterClient) return false;
        if (filterResponsible !== 'all') {
          const isMyName =
            currentUser?.name &&
            filterResponsible === currentUser.name &&
            ((p.responsible &&
              currentUser.name &&
              p.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
              ((p as any).responsibleId && (p as any).responsibleId === currentUser.id));
          if (!isMyName && p.responsible !== filterResponsible) return false;
        }
        if (filterStatus !== 'all') {
          const stale = isStaleProject(p);
          const late = isLateProject(p);
          if (filterStatus === 'done' && !p.done) return false;
          if (filterStatus === 'overdue' && (!late || p.done)) return false;
          if (filterStatus === 'stale' && (!stale || p.done)) return false;
          if (filterStatus === 'creation' && (p.done || stale || late)) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesClient = p.clientName && p.clientName.toLowerCase().includes(q);
          const matchesResp = p.responsible && p.responsible.toLowerCase().includes(q);
          const matchesCat = getServiceLabel(p.type, services).toLowerCase().includes(q);
          if (!matchesName && !matchesClient && !matchesResp && !matchesCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let res = 0;
        switch (sortOption) {
          case 'name':
            res = a.name.localeCompare(b.name);
            break;
          case 'deadline': {
            const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity;
            const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity;
            res = aTime - bTime;
            break;
          }
          case 'start': {
            const aStart = a.start ? new Date(a.start).getTime() : 0;
            const bStart = b.start ? new Date(b.start).getTime() : 0;
            res = aStart - bStart;
            break;
          }
          case 'progress':
            res = a.progress - b.progress;
            break;
          case 'createdAt': {
            const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            res = aCreated - bCreated;
            break;
          }
          default:
            res = 0;
        }
        return sortDirection === 'asc' ? res : -res;
      });
  }, [projects, quickFilters, currentUser, filterCategory, filterClient, filterResponsible, filterStatus, searchQuery, getServiceLabel, sortOption, sortDirection]);

  const activeFilterCount =
    (filterCategory !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterResponsible !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    quickFilters.length;

  const clearFilters = () => {
    handleClearAllFilters();
  };

  const { approachingDeadlineProjects, staleProjects } = useMemo(() => {
    const now = new Date();
    const twoMonthsMs = 60 * 24 * 60 * 60 * 1000;
    const twoMonthsFromNow = new Date(now.getTime() + twoMonthsMs);

    const hasApproachingDeadline = (p: Project): boolean => {
      if (!p.deadline) return false;
      const deadlineDate = new Date(p.deadline);
      return deadlineDate <= twoMonthsFromNow;
    };

    const isOlderThan2Months = (p: Project): boolean => {
      if (p.done || !p.start) return false;
      const startDate = new Date(p.start);
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 2);
      return startDate < cutoff;
    };

    const userRespName = (currentUser?.name || '').trim().toLowerCase();

    // Base active projects filter (not completed + role check)
    const baseProjects = projects.filter((p) => {
      if (p.done) return false;
      if (!isAdmin && !isManager) {
        const resp = (p.responsible || '').trim().toLowerCase();
        if (!userRespName || resp !== userRespName) return false;
      }
      return true;
    });

    // 1) Approaching deadlines: deadline <= 2 months from now, sorted by closest deadline first
    const approaching = baseProjects
      .filter((p) => hasApproachingDeadline(p))
      .sort((a, b) => {
        const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return aTime - bTime;
      });

    // 2) Stale projects: started > 2 months ago, sorted by oldest start date first
    const stale = baseProjects
      .filter((p) => isOlderThan2Months(p) && !hasApproachingDeadline(p))
      .sort((a, b) => {
        const aStart = a.start ? new Date(a.start).getTime() : Infinity;
        const bStart = b.start ? new Date(b.start).getTime() : Infinity;
        return aStart - bStart;
      });

    return {
      approachingDeadlineProjects: approaching,
      staleProjects: stale,
    };
  }, [projects, currentUser, isAdmin, isManager]);

  const approachingRemindersCount = useMemo(() => {
    const today = new Date(new Date().toDateString());
    if (reminders && reminders.length > 0) {
      return reminders.filter((r) => {
        const s = (r.status || '').toLowerCase();
        if (s === 'completed' || s === 'završeno' || s === 'завршено') return false;
        if (!r.dueDate) return false;
        const due = new Date(r.dueDate.split('T')[0]);
        const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 10;
      }).length;
    }
    return projects.filter((p) => {
      if (p.done || !p.nextSample) return false;
      const due = new Date(p.nextSample.split('T')[0]);
      const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 10;
    }).length;
  }, [reminders, projects]);

  const urgentProjectsCount = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return projects.filter((p) => !p.done && p.deadline && new Date(p.deadline) < today).length;
  }, [projects]);

  const kpis = [
    { title: t('statInCreation'), value: stats.active, color: 'primary.main' },
    { title: t('statUrgentProjects'), value: urgentProjectsCount, color: 'error.main' },
    { title: t('statDone'), value: stats.done, color: 'info.main' },
    { title: t('statStale'), value: stats.stale, color: 'warning.main' },
    { title: t('statMonitorSoon'), value: approachingRemindersCount, color: '#ff9800' },
  ];

  const renderStatisticsCard = (isFullWidth = false, showNotch = true) => (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        width: isFullWidth ? '100%' : undefined,
        mt: showNotch ? 1 : 0,
      }}
    >
      {/* NOTCHED TITLE */}
      {showNotch && (
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
      )}

      <CardContent
        sx={{
          p: 2,
          pt: showNotch ? 2.25 : 2,
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
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  textAlign: 'left',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.25,
                }}
              >
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

  const renderRemindersPanel = (isFullHeight = false, hideNotch = false) => (
    <ReminderPanel
      projects={projects}
      reminders={reminders}
      clients={clients}
      users={users}
      onMarkSampled={onMarkSampled}
      onSaveReminder={onSaveReminder}
      onDeleteReminder={onDeleteReminder}
      onStatusChangeReminder={onStatusChangeReminder}
      isFullHeight={isFullHeight}
      hideNotch={hideNotch}
      myRemindersOnly={quickFilterDashboardReminders}
      onMyRemindersOnlyChange={onQuickFilterDashboardRemindersChange}
    />
  );

  const renderApproachingDeadlinesSection = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('approachingDeadlinesTitle')}
          </Typography>
          <Chip label={approachingDeadlineProjects.length} size="small" color="primary" sx={{ fontWeight: 700 }} />
        </Box>
        {dashboardSubTab !== 'projects' && (
          <Button
            size="small"
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            onClick={onNavigateToProjects}
          >
            {t('btnShowAllProjects')}
          </Button>
        )}
      </Box>

      {approachingDeadlineProjects.length > 0 ? (
        <Grid container spacing={2}>
          {approachingDeadlineProjects.map((p) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
              <ProjectCard
                project={p}
                services={services}
                reminders={reminders}
                invoices={invoices}
                onToggleDone={onToggleDone}
                onMarkSampled={onMarkSampled}
                onView={onViewProject || onEditProject}
                onEdit={onEditProject}
                onDelete={onDeleteProject}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('emptyApproachingDeadlines')}</Typography>
        </Paper>
      )}
    </Box>
  );

  const renderStaleProjectsSection = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('staleProjectsTitle')}
          </Typography>
          <Chip label={staleProjects.length} size="small" color="warning" sx={{ fontWeight: 700 }} />
        </Box>
      </Box>

      {staleProjects.length > 0 ? (
        <Grid container spacing={2}>
          {staleProjects.map((p) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
              <ProjectCard
                project={p}
                services={services}
                reminders={reminders}
                invoices={invoices}
                onToggleDone={onToggleDone}
                onMarkSampled={onMarkSampled}
                onView={onViewProject || onEditProject}
                onEdit={onEditProject}
                onDelete={onDeleteProject}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('emptyStaleProjects')}</Typography>
        </Paper>
      )}
    </Box>
  );

  return (
    <Stack spacing={2.5}>
      {/* STATISTIC ONLY VIEW */}
      {dashboardSubTab === 'statistic' && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('projectsStatistic')}
            </Typography>
          </Box>
          {renderStatisticsCard(true, false)}
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
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('remindersTitle')}
            </Typography>
          </Box>
          {renderRemindersPanel(true, true)}
        </Box>
      )}

      {/* PROJECTS SUBTAB VIEW */}
      {dashboardSubTab === 'projects' && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* TITLE HEADER */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('subTabProjects')}
              </Typography>
              <Chip label={filteredDashboardProjects.length} size="small" color="primary" sx={{ fontWeight: 700 }} />
            </Box>
            {onOpenNewProject && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={onOpenNewProject}
                size="small"
              >
                {t('btnNewProject')}
              </Button>
            )}
          </Box>

          {/* FILTERS BAR ON TOP */}
          <Card variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: { xs: 'stretch', lg: 'center' }, justifyContent: 'space-between' }}>
              {/* SEARCH FIELD */}
              <TextField
                size="small"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ width: { xs: '100%', lg: 220 } }}
              />

              {/* QUICK FILTER CHECKBOXES */}
              <FormGroup row sx={{ gap: 1, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={quickFilters.includes('my')}
                      onChange={(e) => handleToggleFilter('my', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('quickFilterMyProjects')}
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={quickFilters.includes('active')}
                      onChange={(e) => handleToggleFilter('active', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('quickFilterActive')}
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={quickFilters.includes('stale')}
                      onChange={(e) => handleToggleFilter('stale', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('statStale')}
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={quickFilters.includes('overdue')}
                      onChange={(e) => handleToggleFilter('overdue', e.target.checked)}
                      color="error"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {t('statOverdueUrgent')}
                    </Typography>
                  }
                />
              </FormGroup>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {/* POPOVER FILTERS */}
                <TableFilterSelector
                  activeCount={activeFilterCount}
                  onClear={clearFilters}
                  sortingContent={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Autocomplete
                        size="small"
                        fullWidth
                        disablePortal
                        disableClearable
                        options={sortOptions}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, val) => option.value === val.value}
                        value={sortOptions.find((o) => o.value === sortOption) || sortOptions[0]}
                        onChange={(_, newValue) => {
                          if (newValue) setSortOption(newValue.value as any);
                        }}
                        renderInput={(params) => <TextField {...params} label={t('lblSortBy')} size="small" />}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                        title={sortDirection === 'asc' ? t('sortAscending') : t('sortDescending')}
                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.75 }}
                      >
                        {sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                      </IconButton>
                    </Box>
                  }
                  filteringContent={
                    <>
                      <Autocomplete
                        size="small"
                        fullWidth
                        disablePortal
                        options={uniqueCategories}
                        getOptionLabel={(cat) => getServiceLabel(cat, services)}
                        value={filterCategory === 'all' ? null : filterCategory}
                        onChange={(_, newValue) => setFilterCategory(newValue || 'all')}
                        renderInput={(params) => <TextField {...params} label={t('colService')} size="small" />}
                      />

                      <Autocomplete
                        size="small"
                        fullWidth
                        disablePortal
                        options={uniqueClients}
                        value={filterClient === 'all' ? null : filterClient}
                        onChange={(_, newValue) => setFilterClient(newValue || 'all')}
                        renderInput={(params) => <TextField {...params} label={t('colClient')} size="small" />}
                      />

                      <Autocomplete
                        size="small"
                        fullWidth
                        disablePortal
                        options={responsibleOptions}
                        getOptionLabel={(option) => {
                          if (currentUser?.name && option === currentUser.name) {
                            return `${t('lblMe')} (${currentUser.name})`;
                          }
                          return option;
                        }}
                        value={filterResponsible === 'all' ? null : filterResponsible}
                        onChange={(_, newValue) => handleFilterResponsibleChange(newValue || 'all')}
                        renderInput={(params) => <TextField {...params} label={t('colResponsible')} size="small" />}
                      />

                      <Autocomplete
                        size="small"
                        fullWidth
                        disablePortal
                        options={statusOptions}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, val) => option.value === val.value}
                        value={statusOptions.find((o) => o.value === filterStatus) || null}
                        onChange={(_, newValue) => handleFilterStatusChange(newValue ? newValue.value : 'all')}
                        renderInput={(params) => <TextField {...params} label={t('colDeadlineStatus')} size="small" />}
                      />
                    </>
                  }
                />
              </Box>
            </Box>
          </Card>

          {/* ALL PROJECTS BELOW THAT */}
          {filteredDashboardProjects.length > 0 ? (
            <Grid container spacing={2}>
              {filteredDashboardProjects.map((p) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
                  <ProjectCard
                    project={p}
                    services={services}
                    reminders={reminders}
                    invoices={invoices}
                    onToggleDone={onToggleDone}
                    onMarkSampled={onMarkSampled}
                    onView={onViewProject || onEditProject}
                    onEdit={onEditProject}
                    onDelete={onDeleteProject}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('emptyProjects')}</Typography>
            </Paper>
          )}
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

          {renderApproachingDeadlinesSection()}
          {renderStaleProjectsSection()}
        </>
      )}
    </Stack>
  );
};

