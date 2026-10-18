import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserPageBreakdownChart } from './UserPageBreakdownChart';
import type { ActivityAnalytics } from '../../types';

describe('UserPageBreakdownChart', () => {
  const mockT = (key: string) => key;

  const mockUsers: ActivityAnalytics['users'] = [
    {
      userId: 'u1',
      userName: 'Alice Smith',
      role: 'Administrator',
      sessions: 5,
      activeDays: 3,
      trackedSeconds: 3600,
      pageViews: 40,
      actions: 25,
      avgSessionSeconds: 720,
      lastActive: '2026-10-16T12:00:00Z',
      topPath: '/data-management/projects',
      pageSeconds: [{ path: '/data-management/projects', seconds: 3600 }],
      pageActions: [
        { path: '/api/projects', actions: 15 },
        { path: '/api/invoices', actions: 10 },
      ],
    },
    {
      userId: 'u2',
      userName: 'Bob Jones',
      role: 'Manager',
      sessions: 2,
      activeDays: 1,
      trackedSeconds: 1200,
      pageViews: 10,
      actions: 5,
      avgSessionSeconds: 600,
      lastActive: '2026-10-16T10:00:00Z',
      topPath: '/data-management/permits',
      pageSeconds: [{ path: '/data-management/permits', seconds: 1200 }],
      pageActions: [{ path: '/api/permits', actions: 5 }],
    },
  ];

  it('renders actions per page per user by default', () => {
    render(
      <UserPageBreakdownChart
        users={mockUsers}
        t={mockT}
        language="en"
      />
    );

    // Default title is actions
    expect(screen.getByText('analyticsChartUserActionsBreakdownTitle')).toBeInTheDocument();
    expect(screen.getByText('analyticsChartUserActionsBreakdownSubtitle')).toBeInTheDocument();

    // Toggle buttons are rendered
    expect(screen.getByText('analyticsActions')).toBeInTheDocument();
    expect(screen.getByText('analyticsSortByTime')).toBeInTheDocument();
  });

  it('switches to time per page when toggled', () => {
    render(
      <UserPageBreakdownChart
        users={mockUsers}
        t={mockT}
        language="en"
      />
    );

    const timeToggle = screen.getByText('analyticsSortByTime');
    fireEvent.click(timeToggle);

    expect(screen.getByText('analyticsChartUserBreakdownTitle')).toBeInTheDocument();
    expect(screen.getByText('analyticsChartUserBreakdownSubtitle')).toBeInTheDocument();
  });

  it('renders noData when user array is empty', () => {
    render(
      <UserPageBreakdownChart
        users={[]}
        t={mockT}
        language="en"
      />
    );

    expect(screen.getByText('noData')).toBeInTheDocument();
  });
});
