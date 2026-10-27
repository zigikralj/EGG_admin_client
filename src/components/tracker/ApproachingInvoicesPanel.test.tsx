import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApproachingInvoicesPanel } from './ApproachingInvoicesPanel';
import { renderWithProviders } from '../../tests/test-utils';
import type { Invoice } from '../../types';

describe('ApproachingInvoicesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-001',
      clientName: 'Client Alpha',
      projectName: 'Project One',
      status: 'Sent',
      invoiceType: 'Standard',
      totalAmount: 150000,
      currency: 'RSD',
      dueDate: '2026-11-15T00:00:00Z',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2026-002',
      clientName: 'Client Beta',
      projectName: 'Project Two',
      status: 'Paid',
      invoiceType: 'Advance',
      totalAmount: 75000,
      currency: 'RSD',
      dueDate: '2026-10-01T00:00:00Z',
    },
  ];

  it('renders correctly with client-side invoices prop', async () => {
    const onTotalCountChange = vi.fn();
    renderWithProviders(
      <ApproachingInvoicesPanel
        invoices={mockInvoices}
        onTotalCountChange={onTotalCountChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
      expect(screen.getByText('Client Alpha')).toBeInTheDocument();
      expect(screen.getByText('INV-2026-002')).toBeInTheDocument();
      expect(screen.getByText('Client Beta')).toBeInTheDocument();
    });

    expect(onTotalCountChange).toHaveBeenCalledWith(2);
  });

  it('renders in server-paginated mode when invoices prop is not provided', async () => {
    const onTotalCountChange = vi.fn();
    renderWithProviders(
      <ApproachingInvoicesPanel
        onTotalCountChange={onTotalCountChange}
      />
    );

    await waitFor(() => {
      // In MSW, /api/invoices paginated returns total 0 and empty items by default
      expect(screen.getByText('emptyInvoices')).toBeInTheDocument();
    });

    expect(onTotalCountChange).toHaveBeenCalledWith(0);
  });
});
