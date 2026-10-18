import React, { useState } from 'react';
import {
  Card,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { ActivityAnalytics } from '../../types';
import { aggregateCanonicalPages } from './utils';

export interface PageUsageChartProps {
  rawPages: ActivityAnalytics['pages'];
  t: (key: any) => string;
  language: string;
}

type SortBy = 'time' | 'views';

export const PageUsageChart: React.FC<PageUsageChartProps> = ({
  rawPages,
  t,
  language,
}) => {
  const theme = useTheme();
  const [sortBy, setSortBy] = useState<SortBy>('time');

  const pages = aggregateCanonicalPages(rawPages, t, language);

  const sortedPages = [...pages].sort((a, b) => {
    if (sortBy === 'time') return b.totalSeconds - a.totalSeconds;
    return b.views - a.views;
  }).slice(0, 10); // Top 10 pages

  const pageLabels = sortedPages.map((p) => p.label);
  const minutesData = sortedPages.map((p) => Math.round(p.totalSeconds / 60));
  const viewsData = sortedPages.map((p) => p.views);

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
            {t('analyticsChartPageUsageTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
            {t('analyticsChartPageUsageSubtitle')}
          </Typography>
        </Box>

        <ToggleButtonGroup
          size="small"
          value={sortBy}
          exclusive
          onChange={(_, val) => {
            if (val) setSortBy(val);
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
          <ToggleButton value="time">{t('analyticsSortByTime')}</ToggleButton>
          <ToggleButton value="views">{t('analyticsSortByViews')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ width: '100%', height: 360, mt: 'auto', display: 'flex' }}>
        {sortedPages.length > 0 ? (
          <BarChart
            sx={{ width: '100%' }}
            layout="horizontal"
            yAxis={[
              {
                scaleType: 'band',
                data: pageLabels,
                width: 130,
              },
            ]}
            series={[
              {
                data: minutesData,
                label: t('analyticsMinutes'),
                color: theme.palette.primary.main,
              },
              {
                data: viewsData,
                label: t('analyticsViews'),
                color: '#0284c7',
              },
            ]}
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
