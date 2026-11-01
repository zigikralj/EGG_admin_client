import React, { useState } from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { WasteDisposalPanel } from '../../components/tracker/WasteDisposalPanel';
import { AddIcon } from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ServiceAutocomplete } from '../../components/common/autocomplete';
import {
  useProvidedServicesMutations,
  useInvoicesMutations,
  useTablePreferences,
  useWasteDisposalServiceId,
  useSystemSettingsMutations,
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

  const { wasteDisposalServiceId } = useWasteDisposalServiceId();
  const { updateSettingMutation } = useSystemSettingsMutations();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const currentServiceId = selectedServiceId !== null ? selectedServiceId : wasteDisposalServiceId;

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

  const handleServiceChange = (serviceId: string | null) => {
    const nextId = serviceId || '';
    setSelectedServiceId(nextId);
    updateSettingMutation.mutate(
      { key: 'waste_disposal_service_id', value: nextId },
      {
        onError: () => {
          setSelectedServiceId(null);
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
