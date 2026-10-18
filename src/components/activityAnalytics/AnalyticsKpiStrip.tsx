import React from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import type { AnalyticsTotals, ActivityAnalytics } from '../../types';
import { formatDuration, calculateDelta } from './utils';
import { TrendingUpIcon, TrendingDownIcon } from '../icons';

export interface AnalyticsKpiStripProps {
  totals: AnalyticsTotals;
  previousTotals: AnalyticsTotals | null;
  timeline: ActivityAnalytics['timeline'];
  stickiness: ActivityAnalytics['stickiness'];
  t: (key: any) => string;
}

export const AnalyticsKpiStrip: React.FC<AnalyticsKpiStripProps> = ({
  totals,
  previousTotals,
  timeline,
  stickiness,
  t,
}) => {
  const theme = useTheme();

  // Extract sparkline series from timeline
  const activeUsersData = timeline.map((d) => d.activeUsers);
  const sessionsData = timeline.map((d) => d.sessions);
  const timeData = timeline.map((d) => Math.round(d.trackedSeconds / 60)); // minutes
  const actionsData = timeline.map((d) => d.actions);

  // Compute stickiness %: (DAU / MAU) * 100
  const stickinessPct =
    stickiness.mau > 0 ? Math.round((stickiness.dau / stickiness.mau) * 100) : 0;

  const kpis = [
    {
      id: 'activeUsers',
      label: t('analyticsKpiActiveUsers'),
      value: totals.activeUsers.toLocaleString(),
      delta: calculateDelta(totals.activeUsers, previousTotals?.activeUsers),
      sparkline: activeUsersData,
      color: theme.palette.primary.main,
    },
    {
      id: 'sessions',
      label: t('analyticsKpiSessions'),
      value: totals.sessions.toLocaleString(),
      delta: calculateDelta(totals.sessions, previousTotals?.sessions),
      sparkline: sessionsData,
      color: '#0284c7', // sky
    },
    {
      id: 'activeTime',
      label: t('analyticsKpiActiveTime'),
      value: formatDuration(totals.trackedSeconds),
      delta: calculateDelta(totals.trackedSeconds, previousTotals?.trackedSeconds),
      sparkline: timeData,
      color: '#059669', // emerald
    },
    {
      id: 'avgSession',
      label: t('analyticsKpiAvgSession'),
      value: formatDuration(totals.avgSessionSeconds),
      delta: calculateDelta(totals.avgSessionSeconds, previousTotals?.avgSessionSeconds),
      sparkline: sessionsData,
      color: '#7c3aed', // purple
    },
    {
      id: 'actions',
      label: t('analyticsKpiActions'),
      value: totals.actions.toLocaleString(),
      delta: calculateDelta(totals.actions, previousTotals?.actions),
      sparkline: actionsData,
      color: '#d97706', // amber
    },
    {
      id: 'stickiness',
      label: t('analyticsKpiStickiness'),
      value: `${stickinessPct}%`,
      subtext: `DAU ${stickiness.dau} • MAU ${stickiness.mau}`,
      delta: null,
      sparkline: activeUsersData,
      color: '#e11d48', // rose
    },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        {kpis.map((kpi) => (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={kpi.id}>
            <Card
              elevation={0}
              sx={{
                p: 1.8,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (th) =>
                  th.palette.mode === 'dark' ? alpha(kpi.color, 0.05) : alpha(kpi.color, 0.03),
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  {kpi.label}
                </Typography>
                {kpi.delta && kpi.delta.percent !== null && (
                  <Chip
                    size="small"
                    icon={
                      kpi.delta.direction === 'up' ? (
                        <TrendingUpIcon sx={{ fontSize: '13px !important' }} />
                      ) : kpi.delta.direction === 'down' ? (
                        <TrendingDownIcon sx={{ fontSize: '13px !important' }} />
                      ) : undefined
                    }
                    label={kpi.delta.formatted}
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      px: 0.2,
                      bgcolor:
                        kpi.delta.direction === 'up'
                          ? alpha('#16a34a', 0.15)
                          : kpi.delta.direction === 'down'
                          ? alpha('#ef4444', 0.15)
                          : 'action.hover',
                      color:
                        kpi.delta.direction === 'up'
                          ? 'success.main'
                          : kpi.delta.direction === 'down'
                          ? 'error.main'
                          : 'text.secondary',
                    }}
                  />
                )}
              </Box>

              <Box sx={{ my: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  {kpi.value}
                </Typography>
                {kpi.subtext && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block', mt: 0.4 }}>
                    {kpi.subtext}
                  </Typography>
                )}
              </Box>

              {/* Sparkline mini chart */}
              <Box sx={{ height: 26, mt: 'auto' }}>
                {kpi.sparkline && kpi.sparkline.length > 1 ? (
                  <SparkLineChart
                    data={kpi.sparkline}
                    height={26}
                    color={kpi.color}
                    showHighlight
                    showTooltip
                  />
                ) : (
                  <Box sx={{ height: 26 }} />
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
