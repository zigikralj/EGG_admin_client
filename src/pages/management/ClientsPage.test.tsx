import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClientsPage from './ClientsPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('ClientsPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (props = {}) => {
    return renderWithProviders(
      <ClientsPage
        visibleColumns={['name', 'email', 'pib', 'mb', 'address', 'city']}
        onVisibleColumnsChange={vi.fn()}
        rowsPerPageOptions={[25, 50, 100]}
        onRowsPerPageOptionsChange={vi.fn()}
        rowsPerPage={25}
        onRowsPerPageChange={vi.fn()}
        sortState={{ field: 'name', direction: 'asc' }}
        onSortChange={vi.fn()}
        {...props}
      />
    );
  };

  it('renders the clients list and data from MSW', async () => {
    renderPage();

    // Verify title
    expect(screen.getByText('clientsListTitle')).toBeInTheDocument();

    // Wait for data to load from MSW
    await waitFor(() => {
      expect(screen.getByText('Mock Client')).toBeInTheDocument();
    });

    // Check row data
    expect(screen.getByText('client@example.com')).toBeInTheDocument();
  });

  it('handles search input locally', async () => {
    renderPage();

    // Click the search icon button to expand the input
    const searchBtn = screen.getByRole('button', { name: /searchPlaceholder/i });
    fireEvent.click(searchBtn);

    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'Test Client' } });

    expect(searchInput).toHaveValue('Test Client');
  });

  it('opens new client modal locally', async () => {
    renderPage();

    const newBtn = screen.getByText('btnNewClient');
    fireEvent.click(newBtn);

    expect(screen.getByText('modalNewClient')).toBeInTheDocument();
  });
});
