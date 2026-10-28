import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import {
  useProvidedServicesQuery,
  useServicesQuery,
  useClientsSummaryQuery,
  useCategoriesQuery,
  useProjectsQuery,
  useInvoicesQuery,
} from '../../queries';
import { useLanguage } from '../../context/LanguageContext';
import { WasteDisposalStatistics } from '../../components/statistics';

export interface TrackerWasteStatsPageProps {}

export const TrackerWasteStatsPage: React.FC<TrackerWasteStatsPageProps> = () => {
  const { t } = useLanguage();

  const { data: providedServices = [], isLoading: isLoadingProvided } = useProvidedServicesQuery();
  const { data: services = [] } = useServicesQuery();
  const { data: clients = [] } = useClientsSummaryQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: projects = [] } = useProjectsQuery();
  const { data: invoices = [] } = useInvoicesQuery();

  if (isLoadingProvided) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
      <WasteDisposalStatistics
        providedServices={providedServices}
        services={services}
        clients={clients}
        categories={categories}
        projects={projects}
        invoices={invoices}
        title={t('subTabWasteDisposal')}
      />
    </Box>
  );
};

export default TrackerWasteStatsPage;
