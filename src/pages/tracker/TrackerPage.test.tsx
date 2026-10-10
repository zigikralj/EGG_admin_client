import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrackerPage from './TrackerPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('TrackerPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (props = {}) => {
    return renderWithProviders(
      <TrackerPage
        dashboardSubTab="projects"
        onViewProject={vi.fn()}
        onEditProject={vi.fn()}
        onNavigateToProjects={vi.fn()}
        onNavigateToInvoices={vi.fn()}
        onOpenNewProject={vi.fn()}
        quickFilters={[]}
        onQuickFiltersChange={vi.fn()}
        quickFilterDashboardReminders={false}
        onQuickFilterDashboardRemindersChange={vi.fn()}
        remindersRowsPerPageOptions={[5, 10]}
        onRemindersRowsPerPageOptionsChange={vi.fn()}
        remindersRowsPerPage={5}
        onRemindersRowsPerPageChange={vi.fn()}
        invoicesRowsPerPageOptions={[5, 10]}
        onInvoicesRowsPerPageOptionsChange={vi.fn()}
        invoicesRowsPerPage={5}
        onInvoicesRowsPerPageChange={vi.fn()}
        wasteManagementRowsPerPageOptions={[5, 10]}
        onWasteManagementRowsPerPageOptionsChange={vi.fn()}
        wasteManagementRowsPerPage={5}
        onWasteManagementRowsPerPageChange={vi.fn()}
        {...props}
      />
    );
  };

  it('renders without crashing', async () => {
    renderPage();
    await waitFor(() => {
      // The page loads lazy components or MSW data
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
