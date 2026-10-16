import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityLogsFilters } from './ActivityLogsFilters';

describe('ActivityLogsFilters component', () => {
  const userOptions = [
    { userId: 'u1', userName: 'Alice' },
    { userId: 'u2', userName: 'Bob' }
  ];

  const mockT = (key: string) => key;

  it('renders search input and triggers onSearchChange', () => {
    const handleSearchChange = vi.fn();

    render(
      <ActivityLogsFilters
        searchQuery=""
        onSearchChange={handleSearchChange}
        selectedUserFilter="ALL"
        onUserFilterChange={vi.fn()}
        timeRangeFilter="ALL"
        onTimeRangeChange={vi.fn()}
        userOptions={userOptions}
        t={mockT}
      />
    );

    const input = screen.getByPlaceholderText('searchActivities');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'alice' } });
    expect(handleSearchChange).toHaveBeenCalledWith('alice');
  });

  it('triggers onTimeRangeChange when toggle button is clicked', () => {
    const handleTimeRangeChange = vi.fn();

    render(
      <ActivityLogsFilters
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedUserFilter="ALL"
        onUserFilterChange={vi.fn()}
        timeRangeFilter="ALL"
        onTimeRangeChange={handleTimeRangeChange}
        userOptions={userOptions}
        t={mockT}
      />
    );

    const todayButton = screen.getByRole('button', { name: 'filterToday' });
    fireEvent.click(todayButton);

    expect(handleTimeRangeChange).toHaveBeenCalledWith('TODAY');
  });
});
