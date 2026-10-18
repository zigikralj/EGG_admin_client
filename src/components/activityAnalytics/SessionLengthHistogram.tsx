import React from 'react';
import {
  Card,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { ActivityAnalytics } from '../../types';

export interface SessionLengthHistogramProps {
  buckets: ActivityAnalytics['sessionLengthBuckets'];
  t: (key: any) => string;
}

export const SessionLengthHistogram: React.FC<SessionLengthHistogramProps> = ({
  buckets,
  t,
}) => {
  const theme = useTheme();

  const labels = buckets.map((b) => b.bucket);
  const data = buckets.map((b) => b.count);

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
          {t('analyticsSessionHistogramTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
          {t('analyticsSessionHistogramSubtitle')}
        </Typography>
      </Box>

      <Box sx={{ width: '100%', height: 260, mt: 'auto', display: 'flex' }}>
        {buckets.some((b) => b.count > 0) ? (
          <BarChart
            sx={{ width: '100%' }}
            xAxis={[
              {
                scaleType: 'band',
                data: labels,
              },
            ]}
            series={[
              {
                data,
                label: t('analyticsKpiSessions'),
                color: theme.palette.primary.main,
              },
            ]}
            height={240}
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
