import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActivityAnalyticsPage from './ActivityAnalyticsPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('ActivityAnalyticsPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPI strip and timeline chart from MSW analytics data', async () => {
    renderWithProviders(<ActivityAnalyticsPage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check header
    expect(screen.getByText('activityAnalytics')).toBeInTheDocument();

    // Check KPIs
    expect(screen.getAllByText('analyticsKpiActiveUsers').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('analyticsKpiSessions').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('analyticsKpiActiveTime').length).toBeGreaterThanOrEqual(1);

    // Check tabs
    expect(screen.getByText('analyticsTabOverview')).toBeInTheDocument();
    expect(screen.getByText('analyticsTabPages')).toBeInTheDocument();
    expect(screen.getByText('analyticsTabActions')).toBeInTheDocument();
    expect(screen.getByText('analyticsTabUsers')).toBeInTheDocument();
    expect(screen.getByText('analyticsTabBehavior')).toBeInTheDocument();
  });

  it('allows switching tabs', async () => {
    renderWithProviders(<ActivityAnalyticsPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to Actions tab
    const actionsTab = screen.getByText('analyticsTabActions');
    fireEvent.click(actionsTab);

    // Should display actions charts
    expect(screen.getByText('analyticsChartActionsEntityTitle')).toBeInTheDocument();
  });
});
