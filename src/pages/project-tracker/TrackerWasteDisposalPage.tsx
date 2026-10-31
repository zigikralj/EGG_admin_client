import React, { useState } from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { WasteDisposalPanel } from '../../components/tracker/WasteDisposalPanel';
import { AddIcon } from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import {
  useProvidedServicesMutations,
  useInvoicesMutations,
  useTablePreferences,
} from '../../queries';

export interface TrackerWasteDisposalPageProps {}

export const TrackerWasteDisposalPage: React.FC<TrackerWasteDisposalPageProps> = () => {
  const { t } = useLanguage();
  const {
    rowsPerPageOptions,
    onRowsPerPageOptionsChange,
    rowsPerPage,
    onRowsPerPageChange,
  } = useTablePreferences('tracker_waste');

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
          size="small"
          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
        >
          {t('btnNewWasteDisposal')}
        </Button>
      </Box>
      <WasteDisposalPanel
        isFullHeight
        hideNotch
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
