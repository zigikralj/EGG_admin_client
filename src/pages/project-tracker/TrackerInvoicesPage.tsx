import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ApproachingInvoicesPanel } from '../../components/tracker/ApproachingInvoicesPanel';
import {
  useInvoicesMutations,
  useProvidedServicesMutations,
  useTablePreferences,
} from '../../queries';
import { PAGE_ROUTES } from '../../constants';
import type { Project } from '../../types';

export interface TrackerInvoicesPageProps {
  onViewProject?: (project: Project) => void;
}

export const TrackerInvoicesPage: React.FC<TrackerInvoicesPageProps> = ({
  onViewProject,
}) => {
  const navigate = useNavigate();

  const {
    rowsPerPageOptions,
    onRowsPerPageOptionsChange,
    rowsPerPage,
    onRowsPerPageChange,
  } = useTablePreferences('tracker_invoices');

  const [newInvoiceTrigger, setNewInvoiceTrigger] = useState(0);

  const {
    handleSave: onSaveInvoice,
    handleDelete: onDeleteInvoiceMutation,
    handleUpdateInvoiceStatus: onStatusChangeInvoiceMutation,
  } = useInvoicesMutations();

  const { handleSave: onSaveProvidedService } = useProvidedServicesMutations();

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <ApproachingInvoicesPanel
        isFullHeight
        hideNotch
        openNewInvoiceTrigger={newInvoiceTrigger}
        onNewInvoiceTriggerHandled={() => setNewInvoiceTrigger(0)}
        onSaveInvoice={onSaveInvoice}
        onSaveProvidedService={onSaveProvidedService}
        onDeleteInvoice={(id) => onDeleteInvoiceMutation(id, (_, cb) => cb())}
        onStatusChangeInvoice={async (id, status, paymentDate) => {
          await onStatusChangeInvoiceMutation(id, status, paymentDate);
        }}
        onViewProject={onViewProject}
        onNavigateToInvoices={() => navigate(PAGE_ROUTES.INVOICES)}
        rowsPerPageOptions={rowsPerPageOptions}
        onRowsPerPageOptionsChange={onRowsPerPageOptionsChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Box>
  );
};

export default TrackerInvoicesPage;
