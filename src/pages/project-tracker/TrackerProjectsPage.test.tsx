import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrackerProjectsPage from './TrackerProjectsPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('TrackerProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with project cards', async () => {
    renderWithProviders(
      <TrackerProjectsPage
        onViewProject={vi.fn()}
        onEditProject={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('quickFilterMyProjects')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });
});
