import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UsersPage from './UsersPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('UsersPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (props = {}) => {
    return renderWithProviders(
      <UsersPage
        visibleColumns={['name', 'email', 'role', 'status']}
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

  it('renders without crashing', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
