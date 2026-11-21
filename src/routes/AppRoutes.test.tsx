import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';

vi.mock('../pages/system/RolesPage', () => ({
  default: () => <div data-testid="system-roles-page">System Roles Page</div>,
}));

vi.mock('../pages/system/ActivityLogsPage', () => ({
  default: () => <div data-testid="system-activity-logs-page">System Activity Logs Page</div>,
}));

vi.mock('../pages/system/ActivityAnalyticsPage', () => ({
  default: () => <div data-testid="system-activity-analytics-page">System Activity Analytics Page</div>,
}));

describe('AppRoutes legacy redirects', () => {
  it('redirects /data-management/roles to /system/roles', async () => {
    render(
      <MemoryRouter initialEntries={['/data-management/roles']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('system-roles-page')).toBeInTheDocument();
    });
  });

  it('redirects /data-management/activity-logs to /system/activity-logs', async () => {
    render(
      <MemoryRouter initialEntries={['/data-management/activity-logs']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('system-activity-logs-page')).toBeInTheDocument();
    });
  });

  it('redirects /data-management/activity-logs/analytics to /system/activity-logs/analytics', async () => {
    render(
      <MemoryRouter initialEntries={['/data-management/activity-logs/analytics']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('system-activity-analytics-page')).toBeInTheDocument();
    });
  });
});
