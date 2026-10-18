import React from 'react';
import {
  Card,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { ActivityAnalytics } from '../../types';
import { getModelLabel } from './utils';

export interface EditedFieldsChartProps {
  editedFields: ActivityAnalytics['editedFields'];
  t: (key: any) => string;
}

export const EditedFieldsChart: React.FC<EditedFieldsChartProps> = ({
  editedFields,
  t,
}) => {
  const theme = useTheme();

  const topFields = [...editedFields]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const labels = topFields.map((f) => `${getModelLabel(f.model, t)} • ${f.field}`);
  const data = topFields.map((f) => f.count);

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
          {t('analyticsEditedFieldsTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
          {t('analyticsEditedFieldsSubtitle')}
        </Typography>
      </Box>

      <Box sx={{ width: '100%', height: 340, mt: 'auto', display: 'flex' }}>
        {topFields.length > 0 ? (
          <BarChart
            sx={{ width: '100%' }}
            layout="horizontal"
            yAxis={[
              {
                scaleType: 'band',
                data: labels,
                width: 150,
              },
            ]}
            series={[
              {
                data,
                label: t('analyticsChangesCount'),
                color: theme.palette.secondary?.main || '#7c3aed',
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
