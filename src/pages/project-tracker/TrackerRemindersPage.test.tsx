import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrackerRemindersPage from './TrackerRemindersPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('TrackerRemindersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing and displays New Reminder button', async () => {
    renderWithProviders(<TrackerRemindersPage />);
    await waitFor(() => {
      expect(screen.getByText('remindersTitle')).toBeInTheDocument();
      expect(screen.getByText('btnNewReminder')).toBeInTheDocument();
    });
  });
});
