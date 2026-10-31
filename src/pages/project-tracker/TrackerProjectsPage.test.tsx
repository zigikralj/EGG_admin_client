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

  it('renders New Project button and triggers onOpenNewProject', async () => {
    const mockOnOpenNewProject = vi.fn();
    renderWithProviders(
      <TrackerProjectsPage
        onViewProject={vi.fn()}
        onEditProject={vi.fn()}
        onOpenNewProject={mockOnOpenNewProject}
      />
    );

    const newBtn = await screen.findByText('btnNewProject');
    expect(newBtn).toBeInTheDocument();
    newBtn.click();
    expect(mockOnOpenNewProject).toHaveBeenCalled();
  });
});
