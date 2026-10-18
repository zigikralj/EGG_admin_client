import React from 'react';
import {
  Card,
  Box,
  Typography,
  Button,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import type { ActivityAnalytics } from '../../types';
import { generateInsights } from './insights';
import { getPathLabelAndIcon, getModelLabel } from './utils';
import { LightbulbIcon, WhatshotIcon, ErrorIcon } from '../icons';

export interface InsightsPanelProps {
  data: ActivityAnalytics;
  onNavigateTab: (tab: 'overview' | 'pages' | 'actions' | 'users' | 'behavior') => void;
  t: (key: any, params?: any) => string;
  language: string;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  data,
  onNavigateTab,
  t,
  language,
}) => {
  const theme = useTheme();

  const labelOf = (path: string) => {
    const meta = getPathLabelAndIcon(path, undefined, t, language);
    return meta.label;
  };

  const modelLabelOf = (model: string) => {
    return getModelLabel(model, t);
  };

  const insights = generateInsights(data, labelOf, modelLabelOf);

  if (insights.length === 0) {
    // Show collecting data hint if sessions < 10
    if (data.totals.sessions < 10) {
      return (
        <Card
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (th) => (th.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.015)),
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <LightbulbIcon sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {t('analyticsCollectingDataHint')}
          </Typography>
        </Card>
      );
    }
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LightbulbIcon sx={{ color: 'warning.main', fontSize: 20 }} />
        {t('analyticsInsightsTitle')}
      </Typography>

      <Grid container spacing={2}>
        {insights.map((insight) => {
          const isWarning = insight.severity === 'warning';
          const isOpportunity = insight.severity === 'opportunity';
          const color = isWarning ? '#ef4444' : isOpportunity ? theme.palette.primary.main : '#0284c7';

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={insight.id}>
              <Card
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: (th) => (th.palette.mode === 'dark' ? alpha(color, 0.3) : alpha(color, 0.2)),
                  bgcolor: (th) => (th.palette.mode === 'dark' ? alpha(color, 0.06) : alpha(color, 0.03)),
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2, mb: 1.5 }}>
                  <Box sx={{ mt: 0.2 }}>
                    {isWarning ? (
                      <ErrorIcon sx={{ color, fontSize: 20 }} />
                    ) : isOpportunity ? (
                      <WhatshotIcon sx={{ color, fontSize: 20 }} />
                    ) : (
                      <LightbulbIcon sx={{ color, fontSize: 20 }} />
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem', lineHeight: 1.4 }}>
                    {t(insight.messageKey as any, insight.params)}
                  </Typography>
                </Box>

                {insight.targetTab && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                    <Button
                      size="small"
                      onClick={() => onNavigateTab(insight.targetTab!)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color,
                        p: 0,
                        minWidth: 0,
                      }}
                    >
                      {t('analyticsViewDetails')} →
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
