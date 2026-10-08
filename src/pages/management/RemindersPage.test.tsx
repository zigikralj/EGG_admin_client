import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RemindersPage from './RemindersPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('RemindersPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => {
    return renderWithProviders(
      <RemindersPage />
    );
  };

  it('renders without crashing', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
