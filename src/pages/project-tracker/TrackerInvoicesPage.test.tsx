import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrackerInvoicesPage from './TrackerInvoicesPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('TrackerInvoicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    renderWithProviders(<TrackerInvoicesPage />);
    await waitFor(() => {
      expect(screen.getByText('statusUnpaid')).toBeInTheDocument();
    });
  });
});
