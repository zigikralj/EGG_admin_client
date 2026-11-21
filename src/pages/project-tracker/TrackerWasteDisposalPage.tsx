import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, Button, Alert } from '@mui/material';
import { WasteDisposalPanel } from '../../components/tracker/WasteDisposalPanel';
import { AddIcon } from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { PAGE_ROUTES } from '../../constants';
import type { Service } from '../../types';
import {
  useProvidedServicesMutations,
  useInvoicesMutations,
  useTablePreferences,
  useWasteDisposalServiceId,
  useServiceDetailsQuery,
} from '../../queries';

export interface TrackerWasteDisposalPageProps {}

export const TrackerWasteDisposalPage: React.FC<TrackerWasteDisposalPageProps> = () => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canConfigureSystemSettings = hasPermission('systemSettings', 'edit');
  const {
    rowsPerPageOptions,
    onRowsPerPageOptionsChange,
    rowsPerPage,
    onRowsPerPageChange,
  } = useTablePreferences('tracker_waste');

  const { wasteDisposalServiceId, wasteDisposalService } = useWasteDisposalServiceId();
  const currentServiceId = wasteDisposalServiceId;

  const isConfiguredServiceJoined = Boolean(
    wasteDisposalService &&
      (currentServiceId === wasteDisposalServiceId ||
        currentServiceId === wasteDisposalService.id ||
        currentServiceId === wasteDisposalService.code)
  );

  const shouldFetchService = Boolean(currentServiceId && !isConfiguredServiceJoined);
  const { data: fetchedService } = useServiceDetailsQuery(currentServiceId, shouldFetchService);

  const resolvedFetchedService = useMemo(() => {
    if (!fetchedService) return null;
    return Array.isArray(fetchedService)
      ? (fetchedService[0] as Service)
      : (fetchedService as Service);
  }, [fetchedService]);

  const selectedService = useMemo(() => {
    if (isConfiguredServiceJoined && wasteDisposalService) {
      return wasteDisposalService;
    }
    return resolvedFetchedService || null;
  }, [isConfiguredServiceJoined, wasteDisposalService, resolvedFetchedService]);

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

  return (
    <Box sx={{ width: '100%', py: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 0.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('subTabWasteDisposal')}
          </Typography>
          <Chip label={wasteTotalCount} size="small" color="primary" sx={{ fontWeight: 700 }} />
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

      {!currentServiceId && (
        <Alert
          severity="info"
          action={
            canConfigureSystemSettings ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate(PAGE_ROUTES.SYSTEM_SETTINGS)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {t('goToSystemSettings')}
              </Button>
            ) : undefined
          }
        >
          {t('wasteServiceUnconfiguredHint')}
        </Alert>
      )}

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
