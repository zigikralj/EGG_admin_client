import React, { useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import {
  useProvidedServicesQuery,
  useServicesQuery,
  useClientsSummaryQuery,
  useCategoriesQuery,
  useProjectsQuery,
  useInvoicesQuery,
  useWasteDisposalServiceId,
} from '../../queries';
import { useLanguage } from '../../context/LanguageContext';
import { WasteDisposalStatistics } from '../../components/statistics';

export interface TrackerWasteStatsPageProps {}

export const TrackerWasteStatsPage: React.FC<TrackerWasteStatsPageProps> = () => {
  const { t } = useLanguage();
  const { wasteDisposalServiceId, isLoading: isLoadingSettings } = useWasteDisposalServiceId();

  const { data: providedServices = [], isLoading: isLoadingProvided } = useProvidedServicesQuery({
    enabled: Boolean(wasteDisposalServiceId),
  });
  const { data: services = [] } = useServicesQuery({
    enabled: Boolean(wasteDisposalServiceId),
  });
  const { data: clients = [] } = useClientsSummaryQuery({
    enabled: Boolean(wasteDisposalServiceId),
  });
  const { data: categories = [] } = useCategoriesQuery({
    enabled: Boolean(wasteDisposalServiceId),
  });
  const { data: projects = [] } = useProjectsQuery('', {
    enabled: Boolean(wasteDisposalServiceId),
  });
  const { data: invoices = [] } = useInvoicesQuery({
    enabled: Boolean(wasteDisposalServiceId),
  });

  const wasteProvidedServices = useMemo(() => {
    if (!wasteDisposalServiceId) return [];
    return providedServices.filter((ps) => ps.serviceId === wasteDisposalServiceId);
  }, [providedServices, wasteDisposalServiceId]);

  if (isLoadingSettings || (wasteDisposalServiceId && isLoadingProvided)) {
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
        providedServices={wasteProvidedServices}
        services={services}
        clients={clients}
        categories={categories}
        projects={projects}
        invoices={invoices}
        title={t('subTabWasteDisposal')}
        wasteServiceId={wasteDisposalServiceId}
      />
    </Box>
  );
};

export default TrackerWasteStatsPage;
