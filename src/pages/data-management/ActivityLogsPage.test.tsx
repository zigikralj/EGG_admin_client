import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActivityLogsPage from './ActivityLogsPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('ActivityLogsPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => {
    return renderWithProviders(
      <ActivityLogsPage />
    );
  };

  it('renders the activity logs list', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
