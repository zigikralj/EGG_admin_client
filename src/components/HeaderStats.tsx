import React from 'react';
import { Box, Chip, Typography, Stack } from '@mui/material';





import type { ProjectStats } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { FolderIcon, CheckCircleOutlinedIcon, WarningAmberIcon, AccessTimeIcon, ErrorIcon } from './icons';

interface Props {
  stats: ProjectStats;
}

export const HeaderStats: React.FC<Props> = ({ stats }) => {
  const { t } = useLanguage();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
          {t('brandCompany')} · {t('brandLocation')}
        </Typography>
        <Typography variant="h5" color="primary.dark" sx={{ fontWeight: 700 }}>
          {t('headerProjectTracker')}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
        <Chip
          icon={<FolderIcon />}
          label={`${t('statInCreation')}: ${stats.active}`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
        {typeof stats.overdue === 'number' && (
          <Chip
            icon={<ErrorIcon />}
            label={`${t('statUrgentProjects').replaceAll('\n', ' ')}: ${stats.overdue}`}
            color="error"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        )}
        <Chip
          icon={<CheckCircleOutlinedIcon />}
          label={`${t('statDone')}: ${stats.done}`}
          color="info"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
        <Chip
          icon={<WarningAmberIcon />}
          label={`${t('statStale').replaceAll('\n', ' ')}: ${stats.stale}`}
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
        <Chip
          icon={<AccessTimeIcon sx={{ color: '#ff9800 !important' }} />}
          label={`${t('statMonitorSoon').replaceAll('\n', ' ')}: ${stats.monitor}`}
          variant="outlined"
          sx={{ fontWeight: 600, color: '#ff9800', borderColor: '#ff9800' }}
        />
      </Stack>
    </Box>
  );
};
