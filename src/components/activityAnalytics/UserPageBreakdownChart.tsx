import React, { useState } from 'react';
import {
  Card,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { ActivityAnalytics } from '../../types';
import { getPathLabelAndIcon, MODULE_COLORS, normalizeCanonicalPath } from './utils';

export interface UserPageBreakdownChartProps {
  users: ActivityAnalytics['users'];
  t: (key: any) => string;
  language: string;
}

export const UserPageBreakdownChart: React.FC<UserPageBreakdownChartProps> = ({
  users,
  t,
  language,
}) => {
  const [metric, setMetric] = useState<'actions' | 'time'>('actions');

  // Filter and sort users depending on selected metric
  const sortedUsers = [...users].sort((a, b) => {
    if (metric === 'actions') return b.actions - a.actions;
    return b.trackedSeconds - a.trackedSeconds;
  });

  const topUsers = sortedUsers.slice(0, 8);
  const userLabels = topUsers.map((u) => u.userName);

  let series: Array<{
    data: number[];
    label: string;
    stack: string;
    color: string;
    valueFormatter: (v: number | null) => string;
  }> = [];

  if (metric === 'actions') {
    const userCanonicalActions = topUsers.map((u) => {
      const map = new Map<string, number>();
      for (const pa of u.pageActions || []) {
        const canonical = normalizeCanonicalPath(pa.path);
        map.set(canonical, (map.get(canonical) || 0) + pa.actions);
      }
      return { user: u, map };
    });

    const pathSet = new Set<string>();
    for (const item of userCanonicalActions) {
      for (const [path, count] of item.map.entries()) {
        if (count > 0) pathSet.add(path);
      }
    }

    const distinctPaths = Array.from(pathSet);
    series = distinctPaths.map((path, idx) => {
      const meta = getPathLabelAndIcon(path, undefined, t, language);
      const data = userCanonicalActions.map(({ map }) => map.get(path) || 0);

      return {
        data,
        label: meta.label,
        stack: 'pages',
        color: MODULE_COLORS[idx % MODULE_COLORS.length],
        valueFormatter: (v: number | null) => `${v ?? 0} ${t('analyticsActions')}`,
      };
    });
  } else {
    const userCanonicalTime = topUsers.map((u) => {
      const map = new Map<string, number>();
      for (const ps of u.pageSeconds || []) {
        const canonical = normalizeCanonicalPath(ps.path);
        map.set(canonical, (map.get(canonical) || 0) + ps.seconds);
      }
      return { user: u, map };
    });

    const pathSet = new Set<string>();
    for (const item of userCanonicalTime) {
      for (const [path, seconds] of item.map.entries()) {
        if (seconds > 0) pathSet.add(path);
      }
    }

    const distinctPaths = Array.from(pathSet);
    series = distinctPaths.map((path, idx) => {
      const meta = getPathLabelAndIcon(path, undefined, t, language);
      const data = userCanonicalTime.map(({ map }) => Math.round((map.get(path) || 0) / 60));

      return {
        data,
        label: meta.label,
        stack: 'pages',
        color: MODULE_COLORS[idx % MODULE_COLORS.length],
        valueFormatter: (v: number | null) => `${v ?? 0} ${t('analyticsMinutesShort')}`,
      };
    });
  }

  const hasData = topUsers.length > 0 && series.length > 0 && series.some((s) => s.data.some((d) => d > 0));

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            {metric === 'actions'
              ? t('analyticsChartUserActionsBreakdownTitle')
              : t('analyticsChartUserBreakdownTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
            {metric === 'actions'
              ? t('analyticsChartUserActionsBreakdownSubtitle')
              : t('analyticsChartUserBreakdownSubtitle')}
          </Typography>
        </Box>

        <ToggleButtonGroup
          size="small"
          value={metric}
          exclusive
          onChange={(_, val) => {
            if (val) setMetric(val);
          }}
          sx={{
            height: 28,
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.72rem',
              px: 1,
            },
          }}
        >
          <ToggleButton value="actions">{t('analyticsActions')}</ToggleButton>
          <ToggleButton value="time">{t('analyticsSortByTime')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ width: '100%', height: 360, mt: 'auto', display: 'flex' }}>
        {hasData ? (
          <BarChart
            sx={{ width: '100%' }}
            layout="horizontal"
            yAxis={[
              {
                scaleType: 'band',
                data: userLabels,
                width: 130,
              },
            ]}
            series={series}
            height={340}
            grid={{ vertical: true }}
            margin={{ top: 20, right: 25, bottom: 30, left: 15 }}
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

