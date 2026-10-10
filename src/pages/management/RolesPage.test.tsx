import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RolesPage from './RolesPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('RolesPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (props = {}) => {
    return renderWithProviders(
      <RolesPage {...props} />
    );
  };

  it('renders without crashing', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
