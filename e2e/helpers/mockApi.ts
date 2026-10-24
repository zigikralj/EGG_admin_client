import type { Page } from '@playwright/test';

export interface MockApiOptions {
  user?: any;
  roles?: any[];
  preferences?: any;
  stats?: any;
  notifications?: any[];
  reminders?: any[];
  services?: any[];
  categories?: any[];
  clients?: any[];
  projects?: any[];
  invoices?: any[];
  permits?: any[];
  activityLogs?: any[];
  wasteCatalog?: any[];
}

/**
 * Standard default mocks for application background and common queries.
 * Prevents redundant mock definitions across all spec files.
 */
export async function mockCommonApi(page: Page, options: MockApiOptions = {}) {
  const defaultUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Admin',
    isApproved: true,
    status: 'ACTIVE',
    isSystemAdmin: true,
    permissions: {},
    roleEntity: { id: 1, name: 'Admin', isSystemAdmin: true, permissions: {} },
  };

  const defaultRoles = [
    { id: 1, name: 'Admin', isSystemAdmin: true, permissions: {} },
  ];

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.user || defaultUser),
    });
  });

  await page.route('**/api/roles', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.roles || defaultRoles),
    });
  });

  await page.route('**/api/preferences', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.preferences || {}),
    });
  });

  await page.route('**/api/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.stats || {}),
    });
  });

  await page.route('**/api/projects/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  await page.route('**/api/notifications', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.notifications || []),
    });
  });

  await page.route('**/api/users', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([options.user || defaultUser]),
    });
  });

  await page.route('**/api/activity-logs/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ active: true }),
    });
  });
}
