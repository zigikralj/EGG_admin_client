import React, { useState } from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ApproachingInvoicesPanel } from '../../components/tracker/ApproachingInvoicesPanel';
import { AddIcon } from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import {
  useInvoicesMutations,
  useProvidedServicesMutations,
  useTablePreferences,
} from '../../queries';
import { PAGE_ROUTES } from '../../constants';
import type { Project } from '../../types';

import { useProjectModal } from '../../context/ProjectModalContext';

export interface TrackerInvoicesPageProps {
  onViewProject?: (project: Project) => void;
}

export const TrackerInvoicesPage: React.FC<TrackerInvoicesPageProps> = ({
  onViewProject: propOnViewProject,
}) => {
  const { t } = useLanguage();
  const projectModal = useProjectModal();
  const onViewProject = propOnViewProject || projectModal.openViewProject;
  const navigate = useNavigate();

  const {
    rowsPerPageOptions,
    onRowsPerPageOptionsChange,
    rowsPerPage,
    onRowsPerPageChange,
  } = useTablePreferences('tracker_invoices');

  const [newInvoiceTrigger, setNewInvoiceTrigger] = useState(0);
  const [invoiceTotalCount, setInvoiceTotalCount] = useState<number>(0);

  const {
    handleSave: onSaveInvoice,
    handleDelete: onDeleteInvoiceMutation,
    handleUpdateInvoiceStatus: onStatusChangeInvoiceMutation,
  } = useInvoicesMutations();

  const { handleSave: onSaveProvidedService } = useProvidedServicesMutations();

  return (
    <Box sx={{ width: '100%', py: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('tabInvoices')}
          </Typography>
          <Chip label={invoiceTotalCount} size="small" color="primary" sx={{ fontWeight: 700 }} />
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setNewInvoiceTrigger((prev) => prev + 1)}
          size="small"
          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
        >
          {t('modalNewInvoice')}
        </Button>
      </Box>
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
        onTotalCountChange={setInvoiceTotalCount}
      />
    </Box>
  );
};

export default TrackerInvoicesPage;
