import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProvidedServicesPage from './ProvidedServicesPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('ProvidedServicesPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (props = {}) => {
    return renderWithProviders(
      <ProvidedServicesPage
        visibleColumns={['date', 'service', 'client', 'project', 'amount']}
        onVisibleColumnsChange={vi.fn()}
        rowsPerPageOptions={[25, 50, 100]}
        onRowsPerPageOptionsChange={vi.fn()}
        rowsPerPage={25}
        onRowsPerPageChange={vi.fn()}
        sortState={{ field: 'date', direction: 'desc' }}
        onSortChange={vi.fn()}
        {...props}
      />
    );
  };

  it('renders without crashing', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
