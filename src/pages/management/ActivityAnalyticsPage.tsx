import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Typography,
  Card,
  Button,
  Grid,
} from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useUsersQuery, useActivityAnalyticsQuery } from '../../queries';
import { PAGE_ROUTES } from '../../constants';
import {
  AnalyticsHeader,
  AnalyticsKpiStrip,
  UsageTimelineChart,
  PageUsageChart,
  ActionsByEntityChart,
  UserUsageTable,
  UserPageBreakdownChart,
  UsageHeatmap,
  SessionLengthHistogram,
  FeatureAdoptionChart,
  EngagementScatter,
  NavigationFlows,
  EditedFieldsChart,
  InsightsPanel,
  type RangePreset,
} from '../../components/activityAnalytics';

export type AnalyticsTab = 'overview' | 'pages' | 'actions' | 'users' | 'behavior';

export const ActivityAnalyticsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Sync search params with state
  const currentTab = (searchParams.get('tab') as AnalyticsTab) || 'overview';
  const preset = (searchParams.get('range') as RangePreset) || '30d';
  const customStartDate = searchParams.get('from') || '';
  const customEndDate = searchParams.get('to') || '';
  const selectedRoles = useMemo(() => {
    const r = searchParams.get('roles');
    return r ? r.split(',').filter(Boolean) : [];
  }, [searchParams]);
  const selectedUserIds = useMemo(() => {
    const u = searchParams.get('users');
    return u ? u.split(',').filter(Boolean) : [];
  }, [searchParams]);
  const excludeAdminPages = searchParams.get('excludeAdmin') !== 'false';

  // 2. Compute date range
  const { fromIso, toIso, granularity } = useMemo(() => {
    const now = new Date();
    let from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let to = now;

    if (preset === '7d') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === '30d') {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (preset === '90d') {
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (preset === 'custom' && customStartDate && customEndDate) {
      from = new Date(customStartDate);
      to = new Date(customEndDate);
      to.setHours(23, 59, 59, 999);
    }

    const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    const gran: 'day' | 'week' | 'month' = diffDays <= 45 ? 'day' : diffDays <= 180 ? 'week' : 'month';

    return {
      fromIso: from.toISOString(),
      toIso: to.toISOString(),
      granularity: gran,
    };
  }, [preset, customStartDate, customEndDate]);

  // 3. React Query hooks
  const { data: usersData } = useUsersQuery();
  const {
    data: analytics,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useActivityAnalyticsQuery({
    from: fromIso,
    to: toIso,
    granularity,
    userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
    roles: selectedRoles.length > 0 ? selectedRoles : undefined,
    excludeAdminPages,
    compare: true,
  });

  // Param update helpers
  const updateParam = (key: string, value: string | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleTabChange = (_: React.SyntheticEvent, newTab: AnalyticsTab) => {
    updateParam('tab', newTab === 'overview' ? undefined : newTab);
  };

  const handlePresetChange = (newPreset: RangePreset) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('range', newPreset);
      if (newPreset !== 'custom') {
        next.delete('from');
        next.delete('to');
      }
      return next;
    });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('from', start);
      next.set('to', end);
      return next;
    });
  };

  const handleRolesChange = (roles: string[]) => {
    updateParam('roles', roles.length > 0 ? roles.join(',') : undefined);
  };

  const handleUserIdsChange = (userIds: string[]) => {
    updateParam('users', userIds.length > 0 ? userIds.join(',') : undefined);
  };

  const handleExcludeAdminChange = (exclude: boolean) => {
    updateParam('excludeAdmin', exclude ? undefined : 'false');
  };

  // RBAC guard
  if (!hasPermission('activityLogs', 'view')) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error" variant="h6" sx={{ fontWeight: 600 }}>
          {t('activityLogsAdminOnly')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header and Filter Controls */}
      <AnalyticsHeader
        onBack={() => navigate(PAGE_ROUTES.ACTIVITY_LOGS)}
        preset={preset}
        onPresetChange={handlePresetChange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={handleCustomDateChange}
        selectedRoles={selectedRoles}
        onRolesChange={handleRolesChange}
        selectedUserIds={selectedUserIds}
        onUserIdsChange={handleUserIdsChange}
        excludeAdminPages={excludeAdminPages}
        onExcludeAdminPagesChange={handleExcludeAdminChange}
        onRefresh={() => refetch()}
        isFetching={isFetching}
        users={usersData}
        t={t}
        language={language}
      />

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 2 }}>
          <CircularProgress size={44} color="primary" />
          <Typography variant="body2" color="text.secondary">
            {t('analyticsLoading')}
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'error.light', borderRadius: 2.5 }}>
          <Typography color="error" variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {t('analyticsError')}
          </Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            {t('tryAgain')}
          </Button>
        </Card>
      )}

      {/* Analytics Content */}
      {analytics && !isLoading && (
        <>
          {/* KPI Strip */}
          <AnalyticsKpiStrip
            totals={analytics.totals}
            previousTotals={analytics.previousTotals}
            timeline={analytics.timeline}
            stickiness={analytics.stickiness}
            t={t}
          />

          {/* Empty State Guard: No page views in range */}
          {analytics.totals.pageViews === 0 && analytics.totals.actions === 0 ? (
            <Card elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2.5, my: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {t('analyticsNoDataTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                {t('analyticsNoDataSubtitle')}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate(PAGE_ROUTES.ACTIVITY_LOGS)}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                {t('tabActivityLogs')}
              </Button>
            </Card>
          ) : (
            <>
              {/* Rule-based Insights Panel */}
              <InsightsPanel
                data={analytics}
                onNavigateTab={(tab) => updateParam('tab', tab === 'overview' ? undefined : tab)}
                t={t}
                language={language}
              />

              {/* Navigation Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                  value={currentTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      minHeight: 48,
                    },
                  }}
                >
                  <Tab label={t('analyticsTabOverview')} value="overview" />
                  <Tab label={t('analyticsTabPages')} value="pages" />
                  <Tab label={t('analyticsTabActions')} value="actions" />
                  <Tab label={t('analyticsTabUsers')} value="users" />
                  <Tab label={t('analyticsTabBehavior')} value="behavior" />
                </Tabs>
              </Box>

              {/* TAB 1: OVERVIEW */}
              {currentTab === 'overview' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <UsageTimelineChart
                    timeline={analytics.timeline}
                    granularity={analytics.range.granularity}
                    t={t}
                    language={language}
                  />

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <UsageHeatmap
                        heatmap={analytics.heatmap}
                        t={t}
                        language={language}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <SessionLengthHistogram
                        buckets={analytics.sessionLengthBuckets}
                        t={t}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* TAB 2: PAGES & FEATURES */}
              {currentTab === 'pages' && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <PageUsageChart
                      rawPages={analytics.pages}
                      t={t}
                      language={language}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FeatureAdoptionChart
                      rawPages={analytics.pages}
                      totalUsers={analytics.totalRegisteredActiveUsers}
                      t={t}
                      language={language}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <EngagementScatter
                      rawPages={analytics.pages}
                      actions={analytics.actions}
                      t={t}
                      language={language}
                    />
                  </Grid>
                </Grid>
              )}

              {/* TAB 3: ACTIONS */}
              {currentTab === 'actions' && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <ActionsByEntityChart
                      actions={analytics.actions}
                      t={t}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <EditedFieldsChart
                      editedFields={analytics.editedFields}
                      t={t}
                    />
                  </Grid>
                </Grid>
              )}

              {/* TAB 4: USERS */}
              {currentTab === 'users' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <UserUsageTable
                    users={analytics.users}
                    t={t}
                    language={language}
                  />

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <UserPageBreakdownChart
                        users={analytics.users}
                        t={t}
                        language={language}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* TAB 5: BEHAVIOR */}
              {currentTab === 'behavior' && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <NavigationFlows
                      transitions={analytics.transitions}
                      entryPages={analytics.entryPages}
                      exitPages={analytics.exitPages}
                      t={t}
                      language={language}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <SessionLengthHistogram
                      buckets={analytics.sessionLengthBuckets}
                      t={t}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <UsageHeatmap
                      heatmap={analytics.heatmap}
                      t={t}
                      language={language}
                    />
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default ActivityAnalyticsPage;
