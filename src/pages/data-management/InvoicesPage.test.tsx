import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InvoicesPage from './InvoicesPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('InvoicesPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (props = {}) => {
    return renderWithProviders(
      <InvoicesPage
        visibleColumns={['invoiceNumber', 'client', 'project', 'amount', 'status', 'issueDate']}
        onVisibleColumnsChange={vi.fn()}
        rowsPerPageOptions={[25, 50, 100]}
        onRowsPerPageOptionsChange={vi.fn()}
        rowsPerPage={25}
        onRowsPerPageChange={vi.fn()}
        sortState={{ field: 'issueDate', direction: 'desc' }}
        onSortChange={vi.fn()}
        {...props}
      />
    );
  };

  it('renders the invoices list and data from MSW', async () => {
    renderPage();

    // Verify title
    expect(screen.getByText('invoicesListTitle')).toBeInTheDocument();

    // Invoices are empty in MSW, we should see empty message or we can add one in MSW
    // Right now MSW returns []
    await waitFor(() => {
      expect(screen.getByText('emptyInvoices')).toBeInTheDocument();
    });
  });

  it('opens new invoice modal locally', async () => {
    renderPage();

    const newBtn = screen.getByText('btnNewInvoice');
    fireEvent.click(newBtn);

    expect(screen.getByText('modalNewInvoice')).toBeInTheDocument();
  });
});
