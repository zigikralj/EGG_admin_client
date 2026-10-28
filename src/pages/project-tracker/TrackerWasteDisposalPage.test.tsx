import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrackerWasteDisposalPage from './TrackerWasteDisposalPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('TrackerWasteDisposalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    renderWithProviders(<TrackerWasteDisposalPage />);
    await waitFor(() => {
      expect(screen.getByText('statusCompleted')).toBeInTheDocument();
      expect(screen.getByText('btnNewWasteDisposal')).toBeInTheDocument();
    });
  });
});
