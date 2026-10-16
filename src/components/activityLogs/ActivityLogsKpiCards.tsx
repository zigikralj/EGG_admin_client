import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  PeopleIcon,
  TimelineIcon,
  AccessTimeIcon,
  DonutLargeIcon
} from '../icons';
import type { KpiStats } from './types';
import { formatDuration } from './utils';

export interface ActivityLogsKpiCardsProps {
  kpiStats: KpiStats;
  language: string;
  t: (key: any) => string;
  isDark: boolean;
}

export const ActivityLogsKpiCards: React.FC<ActivityLogsKpiCardsProps> = ({
  kpiStats,
  language,
  t,
  isDark
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      {/* Metric 1: Tracked Users */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: isDark ? alpha('#2e7d32', 0.08) : '#fbfdfb' }}>
        <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t('totalTrackedUsers')}
            </Typography>
            <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.15), color: theme.palette.primary.main }}>
              <PeopleIcon fontSize="small" />
            </Avatar>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {kpiStats.totalUsers}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {kpiStats.activeToday} {language === 'en' ? 'active in the last 24h' : 'aktivno u poslednja 24h'}
          </Typography>
        </CardContent>
      </Card>

      {/* Metric 2: Total Sessions */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: isDark ? alpha('#0284c7', 0.08) : '#f8fbfe' }}>
        <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t('totalSessions')}
            </Typography>
            <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#0284c7', 0.15), color: '#0284c7' }}>
              <TimelineIcon fontSize="small" />
            </Avatar>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {kpiStats.totalSessions}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {kpiStats.totalUsers > 0 ? `~${Math.round(kpiStats.totalSessions / kpiStats.totalUsers)} ${language === 'en' ? 'sessions / user' : 'sesija po korisniku'}` : '-'}
          </Typography>
        </CardContent>
      </Card>

      {/* Metric 3: Total Tracked Time */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: isDark ? alpha('#7c3aed', 0.08) : '#faf8fe' }}>
        <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t('totalTrackedTime')}
            </Typography>
            <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#7c3aed', 0.15), color: '#7c3aed' }}>
              <AccessTimeIcon fontSize="small" />
            </Avatar>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {formatDuration(kpiStats.totalTrackedSeconds)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {kpiStats.totalSessions > 0
              ? `${formatDuration(Math.round(kpiStats.totalTrackedSeconds / kpiStats.totalSessions))} ${language === 'en' ? 'avg per session' : 'prosečno po sesiji'}`
              : '-'}
          </Typography>
        </CardContent>
      </Card>

      {/* Metric 4: Top Module */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: isDark ? alpha('#d97706', 0.08) : '#fefbf6' }}>
        <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t('topModule')}
            </Typography>
            <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#d97706', 0.15), color: '#d97706' }}>
              <DonutLargeIcon fontSize="small" />
            </Avatar>
          </Box>
          <Typography variant="h5" noWrap sx={{ fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {kpiStats.topModule}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {kpiStats.topModulePercent > 0 ? `${kpiStats.topModulePercent}% ${language === 'en' ? 'of overall usage' : 'ukupnog korišćenja'}` : '-'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
