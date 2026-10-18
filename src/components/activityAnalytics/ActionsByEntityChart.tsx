import React from 'react';
import {
  Card,
  Box,
  Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { ActivityAnalytics } from '../../types';
import { getModelLabel } from './utils';

export interface ActionsByEntityChartProps {
  actions: ActivityAnalytics['actions'];
  t: (key: any) => string;
}

export const ActionsByEntityChart: React.FC<ActionsByEntityChartProps> = ({
  actions,
  t,
}) => {
  // Aggregate counts per model
  const modelMap = new Map<string, { create: number; update: number; delete: number }>();

  for (const item of actions) {
    if (!item.model) continue;
    const existing = modelMap.get(item.model) || { create: 0, update: 0, delete: 0 };
    if (item.action === 'create') existing.create += item.count;
    else if (item.action === 'update') existing.update += item.count;
    else if (item.action === 'delete') existing.delete += item.count;
    modelMap.set(item.model, existing);
  }

  // Sort models by total actions desc
  const sortedModels = Array.from(modelMap.entries())
    .map(([model, counts]) => ({
      model,
      total: counts.create + counts.update + counts.delete,
      ...counts,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const modelLabels = sortedModels.map((m) => getModelLabel(m.model, t));
  const createData = sortedModels.map((m) => m.create);
  const updateData = sortedModels.map((m) => m.update);
  const deleteData = sortedModels.map((m) => m.delete);

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
          {t('analyticsChartActionsEntityTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
          {t('analyticsChartActionsEntitySubtitle')}
        </Typography>
      </Box>

      <Box sx={{ width: '100%', height: 360, mt: 'auto', display: 'flex' }}>
        {sortedModels.length > 0 ? (
          <BarChart
            sx={{ width: '100%' }}
            layout="horizontal"
            yAxis={[
              {
                scaleType: 'band',
                data: modelLabels,
                width: 130,
              },
            ]}
            series={[
              {
                data: createData,
                label: t('actionCreate'),
                color: '#059669', // green
                stack: 'actions',
              },
              {
                data: updateData,
                label: t('actionUpdate'),
                color: '#d97706', // amber
                stack: 'actions',
              },
              {
                data: deleteData,
                label: t('actionDelete'),
                color: '#dc2626', // red
                stack: 'actions',
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
