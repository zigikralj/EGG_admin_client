import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
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
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import type { Project, User, Category, Service, Client, Invoice } from '../types';
import { typeGroup } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  projects: Project[];
  clients?: Client[];
  invoices?: Invoice[];
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
  clients = [],
  invoices = [],
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
  const { stackedSeries, totalCompletedIn12Months } = useMemo(() => {
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
    };
  }, [projects, users, last12Months, getProjectOwner, isAdminUser, trendMode, t]);

  const xLabels = useMemo(() => last12Months.map((m) => m.label), [last12Months]);

  // Helper to check if an invoice is paid
  const isPaidInvoice = useCallback((inv: Invoice) => {
    const s = (inv.status || '').trim().toLowerCase();
    return s === 'paid' || s === 'plaćeno' || s === 'плаћено';
  }, []);

  // Top 10 Clients by Sum of Paid Invoices
  const top10ClientsData = useMemo(() => {
    const map = new Map<string, { clientName: string; totalPaid: number; count: number }>();

    invoices.forEach((inv) => {
      if (!isPaidInvoice(inv)) return;

      let name = inv.clientName?.trim();
      if (!name && inv.clientId) {
        const found = clients.find((c) => c.id === inv.clientId);
        if (found) name = found.name.trim();
      }
      if (!name) {
        name = t('unassignedUser') || 'Other';
      }

      let amount = Number(inv.totalAmount) || 0;
      if (!amount && inv.items && inv.items.length > 0) {
        amount = inv.items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
      }

      const existing = map.get(name);
      if (existing) {
        existing.totalPaid += amount;
        existing.count += 1;
      } else {
        map.set(name, {
          clientName: name,
          totalPaid: amount,
          count: 1,
        });
      }
    });

    const sorted = Array.from(map.values())
      .filter((item) => item.totalPaid > 0)
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 10);

    return {
      topClients: sorted,
    };
  }, [invoices, clients, isPaidInvoice, t]);

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
                          innerRadius: 65,
                          outerRadius: 105,
                          paddingAngle: 2,
                          cornerRadius: 4,
                          highlightScope: { fade: 'global', highlight: 'item' },
                          faded: { innerRadius: 60, additionalRadius: -10, color: 'gray' },
                          valueFormatter: (item: { value: number }) =>
                            item ? `${item.value} (${totalFiltered > 0 ? ((item.value / totalFiltered) * 100).toFixed(0) : 0}%)` : '',
                        },
                      ]}
                      height={250}
                      margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      slotProps={{
                        legend: { hidden: true } as any,
                      }}
                    />
                  </Box>

                  {/* Custom Rich Breakdown Table / List */}
                  <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {userChartData.map((item) => {
                      const pct = totalFiltered > 0 ? ((item.value / totalFiltered) * 100).toFixed(1) : '0';
                      return (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 0.75,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 140 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: item.color,
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.label}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, maxWidth: 200, mx: 2 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Number(pct)}
                              sx={{
                                flex: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'action.selected',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: item.color,
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 70, justifyContent: 'flex-end' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ width: 40, textAlign: 'right' }}>
                              {pct}%
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
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
                          innerRadius: 65,
                          outerRadius: 105,
                          paddingAngle: 2,
                          cornerRadius: 4,
                          highlightScope: { fade: 'global', highlight: 'item' },
                          faded: { innerRadius: 60, additionalRadius: -10, color: 'gray' },
                          valueFormatter: (item: { value: number }) =>
                            item ? `${item.value} (${totalFiltered > 0 ? ((item.value / totalFiltered) * 100).toFixed(0) : 0}%)` : '',
                        },
                      ]}
                      height={250}
                      margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      slotProps={{
                        legend: { hidden: true } as any,
                      }}
                    />
                  </Box>

                  {/* Custom Rich Breakdown Table / List */}
                  <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {categoryChartData.map((item) => {
                      const pct = totalFiltered > 0 ? ((item.value / totalFiltered) * 100).toFixed(1) : '0';
                      return (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 0.75,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 140 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: item.color,
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.label}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, maxWidth: 200, mx: 2 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Number(pct)}
                              sx={{
                                flex: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'action.selected',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: item.color,
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 70, justifyContent: 'flex-end' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ width: 40, textAlign: 'right' }}>
                              {pct}%
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* DIAGRAM 3: MOUNTAIN STACKED AREA CHART */}
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
          </Card>

          {/* DIAGRAM 4: TOP 10 CLIENTS HORIZONTAL BAR CHART */}
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
            {/* Header with Title */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
              }}
            >
              <Box
                sx={{
                  bgcolor: 'info.main',
                  color: 'info.contrastText',
                  p: 0.75,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LeaderboardOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
                  {t('chartTop10Clients')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('chartTop10ClientsSubtitle')}
                </Typography>
              </Box>
            </Box>

            <Divider />

            {top10ClientsData.topClients.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('noPaidInvoicesData')}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: 500,
                  pt: 1,
                  '& .MuiBarElement-root': {
                    transition: 'opacity 0.2s ease',
                  },
                  '& .MuiBarElement-root:hover': {
                    opacity: 0.85,
                  },
                }}
              >
                <BarChart
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: top10ClientsData.topClients.map((c) => c.clientName),
                      height: 150,
                      tickPlacement: 'middle',
                      tickLabelPlacement: 'middle',
                      tickLabelInterval: () => true,
                      tickLabelStyle: {
                        angle: -30,
                        textAnchor: 'end',
                        fontSize: 11,
                        fontWeight: 600,
                      },
                    },
                  ]}
                  yAxis={[
                    {
                      width: 80,
                      min: 0,
                      label: `${t('axisTotalPaidAmount')} (RSD)`,
                      valueFormatter: (value: number | null) => {
                        if (value === null || value === undefined) return '0';
                        if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
                        if (value >= 1_000) return `${(value / 1_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k`;
                        return `${value}`;
                      },
                    },
                  ]}
                  series={[
                    {
                      data: top10ClientsData.topClients.map((c) => c.totalPaid),
                      color: '#0284c7',
                      valueFormatter: (value: number | null) =>
                        value !== null
                          ? `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`
                          : '0.00 RSD',
                    },
                  ]}
                  height={600}
                  width={950}
                  margin={{
                    left: 30,
                    right: 35,
                    top: 20,
                    bottom: 105,
                  }}
                  grid={{ horizontal: true }}
                  borderRadius={6}
                />
              </Box>
            )}
          </Card>
        </>
      )}
    </Box>
  );
};
