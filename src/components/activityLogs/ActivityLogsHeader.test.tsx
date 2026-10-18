import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityLogsHeader } from './ActivityLogsHeader';

describe('ActivityLogsHeader component', () => {
  const mockT = (key: string) => key;

  it('renders header elements and triggers actions', () => {
    const handleToggleClick = vi.fn();
    const handleRetentionSelect = vi.fn();
    const handleClearAllClick = vi.fn();
    const handleRefreshClick = vi.fn();

    render(
      <ActivityLogsHeader
        isLoggingEnabled={true}
        retentionDays={90}
        isStatusLoading={false}
        isFetching={false}
        isPendingToggle={false}
        isPendingSettings={false}
        onToggleClick={handleToggleClick}
        onRetentionSelect={handleRetentionSelect}
        onClearAllClick={handleClearAllClick}
        onRefreshClick={handleRefreshClick}
        language="en"
        t={mockT}
        isDark={false}
      />
    );

    // Header title
    expect(screen.getByText('tabActivityLogs')).toBeInTheDocument();

    // Toggle switch
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeChecked();
    fireEvent.click(switchEl);
    expect(handleToggleClick).toHaveBeenCalledWith(false);

    // Clear All button
    const clearButton = screen.getByRole('button', { name: 'Clear All' });
    fireEvent.click(clearButton);
    expect(handleClearAllClick).toHaveBeenCalled();

    // Refresh button
    const refreshIcon = screen.getByTestId('RefreshIcon');
    const refreshButton = refreshIcon.closest('button')!;
    fireEvent.click(refreshButton);
    expect(handleRefreshClick).toHaveBeenCalled();
  });

  it('shows paused status label when logging is disabled', () => {
    render(
      <ActivityLogsHeader
        isLoggingEnabled={false}
        retentionDays={90}
        isStatusLoading={false}
        isFetching={false}
        isPendingToggle={false}
        isPendingSettings={false}
        onToggleClick={vi.fn()}
        onRetentionSelect={vi.fn()}
        onClearAllClick={vi.fn()}
        onRefreshClick={vi.fn()}
        language="en"
        t={mockT}
        isDark={false}
      />
    );

    expect(screen.getByText('activityLogsStatusPaused')).toBeInTheDocument();
  });

  it('renders analytics button and triggers onAnalyticsClick', () => {
    const handleAnalyticsClick = vi.fn();
    render(
      <ActivityLogsHeader
        isLoggingEnabled={true}
        retentionDays={90}
        isStatusLoading={false}
        isFetching={false}
        isPendingToggle={false}
        isPendingSettings={false}
        onAnalyticsClick={handleAnalyticsClick}
        onToggleClick={vi.fn()}
        onRetentionSelect={vi.fn()}
        onClearAllClick={vi.fn()}
        onRefreshClick={vi.fn()}
        language="en"
        t={mockT}
        isDark={false}
      />
    );

    const btn = screen.getByRole('button', { name: /activityAnalytics/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleAnalyticsClick).toHaveBeenCalled();
  });
});
