import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Divider,
  LinearProgress,
} from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import type { Project, User, Category, Service } from '../types';
import { typeGroup } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  projects: Project[];
  users: User[];
  categories: Category[];
  services: Service[];
}

type FilterStatus = 'all' | 'active' | 'done';
type TrendMode = 'cumulative' | 'monthly';

// Mountain palette inspired by MUI X-Charts Overview (vibrant blue, gold/amber, coral/rose, purple, emerald)
const MOUNTAIN_COLORS = [
  '#2563eb', // vibrant blue
  '#eab308', // gold / amber
  '#f43f5e', // coral / rose
  '#8b5cf6', // purple / violet
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
];

const CATEGORY_COLORS = [
  '#0284c7', // sky
  '#059669', // teal
  '#d97706', // amber dark
  '#7c3aed', // violet
  '#db2777', // rose
  '#0891b2', // cyan dark
  '#65a30d', // lime dark
  '#ea580c', // orange dark
  '#9333ea', // fuchsia
  '#475569', // slate dark
];

export const StatisticsCharts: React.FC<Props> = ({
  projects,
  users,
  categories,
  services,
}) => {
  const { language, t, getServiceLabel } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [trendMode, setTrendMode] = useState<TrendMode>('cumulative');

  const adminNames = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.role === 'Administrator' || u.role?.toLowerCase() === 'administrator') {
        if (u.name) set.add(u.name.trim().toLowerCase());
      }
    });
    return set;
  }, [users]);

  const isAdminUser = useCallback(
    (userNameOrId: string) => {
      if (!userNameOrId) return false;
      const trimmed = userNameOrId.trim().toLowerCase();
      if (adminNames.has(trimmed)) return true;
      const found = users.find(
        (u) => u.id === userNameOrId || u.name.trim().toLowerCase() === trimmed
      );
      return found ? (found.role === 'Administrator' || found.role?.toLowerCase() === 'administrator') : false;
    },
    [adminNames, users]
  );

  // Helper to map project to owner name
  const getProjectOwner = useCallback(
    (p: Project): string => {
      if (p.responsible && p.responsible.trim()) return p.responsible.trim();
      if ((p as any).responsibleId) {
        const found = users.find((u) => u.id === (p as any).responsibleId);
        if (found) return found.name;
      }
      return t('unassignedUser');
    },
    [users, t]
  );

  // Filter projects by status and exclude projects assigned to Administrators
  const filteredProjects = useMemo(() => {
    const nonAdminProjects = projects.filter((p) => {
      const owner = getProjectOwner(p);
      if (isAdminUser(owner)) return false;
      if ((p as any).responsibleId && isAdminUser((p as any).responsibleId)) return false;
      return true;
    });

    if (filterStatus === 'active') return nonAdminProjects.filter((p) => !p.done);
    if (filterStatus === 'done') return nonAdminProjects.filter((p) => p.done);
    return nonAdminProjects;
  }, [projects, filterStatus, isAdminUser, getProjectOwner]);

  const totalFiltered = filteredProjects.length;

  // Fallback category labels from translations
  const groupLabels: Record<string, string> = useMemo(
    () => ({
      'grp-waste': t('groupWaste'),
      'grp-legal': t('groupLegal'),
      'grp-testing': t('groupTesting'),
      'grp-advisory': t('groupAdvisory'),
      'grp-standards': t('groupStandards'),
      'grp-otpad': t('groupWaste'),
      'grp-pravno': t('groupLegal'),
      'grp-ispitivanje': t('groupTesting'),
      'grp-savetnik': t('groupAdvisory'),
      'grp-standardi': t('groupStandards'),
    }),
    [t]
  );

  const getCategoryLabel = useCallback(
    (grpCode: string) => {
      const matched = categories.find((c) => c.code === grpCode);
      if (matched) return matched.name;
      return groupLabels[grpCode] || grpCode;
    },
    [categories, groupLabels]
  );

  // 1. Projects per User data (Pie Chart)
  const userChartData = useMemo(() => {
    if (totalFiltered === 0) return [];

    const userCountMap = new Map<string, { label: string; count: number }>();

    filteredProjects.forEach((p) => {
      let userName = '';
      if (p.responsible && p.responsible.trim()) {
        userName = p.responsible.trim();
      } else if ((p as any).responsibleId) {
        const foundUser = users.find((u) => u.id === (p as any).responsibleId);
        userName = foundUser ? foundUser.name : t('unassignedUser');
      } else {
        userName = t('unassignedUser');
      }

      if (isAdminUser(userName) || ((p as any).responsibleId && isAdminUser((p as any).responsibleId))) {
        return;
      }

      const existing = userCountMap.get(userName) || { label: userName, count: 0 };
      existing.count += 1;
      userCountMap.set(userName, existing);
    });

    const list = Array.from(userCountMap.values()).sort((a, b) => b.count - a.count);
    const totalUserProjects = list.reduce((acc, item) => acc + item.count, 0);

    return list.map((item, idx) => ({
      id: `user-${idx}`,
      value: item.count,
      label: item.label,
      color: MOUNTAIN_COLORS[idx % MOUNTAIN_COLORS.length],
      percentage: totalUserProjects > 0 ? ((item.count / totalUserProjects) * 100).toFixed(1) : '0',
    }));
  }, [filteredProjects, users, totalFiltered, isAdminUser, t]);

  // 2. Projects per Category data (Pie Chart)
  const categoryChartData = useMemo(() => {
    if (totalFiltered === 0) return [];

    const categoryCountMap = new Map<string, { label: string; count: number }>();

    filteredProjects.forEach((p) => {
      const matchedService = services.find((s) => s.code === p.type || s.id === p.type);
      const grpCode = matchedService?.group || typeGroup[p.type] || 'other';

      let catName = '';
      if (grpCode === 'other') {
        catName = getServiceLabel(p.type, services) || t('otherCategory');
      } else {
        catName = getCategoryLabel(grpCode);
      }

      const existing = categoryCountMap.get(catName) || { label: catName, count: 0 };
      existing.count += 1;
      categoryCountMap.set(catName, existing);
    });

    const list = Array.from(categoryCountMap.values()).sort((a, b) => b.count - a.count);

    return list.map((item, idx) => ({
      id: `cat-${idx}`,
      value: item.count,
      label: item.label,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      percentage: totalFiltered > 0 ? ((item.count / totalFiltered) * 100).toFixed(1) : '0',
    }));
  }, [filteredProjects, services, totalFiltered, getCategoryLabel, t, getServiceLabel]);

  // 3. Stacked Mountain Area Chart: Last 12 Months Completed Projects by Owner
  const last12Months = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const locale =
        language === 'sr-Latn'
          ? 'sr-Latn-RS'
          : language === 'sr-Cyrl'
          ? 'sr-Cyrl-RS'
          : 'en-US';

      const monthName = d.toLocaleDateString(locale, { month: 'short' });
      const yearShort = String(d.getFullYear()).slice(-2);
      const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} '${yearShort}`;

      months.push({ key, label });
    }
    return months;
  }, [language]);

  // Helper to extract completion year-month key (YYYY-MM)
  const getCompletionMonthKey = (p: Project): string | null => {
    if (!p.done) return null;
    const rawDate = p.updatedAt || p.deadline || p.start || p.createdAt;
    if (!rawDate) return null;
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    } catch {
      return null;
    }
  };

  // Build series for Mountain Area Chart
  const { stackedSeries, totalCompletedIn12Months, ownerLegendList } = useMemo(() => {
    const completedProjects = projects.filter((p) => {
      if (!p.done) return false;
      const owner = getProjectOwner(p);
      if (isAdminUser(owner)) return false;
      if ((p as any).responsibleId && isAdminUser((p as any).responsibleId)) return false;
      return true;
    });

    // Get list of distinct non-admin owners
    const ownerSet = new Set<string>();
    users.forEach((u) => {
      if (u.role !== 'Administrator' && u.role?.toLowerCase() !== 'administrator') {
        ownerSet.add(u.name);
      }
    });
    completedProjects.forEach((p) => {
      const owner = getProjectOwner(p);
      if (!isAdminUser(owner)) {
        ownerSet.add(owner);
      }
    });

    const owners = Array.from(ownerSet);
    const monthKeyToIndex = new Map<string, number>();
    last12Months.forEach((m, idx) => monthKeyToIndex.set(m.key, idx));

    // Matrix: owner -> number[12] (monthly discrete)
    const monthlyCountsMap = new Map<string, number[]>();
    owners.forEach((owner) => {
      monthlyCountsMap.set(owner, new Array(12).fill(0));
    });

    let totalCompleted = 0;

    completedProjects.forEach((p) => {
      const monthKey = getCompletionMonthKey(p);
      if (monthKey && monthKeyToIndex.has(monthKey)) {
        const monthIdx = monthKeyToIndex.get(monthKey)!;
        const owner = getProjectOwner(p);
        const arr = monthlyCountsMap.get(owner) || new Array(12).fill(0);
        arr[monthIdx] += 1;
        monthlyCountsMap.set(owner, arr);
        totalCompleted += 1;
      }
    });

    // Compute cumulative or monthly data arrays per owner
    const ownerTotals = owners.map((owner, idx) => {
      const monthlyData = monthlyCountsMap.get(owner) || new Array(12).fill(0);
      const sum = monthlyData.reduce((acc, v) => acc + v, 0);

      // In cumulative mode, each month accumulates projects up to that point
      let cumSum = 0;
      const cumulativeData = monthlyData.map((val) => {
        cumSum += val;
        return cumSum;
      });

      const activeData = trendMode === 'cumulative' ? cumulativeData : monthlyData;

      return {
        name: owner,
        monthlyData,
        data: activeData,
        total: sum,
        color: MOUNTAIN_COLORS[idx % MOUNTAIN_COLORS.length],
      };
    });

    const nonAdminUsers = users.filter((u) => u.role !== 'Administrator' && u.role?.toLowerCase() !== 'administrator');

    // Filter to owners who have at least 1 completed project or are in the registered non-admin users list
    // Sort by total descending
    const sortedOwners = ownerTotals
      .filter((o) => o.total > 0 || nonAdminUsers.some((u) => u.name === o.name))
      .sort((a, b) => b.total - a.total);

    const series = sortedOwners.map((o) => ({
      id: o.name,
      data: o.data,
      label: o.name,
      area: true,
      stack: 'total',
      curve: 'monotoneX' as const, // Smooth mountain peaks
      showMark: false, // Clean mountain ridges without dots
      color: o.color,
      valueFormatter: (v: number | null) => (v !== null ? `${v} ${t('statDone').toLowerCase()}` : '0'),
    }));

    return {
      stackedSeries: series,
      totalCompletedIn12Months: totalCompleted,
      ownerLegendList: sortedOwners,
    };
  }, [projects, users, last12Months, getProjectOwner, isAdminUser, trendMode, t]);

  const xLabels = useMemo(() => last12Months.map((m) => m.label), [last12Months]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
      {/* FILTER & SUMMARY BAR */}
      <Card variant="outlined" sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon fontSize="small" color="action" />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {t('totalProjectsAnalyzed', { count: totalFiltered })}
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={filterStatus}
            exclusive
            onChange={(_, val) => val && setFilterStatus(val)}
            size="small"
            color="primary"
          >
            <ToggleButton value="all" sx={{ px: 2, fontWeight: 600 }}>
              {t('chartFilterAll')}
            </ToggleButton>
            <ToggleButton value="active" sx={{ px: 2, fontWeight: 600 }}>
              {t('chartFilterActive')}
            </ToggleButton>
            <ToggleButton value="done" sx={{ px: 2, fontWeight: 600 }}>
              {t('chartFilterDone')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Card>

      {totalFiltered === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('noDataForCharts')}</Typography>
        </Paper>
      ) : (
        <>
          {/* TOP ROW: PIE CHARTS */}
          <Grid container spacing={2.5}>
            {/* DIAGRAM 1: PROJECTS PER USER */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonOutlinedIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        {t('chartProjectsByUser')}
                      </Typography>
                    </Box>
                    <Chip
                      label={t('chartProjectsCount', { count: totalFiltered })}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Donut Chart Visual */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: 250,
                    }}
                  >
                    <PieChart
                      series={[
                        {
                          data: userChartData.map((d) => ({
                            id: d.id,
                            value: d.value,
                            label: d.label,
                            color: d.color,
                          })),
                          innerRadius: 45,
                          outerRadius: 90,
                          paddingAngle: 3,
                          cornerRadius: 4,
                          highlightScope: { fade: 'global', highlight: 'item' },
                          faded: { innerRadius: 40, additionalRadius: -5 },
                        },
                      ]}
                      slotProps={{
                        legend: { sx: { display: 'none' } } as any,
                      }}
                      height={250}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Breakdown List */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    {t('tabUsers')} ({userChartData.length})
                  </Typography>

                  <Stack spacing={1.5} sx={{ mt: 0.5, flex: 1, overflowY: 'auto', maxHeight: 220, pr: 0.5 }}>
                    {userChartData.map((item) => (
                      <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: item.color,
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.label}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                              {item.percentage}%
                            </Typography>
                            <Chip
                              label={item.value}
                              size="small"
                              sx={{
                                height: 20,
                                fontWeight: 700,
                                bgcolor: 'action.selected',
                              }}
                            />
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Number(item.percentage)}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: item.color,
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* DIAGRAM 2: PROJECTS PER CATEGORY */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CategoryOutlinedIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        {t('chartProjectsByCategory')}
                      </Typography>
                    </Box>
                    <Chip
                      label={t('chartProjectsCount', { count: totalFiltered })}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Donut Chart Visual */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: 250,
                    }}
                  >
                    <PieChart
                      series={[
                        {
                          data: categoryChartData.map((d) => ({
                            id: d.id,
                            value: d.value,
                            label: d.label,
                            color: d.color,
                          })),
                          innerRadius: 45,
                          outerRadius: 90,
                          paddingAngle: 3,
                          cornerRadius: 4,
                          highlightScope: { fade: 'global', highlight: 'item' },
                          faded: { innerRadius: 40, additionalRadius: -5 },
                        },
                      ]}
                      slotProps={{
                        legend: { sx: { display: 'none' } } as any,
                      }}
                      height={250}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Breakdown List */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    {t('tabCategories')} ({categoryChartData.length})
                  </Typography>

                  <Stack spacing={1.5} sx={{ mt: 0.5, flex: 1, overflowY: 'auto', maxHeight: 220, pr: 0.5 }}>
                    {categoryChartData.map((item) => (
                      <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: item.color,
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.label}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                              {item.percentage}%
                            </Typography>
                            <Chip
                              label={item.value}
                              size="small"
                              sx={{
                                height: 20,
                                fontWeight: 700,
                                bgcolor: 'action.selected',
                              }}
                            />
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Number(item.percentage)}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: item.color,
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* BOTTOM ROW: MOUNTAIN STACKED AREA CHART (LAST 12 MONTHS) */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Header with Mode Toggle & Summary Chip */}
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    p: 0.75,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LandscapeOutlinedIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
                    {t('chartCompletedProjectsTrend')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('chartCompletedProjectsSubtitle')}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <ToggleButtonGroup
                  value={trendMode}
                  exclusive
                  onChange={(_, val) => val && setTrendMode(val)}
                  size="small"
                  color="primary"
                >
                  <ToggleButton value="cumulative" sx={{ px: 1.75, py: 0.25, fontWeight: 600, fontSize: '0.8rem' }}>
                    {t('chartModeCumulative')}
                  </ToggleButton>
                  <ToggleButton value="monthly" sx={{ px: 1.75, py: 0.25, fontWeight: 600, fontSize: '0.8rem' }}>
                    {t('chartModeMonthly')}
                  </ToggleButton>
                </ToggleButtonGroup>

                <Chip
                  label={t('totalCompletedInPeriod', { count: totalCompletedIn12Months })}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>

            <Divider />

            {/* Mountain Stacked Area Chart */}
            <Box
              sx={{
                width: '100%',
                height: 350,
                pt: 1,
                // Rich solid/dense mountain strata fill styling
                '& .MuiAreaElement-root': {
                  opacity: 0.92,
                  transition: 'opacity 0.2s ease',
                },
                '& .MuiAreaElement-root:hover': {
                  opacity: 1,
                },
                '& .MuiLineElement-root': {
                  strokeWidth: 2,
                },
              }}
            >
              <LineChart
                xAxis={[
                  {
                    data: xLabels,
                    scaleType: 'point',
                    tickLabelStyle: { fontSize: 11 },
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    tickMinStep: 1,
                    label: t('axisCompletedProjects'),
                  },
                ]}
                series={stackedSeries}
                height={330}
                margin={{ top: 25, right: 30, bottom: 40, left: 50 }}
                grid={{ horizontal: true }}
                slotProps={{
                  legend: {
                    direction: 'horizontal',
                    position: { vertical: 'bottom', horizontal: 'center' },
                  } as any,
                }}
              />
            </Box>

            {/* Owner Badges with Color Indicators */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, pt: 0.5, justifyContent: 'center' }}>
              {ownerLegendList.map((owner) => (
                <Chip
                  key={owner.name}
                  avatar={
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: `${owner.color} !important`,
                        ml: 1,
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {owner.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                        ({owner.total})
                      </Typography>
                    </Box>
                  }
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'divider', bgcolor: 'background.paper' }}
                />
              ))}
            </Box>
          </Card>
        </>
      )}
    </Box>
  );
};
