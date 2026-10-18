import React, { useState } from 'react';
import {
  Card,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import type { ActivityAnalytics } from '../../types';
import { formatBucketLabel } from './utils';

export interface UsageTimelineChartProps {
  timeline: ActivityAnalytics['timeline'];
  granularity: 'day' | 'week' | 'month';
  t: (key: any) => string;
  language: string;
}

type MetricMode = 'all' | 'users' | 'sessions' | 'hours' | 'actions';

export const UsageTimelineChart: React.FC<UsageTimelineChartProps> = ({
  timeline,
  granularity,
  t,
  language,
}) => {
  const theme = useTheme();
  const [metricMode, setMetricMode] = useState<MetricMode>('all');

  const xLabels = timeline.map((d) => formatBucketLabel(d.bucket, granularity, language));

  const allSeries = [
    {
      id: 'activeUsers',
      label: t('analyticsKpiActiveUsers'),
      data: timeline.map((d) => d.activeUsers),
      color: theme.palette.primary.main,
      area: metricMode === 'users',
    },
    {
      id: 'sessions',
      label: t('analyticsKpiSessions'),
      data: timeline.map((d) => d.sessions),
      color: '#0284c7', // sky
      area: metricMode === 'sessions',
    },
    {
      id: 'hours',
      label: t('hours'),
      data: timeline.map((d) => Number((d.trackedSeconds / 3600).toFixed(1))),
      color: '#059669', // emerald
      area: metricMode === 'hours',
    },
    {
      id: 'actions',
      label: t('analyticsKpiActions'),
      data: timeline.map((d) => d.actions),
      color: '#d97706', // amber
      area: metricMode === 'actions',
    },
  ];

  const series =
    metricMode === 'all'
      ? allSeries
      : allSeries.filter((s) => s.id === (metricMode === 'users' ? 'activeUsers' : metricMode));

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
            {t('analyticsChartTimelineTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            {t('analyticsChartTimelineSubtitle')}
          </Typography>
        </Box>

        <ToggleButtonGroup
          size="small"
          value={metricMode}
          exclusive
          onChange={(_, val) => {
            if (val) setMetricMode(val);
          }}
          sx={{
            height: 32,
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              px: 1.2,
            },
          }}
        >
          <ToggleButton value="all">{t('all')}</ToggleButton>
          <ToggleButton value="users">{t('analyticsKpiActiveUsers')}</ToggleButton>
          <ToggleButton value="sessions">{t('analyticsKpiSessions')}</ToggleButton>
          <ToggleButton value="hours">{t('hours')}</ToggleButton>
          <ToggleButton value="actions">{t('analyticsKpiActions')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ width: '100%', height: 320 }}>
        {timeline.length > 0 ? (
          <LineChart
            xAxis={[
              {
                scaleType: 'point',
                data: xLabels,
              },
            ]}
            series={series}
            height={300}
            grid={{ horizontal: true }}
            margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
          />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              {t('noData')}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};
