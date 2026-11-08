import React, { useState, useMemo } from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { WasteDisposalPanel } from '../../components/tracker/WasteDisposalPanel';
import { AddIcon } from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ServiceAutocomplete } from '../../components/common/autocomplete';
import type { Service } from '../../types';
import {
  useProvidedServicesMutations,
  useInvoicesMutations,
  useTablePreferences,
  useWasteDisposalServiceId,
  useSystemSettingsMutations,
  useServiceDetailsQuery,
} from '../../queries';

export interface TrackerWasteDisposalPageProps {}

export const TrackerWasteDisposalPage: React.FC<TrackerWasteDisposalPageProps> = () => {
  const { t } = useLanguage();
  const { isRealAdmin } = useAuth();
  const isAdmin = Boolean(isRealAdmin);
  const {
    rowsPerPageOptions,
    onRowsPerPageOptionsChange,
    rowsPerPage,
    onRowsPerPageChange,
  } = useTablePreferences('tracker_waste');

  const { wasteDisposalServiceId, wasteDisposalService } = useWasteDisposalServiceId();
  const { updateSettingMutation } = useSystemSettingsMutations();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<Service | null>(null);
  const currentServiceId = selectedServiceId !== null ? selectedServiceId : wasteDisposalServiceId;

  const isConfiguredServiceJoined = Boolean(
    wasteDisposalService &&
    (currentServiceId === wasteDisposalServiceId ||
      currentServiceId === wasteDisposalService.id ||
      currentServiceId === wasteDisposalService.code)
  );

  const shouldFetchService = Boolean(
    currentServiceId &&
    !isConfiguredServiceJoined &&
    !selectedOption
  );

  const { data: fetchedService } = useServiceDetailsQuery(currentServiceId, shouldFetchService);

  const resolvedFetchedService = useMemo(() => {
    if (!fetchedService) return null;
    return Array.isArray(fetchedService) ? (fetchedService[0] as Service) : (fetchedService as Service);
  }, [fetchedService]);

  const selectedService = useMemo(() => {
    if (
      selectedOption &&
      (selectedOption.id === currentServiceId || selectedOption.code === currentServiceId)
    ) {
      return selectedOption;
    }
    if (isConfiguredServiceJoined && wasteDisposalService) {
      return wasteDisposalService;
    }
    return resolvedFetchedService || selectedOption || null;
  }, [selectedOption, currentServiceId, isConfiguredServiceJoined, wasteDisposalService, resolvedFetchedService]);

  const [newWasteServiceTrigger, setNewWasteServiceTrigger] = useState(0);
  const [wasteTotalCount, setWasteTotalCount] = useState<number>(0);

  const {
    handleSave: onSaveProvidedService,
    handleDelete: onDeleteProvidedServiceMutation,
  } = useProvidedServicesMutations();

  const {
    handleSave: onSaveInvoice,
    handleDelete: onDeleteInvoiceMutation,
    handleUpdateInvoiceStatus: onStatusChangeInvoiceMutation,
  } = useInvoicesMutations();

  const handleServiceChange = (serviceId: string | null, option?: Service | null) => {
    const nextId = serviceId || '';
    setSelectedServiceId(nextId);
    setSelectedOption(option || null);
    updateSettingMutation.mutate(
      { key: 'waste_disposal_service_id', value: nextId },
      {
        onError: () => {
          setSelectedServiceId(null);
          setSelectedOption(null);
        },
      }
    );
  };

  return (
    <Box sx={{ width: '100%', py: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('subTabWasteDisposal')}
          </Typography>
          <Chip label={wasteTotalCount} size="small" color="primary" sx={{ fontWeight: 700 }} />
          {isAdmin && (
            <Box sx={{ minWidth: 240, maxWidth: 320 }}>
              <ServiceAutocomplete
                size="small"
                label={t('lblSelectedWasteService')}
                value={currentServiceId}
                initialOption={selectedService}
                onChange={handleServiceChange}
                valueMode="id"
              />
            </Box>
          )}
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setNewWasteServiceTrigger((prev) => prev + 1)}
          disabled={!currentServiceId}
          size="small"
          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
        >
          {t('btnNewWasteDisposal')}
        </Button>
      </Box>
      <WasteDisposalPanel
        isFullHeight
        hideNotch
        configuredWasteServiceId={currentServiceId}
        targetWasteService={selectedService}
        openNewTrigger={newWasteServiceTrigger}
        onNewTriggerHandled={() => setNewWasteServiceTrigger(0)}
        onSaveProvidedService={onSaveProvidedService}
        onDeleteProvidedService={(id) => onDeleteProvidedServiceMutation(id, (_, cb) => cb())}
        onSaveInvoice={onSaveInvoice}
        onDeleteInvoice={(id) => onDeleteInvoiceMutation(id, (_, cb) => cb())}
        onStatusChangeInvoice={async (id, status, paymentDate) => {
          await onStatusChangeInvoiceMutation(id, status, paymentDate);
        }}
        rowsPerPageOptions={rowsPerPageOptions}
        onRowsPerPageOptionsChange={onRowsPerPageOptionsChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        onTotalCountChange={setWasteTotalCount}
      />
    </Box>
  );
};

export default TrackerWasteDisposalPage;
