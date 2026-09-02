import { useState, useCallback } from 'react';
import type { Invoice, AppFetchers } from '../types';
import { useCrudOperations } from './useCrudOperations';
import { useStatusUpdate } from './useStatusUpdate';

/**
 * Manages invoice state and all invoice-related API operations.
 */
export function useInvoices(
  authHeaders: () => Record<string, string>,
  fetchers: AppFetchers,
  onDeleteConfirm: (message: string, onConfirm: () => void) => void,
) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const onSuccess = useCallback(() => {
    fetchers.fetchInvoices();
    fetchers.fetchStats();
  }, [fetchers]);

  const { handleSave, handleDelete } = useCrudOperations<Invoice>({
    basePath: '/api/invoices',
    items: invoices,
    authHeaders,
    onSuccess,
    onDeleteConfirm,
    deleteConfirmMessageKey: 'confirmDeleteInvoice',
    errorSaveMessageKey: 'errorSavingProject', // Fallback as there isn't a dedicated errorSavingInvoice in translations
    permissionDeniedMessageKey: 'permissionDeniedOnlyOwnProjects', // Generic fallback
  });

  const updateStatus = useStatusUpdate<Invoice>({
    basePath: '/api/invoices',
    items: invoices,
    setItems: setInvoices,
    authHeaders,
    onSuccess,
  });

  const handleUpdateInvoiceStatus = useCallback(
    (id: string, status: string, paymentDate?: string) =>
      updateStatus(id, { status, paymentDate }),
    [updateStatus]
  );

  return {
    invoices,
    setInvoices,
    handleSaveInvoice: handleSave,
    handleDeleteInvoice: handleDelete,
    handleUpdateInvoiceStatus,
  };
}
