import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityLogsHeader } from './ActivityLogsHeader';

describe('ActivityLogsHeader component', () => {
  const mockT = (key: string) => key;

  it('renders header elements and triggers actions when handlers are provided', () => {
    const handleAnalyticsClick = vi.fn();
    const handleClearAllClick = vi.fn();
    const handleRefreshClick = vi.fn();

    render(
      <ActivityLogsHeader
        isFetching={false}
        onAnalyticsClick={handleAnalyticsClick}
        onClearAllClick={handleClearAllClick}
        onRefreshClick={handleRefreshClick}
        language="en"
        t={mockT}
      />
    );

    expect(screen.getByText('tabActivityLogs')).toBeInTheDocument();
    expect(screen.getByText('activityLogsSubtitle')).toBeInTheDocument();

    const analyticsBtn = screen.getByRole('button', { name: /activityAnalytics/i });
    fireEvent.click(analyticsBtn);
    expect(handleAnalyticsClick).toHaveBeenCalledTimes(1);

    const clearButton = screen.getByRole('button', { name: 'btnClearAll' });
    fireEvent.click(clearButton);
    expect(handleClearAllClick).toHaveBeenCalledTimes(1);

    const refreshIcon = screen.getByTestId('RefreshIcon');
    const refreshButton = refreshIcon.closest('button')!;
    expect(refreshButton).not.toBeDisabled();
    fireEvent.click(refreshButton);
    expect(handleRefreshClick).toHaveBeenCalledTimes(1);
  });

  it('omits analytics and clear-all buttons when handlers are undefined', () => {
    render(
      <ActivityLogsHeader
        isFetching={false}
        onRefreshClick={vi.fn()}
        language="en"
        t={mockT}
      />
    );

    expect(screen.queryByRole('button', { name: /activityAnalytics/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'btnClearAll' })).not.toBeInTheDocument();
  });

  it('disables refresh button while fetching', () => {
    render(
      <ActivityLogsHeader
        isFetching={true}
        onRefreshClick={vi.fn()}
        language="en"
        t={mockT}
      />
    );

    const refreshIcon = screen.getByTestId('RefreshIcon');
    const refreshButton = refreshIcon.closest('button')!;
    expect(refreshButton).toBeDisabled();
  });
});
