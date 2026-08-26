import { useState, useCallback } from 'react';
import type { Invoice, AppFetchers } from '../types';
import { apiFetch } from '../api';
import { useCrudOperations } from './useCrudOperations';

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

  const handleUpdateInvoiceStatus = useCallback(
    async (id: string, status: string, paymentDate?: string) => {
      const previousInvoices = [...invoices];
      setInvoices(invoices.map((inv) => (inv.id === id ? { ...inv, status, paymentDate } : inv)));

      try {
        const res = await apiFetch(`/api/invoices/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ status, paymentDate }),
        });
        if (res.ok) {
          fetchers.fetchInvoices();
          fetchers.fetchStats();
        } else {
          setInvoices(previousInvoices);
          const err = await res.json();
          alert(err.error || 'Failed to update invoice status');
        }
      } catch (e) {
        setInvoices(previousInvoices);
        console.error(e);
      }
    },
    [invoices, authHeaders, fetchers]
  );

  return {
    invoices,
    setInvoices,
    handleSaveInvoice: handleSave,
    handleDeleteInvoice: handleDelete,
    handleUpdateInvoiceStatus,
  };
}
