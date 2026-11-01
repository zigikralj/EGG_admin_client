import React, { useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import {
  usePaginatedProvidedServicesQuery,
  usePaginatedServicesQuery,
  useClientsSummaryQuery,
  useCategoriesQuery,
  usePaginatedProjectsQuery,
  usePaginatedInvoicesQuery,
  useWasteDisposalServiceId,
} from '../../queries';
import { useLanguage } from '../../context/LanguageContext';
import { WasteDisposalStatistics } from '../../components/statistics';

export interface TrackerWasteStatsPageProps {}

export const TrackerWasteStatsPage: React.FC<TrackerWasteStatsPageProps> = () => {
  const { t } = useLanguage();
  const { wasteDisposalServiceId, isLoading: isLoadingSettings } = useWasteDisposalServiceId();

  const { data: providedData, isLoading: isLoadingProvided } = usePaginatedProvidedServicesQuery(
    {
      page: 0,
      rowsPerPage: 1000,
      isWasteDisposalOnly: true,
      wasteServiceId: wasteDisposalServiceId || undefined,
    },
    Boolean(wasteDisposalServiceId)
  );
  const providedServices = providedData?.items || [];

  const { data: servicesData } = usePaginatedServicesQuery(
    { page: 0, rowsPerPage: 1000 },
    Boolean(wasteDisposalServiceId)
  );
  const services = servicesData?.items || [];

  const { data: clients = [] } = useClientsSummaryQuery({
    enabled: Boolean(wasteDisposalServiceId),
  });
  const { data: categories = [] } = useCategoriesQuery({
    enabled: Boolean(wasteDisposalServiceId),
  });

  const { data: projectsData } = usePaginatedProjectsQuery(
    { page: 0, rowsPerPage: 1000 },
    Boolean(wasteDisposalServiceId)
  );
  const projects = projectsData?.items || [];

  const { data: invoicesData } = usePaginatedInvoicesQuery(
    { page: 0, rowsPerPage: 1000 },
    Boolean(wasteDisposalServiceId)
  );
  const invoices = invoicesData?.items || [];

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
