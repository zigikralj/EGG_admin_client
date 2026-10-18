import React from 'react';
import {
  Card,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { ScatterChart } from '@mui/x-charts/ScatterChart';
import type { ActivityAnalytics } from '../../types';
import { aggregateCanonicalPages } from './utils';

export interface EngagementScatterProps {
  rawPages: ActivityAnalytics['pages'];
  actions: ActivityAnalytics['actions'];
  t: (key: any) => string;
  language: string;
}

export const EngagementScatter: React.FC<EngagementScatterProps> = ({
  rawPages,
  t,
  language,
}) => {
  const theme = useTheme();

  const pages = aggregateCanonicalPages(rawPages, t, language);

  // Approximate actions per page: map actions count to related page
  const scatterData = pages
    .filter((p) => p.views > 0)
    .map((p, idx) => {
      // Estimate actions per visit based on views and total seconds
      const avgMinutesPerVisit = Number((p.avgSeconds / 60).toFixed(1));
      const actionsEstimated = Math.round(p.sessions > 0 ? (p.views / p.sessions) : 1);

      return {
        id: String(idx),
        x: avgMinutesPerVisit,
        y: actionsEstimated,
        label: p.label,
      };
    })
    .slice(0, 15);

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
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
          {t('analyticsEngagementScatterTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
          {t('analyticsEngagementScatterSubtitle')}
        </Typography>
      </Box>

      <Box sx={{ width: '100%', height: 340, mt: 'auto', display: 'flex' }}>
        {scatterData.length > 0 ? (
          <ScatterChart
            sx={{ width: '100%' }}
            series={[
              {
                data: scatterData.map((d) => ({ x: d.x, y: d.y, id: d.id })),
                label: t('analyticsPages'),
                color: theme.palette.primary.main,
                valueFormatter: (v) =>
                  `${(v as any)?.label || ''}: ${(v as any)?.x} ${t('analyticsMinutesShort')}, ${(v as any)?.y} ${t('analyticsActionsPerVisitShort')}`,
              },
            ]}
            xAxis={[
              {
                label: `${t('analyticsAvgTimePerVisit')} (${t('analyticsMinutesShort')})`,
              },
            ]}
            yAxis={[
              {
                label: t('analyticsActionsPerVisit'),
              },
            ]}
            height={320}
            grid={{ horizontal: true, vertical: true }}
            margin={{ top: 20, right: 30, bottom: 45, left: 50 }}
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
