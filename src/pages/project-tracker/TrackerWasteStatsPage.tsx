import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useWasteDisposalServiceId } from '../../queries';
import { useLanguage } from '../../context/LanguageContext';
import { WasteDisposalStatistics } from '../../components/statistics';

export interface TrackerWasteStatsPageProps {}

export const TrackerWasteStatsPage: React.FC<TrackerWasteStatsPageProps> = () => {
  const { t } = useLanguage();
  const { wasteDisposalServiceId, isLoading: isLoadingSettings } = useWasteDisposalServiceId();

  if (isLoadingSettings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!wasteDisposalServiceId) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
      <WasteDisposalStatistics
        title={t('subTabWasteDisposal')}
        wasteServiceId={wasteDisposalServiceId}
      />
    </Box>
  );
};

export default TrackerWasteStatsPage;
