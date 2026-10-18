import React from 'react';
import {
  Card,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { ActivityAnalytics } from '../../types';
import { aggregateCanonicalPages } from './utils';

export interface FeatureAdoptionChartProps {
  rawPages: ActivityAnalytics['pages'];
  totalUsers: number;
  t: (key: any) => string;
  language: string;
}

export const FeatureAdoptionChart: React.FC<FeatureAdoptionChartProps> = ({
  rawPages,
  totalUsers,
  t,
  language,
}) => {
  const theme = useTheme();

  const pages = aggregateCanonicalPages(rawPages, t, language);
  const effectiveTotal = Math.max(totalUsers, 1);

  const sortedPages = [...pages]
    .map((p) => ({
      ...p,
      adoptionPct: Math.min(100, Math.round((p.uniqueUsers / effectiveTotal) * 100)),
    }))
    .sort((a, b) => b.adoptionPct - a.adoptionPct)
    .slice(0, 10);

  const labels = sortedPages.map((p) => p.label);
  const data = sortedPages.map((p) => p.adoptionPct);

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
          {t('analyticsFeatureAdoptionTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
          {t('analyticsFeatureAdoptionSubtitle')}
        </Typography>
      </Box>

      <Box sx={{ width: '100%', height: 340, mt: 'auto', display: 'flex' }}>
        {sortedPages.length > 0 ? (
          <BarChart
            sx={{ width: '100%' }}
            layout="horizontal"
            yAxis={[
              {
                scaleType: 'band',
                data: labels,
                width: 130,
              },
            ]}
            xAxis={[
              {
                min: 0,
                max: 100,
                valueFormatter: (v: number | null) => (v !== null ? `${v}%` : ''),
              },
            ]}
            series={[
              {
                data,
                label: t('analyticsAdoptionPercent') || 'Adoption %',
                color: theme.palette.primary.main,
              },
            ]}
            height={320}
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
