import React from 'react';
import {
  Card,
  Box,
  Typography,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import type { ActivityAnalytics } from '../../types';
import { formatDuration } from './utils';

export interface UsageHeatmapProps {
  heatmap: ActivityAnalytics['heatmap'];
  t: (key: any) => string;
  language: string;
}

const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_SR_LATN = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];
const DAYS_SR_CYRL = ['Пон', 'Уто', 'Сре', 'Чет', 'Пет', 'Суб', 'Нед'];

export const UsageHeatmap: React.FC<UsageHeatmapProps> = ({
  heatmap,
  t,
  language,
}) => {
  const theme = useTheme();
  const days = language === 'en' ? DAYS_EN : language === 'sr-Cyrl' ? DAYS_SR_CYRL : DAYS_SR_LATN;

  // Build 7x24 matrix
  const matrix: Array<Array<{ trackedSeconds: number; actions: number }>> = Array.from(
    { length: 7 },
    () => Array.from({ length: 24 }, () => ({ trackedSeconds: 0, actions: 0 }))
  );

  let maxSeconds = 0;
  for (const cell of heatmap) {
    if (cell.dow >= 0 && cell.dow < 7 && cell.hour >= 0 && cell.hour < 24) {
      matrix[cell.dow][cell.hour] = {
        trackedSeconds: cell.trackedSeconds,
        actions: cell.actions,
      };
      if (cell.trackedSeconds > maxSeconds) {
        maxSeconds = cell.trackedSeconds;
      }
    }
  }

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
          {t('analyticsHeatmapTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
          {t('analyticsHeatmapSubtitle')}
        </Typography>
      </Box>

      <Box sx={{ overflowX: 'auto', mt: 'auto', pb: 1 }}>
        <Box sx={{ minWidth: 620 }}>
          {/* Hour headers */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '45px repeat(24, 1fr)', gap: '2px', mb: 0.5 }}>
            <Box />
            {Array.from({ length: 24 }, (_, h) => (
              <Typography
                key={h}
                variant="caption"
                align="center"
                sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}
              >
                {h % 3 === 0 ? `${h}h` : ''}
              </Typography>
            ))}
          </Box>

          {/* Grid rows */}
          {matrix.map((hours, dow) => (
            <Box
              key={dow}
              sx={{
                display: 'grid',
                gridTemplateColumns: '45px repeat(24, 1fr)',
                gap: '2px',
                alignItems: 'center',
                mb: '2px',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: dow >= 5 ? 'text.secondary' : 'text.primary',
                }}
              >
                {days[dow]}
              </Typography>

              {hours.map((val, hour) => {
                const ratio = maxSeconds > 0 ? val.trackedSeconds / maxSeconds : 0;
                const opacity = ratio > 0 ? Math.max(0.12, ratio) : 0;
                const title = `${days[dow]} ${hour}:00 - ${hour + 1}:00 • ${formatDuration(val.trackedSeconds)} (${val.actions} ${t('analyticsKpiActions').toLowerCase()})`;

                return (
                  <Tooltip key={hour} title={title} arrow placement="top">
                    <Box
                      sx={{
                        height: 22,
                        borderRadius: 0.5,
                        bgcolor:
                          ratio > 0
                            ? alpha(theme.palette.primary.main, opacity)
                            : (th) =>
                                th.palette.mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.04)'
                                  : 'rgba(0, 0, 0, 0.04)',
                        transition: 'transform 0.15s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.2)',
                          boxShadow: 1,
                          zIndex: 1,
                        },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  );
};
