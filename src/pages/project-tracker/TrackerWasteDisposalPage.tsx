import React, { useState } from 'react';
import { Box } from '@mui/material';
import { WasteDisposalPanel } from '../../components/tracker/WasteDisposalPanel';
import {
  useProvidedServicesMutations,
  useInvoicesMutations,
  useTablePreferences,
} from '../../queries';

export interface TrackerWasteDisposalPageProps {}

export const TrackerWasteDisposalPage: React.FC<TrackerWasteDisposalPageProps> = () => {
  const {
    rowsPerPageOptions,
    onRowsPerPageOptionsChange,
    rowsPerPage,
    onRowsPerPageChange,
  } = useTablePreferences('tracker_waste');

  const [newWasteServiceTrigger, setNewWasteServiceTrigger] = useState(0);

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
    <Box sx={{ width: '100%', py: 1 }}>
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
      />
    </Box>
  );
};

export default TrackerWasteDisposalPage;
