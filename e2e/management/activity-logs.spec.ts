import { test, expect } from '@playwright/test';

test.describe('Activity Logs Management', () => {
  const mockUsers = [
    { id: 'u-1', name: 'Petar Petrović', email: 'petar@example.com', role: 'Admin', isApproved: true },
    { id: 'u-2', name: 'Marko Marković', email: 'marko@example.com', role: 'Worker', isApproved: true },
  ];

  let mockLogs = [
    {
      id: 'log-1',
      userId: 'u-1',
      userName: 'Petar Petrović',
      type: 'ACTION',
      path: '/data-management/clients',
      details: JSON.stringify({
        action: 'CREATE',
        model: 'Client',
        recordId: 'c-1',
        diff: { name: { new: 'Eko Metal d.o.o.' }, city: { new: 'Kraljevo' } },
      }),
      durationSeconds: 15,
      sessionId: 'sess-1',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'log-2',
      userId: 'u-1',
      userName: 'Petar Petrović',
      type: 'PAGE_VIEW',
      path: '/project-tracker',
      durationSeconds: 120,
      sessionId: 'sess-1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-3',
      userId: 'u-2',
      userName: 'Marko Marković',
      type: 'PAGE_VIEW',
      path: '/data-management/reminders',
      durationSeconds: 45,
      sessionId: 'sess-2',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ];

  let mockStatus = {
    enabled: true,
    retentionDays: 90,
  };

  test.beforeEach(async ({ page }) => {
    mockLogs = [
      {
        id: 'log-1',
        userId: 'u-1',
        userName: 'Petar Petrović',
        type: 'ACTION',
        path: '/data-management/clients',
        details: JSON.stringify({
          action: 'CREATE',
          model: 'Client',
          recordId: 'c-1',
          diff: { name: { new: 'Eko Metal d.o.o.' }, city: { new: 'Kraljevo' } },
        }),
        durationSeconds: 15,
        sessionId: 'sess-1',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'log-2',
        userId: 'u-1',
        userName: 'Petar Petrović',
        type: 'PAGE_VIEW',
        path: '/project-tracker',
        durationSeconds: 120,
        sessionId: 'sess-1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-3',
        userId: 'u-2',
        userName: 'Marko Marković',
        type: 'PAGE_VIEW',
        path: '/data-management/reminders',
        durationSeconds: 45,
        sessionId: 'sess-2',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ];

    mockStatus = {
      enabled: true,
      retentionDays: 90,
    };

    // Single unified route handler for all activity-logs routes to avoid route precedence leaking
    await page.route('**/api/activity-logs**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/api/activity-logs/status')) {
        if (method === 'PATCH') {
          const body = route.request().postDataJSON();
          mockStatus = { ...mockStatus, ...body };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockStatus),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockStatus),
          });
        }
        return;
      }

      if (url.includes('/api/activity-logs/clear-all')) {
        mockLogs = [];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, count: 0 }),
        });
        return;
      }

      const singleMatch = url.match(/\/api\/activity-logs\/([^/?#]+)$/);
      if (singleMatch && singleMatch[1] !== 'clear-all' && singleMatch[1] !== 'status') {
        const item = mockLogs.find((l) => l.id === singleMatch[1]);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item || {}),
        });
        return;
      }

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockLogs),
        });
      } else if (method === 'POST') {
        const body = route.request().postDataJSON();
        const entries = Array.isArray(body) ? body : [body];
        entries.forEach((e: any) => {
          mockLogs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userId: 'u-1',
            userName: 'Petar Petrović',
            timestamp: new Date().toISOString(),
            ...e,
          });
        });
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u-1',
          name: 'Petar Petrović',
          email: 'petar@example.com',
          role: 'Admin',
        }),
      });
    });

    await page.route('**/api/roles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Admin', isSystemAdmin: true, permissions: {} }]),
      });
    });

    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUsers),
      });
    });

    await page.route('**/api/preferences/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/preferences', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/stats', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/projects/stats', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/clients', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/services', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/categories', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/permits', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/reminders', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/invoices', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/provided-services', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });

  test('should display activity logs hierarchy with user cards and KPI metrics', async ({ page }) => {
    await page.goto('/data-management/activity-logs');

    // Page title and main container
    const mainContent = page.locator('main');
    await expect(mainContent.getByRole('heading', { name: /Istorija aktivnosti|Activity Logs/i })).toBeVisible({ timeout: 15000 });

    // Verify user groups are rendered in main content
    await expect(mainContent.getByRole('heading', { name: 'Petar Petrović' })).toBeVisible();
    await expect(mainContent.getByRole('heading', { name: 'Marko Marković' })).toBeVisible();

    // Verify KPI metrics are rendered
    await expect(mainContent.getByText(/Praćeni korisnici|Tracked Users/i).first()).toBeVisible();
    await expect(mainContent.getByText(/Ukupno sesija|Total sessions/i).first()).toBeVisible();
    await expect(mainContent.getByText(/Ukupno vreme|Total time/i).first()).toBeVisible();

    // Verify session activity is visible
    await expect(mainContent.getByText(/Sesija|Session/i).first()).toBeVisible();
  });

  test('should filter activity logs by search query', async ({ page }) => {
    await page.goto('/data-management/activity-logs');

    const mainContent = page.locator('main');
    await expect(mainContent.getByRole('heading', { name: 'Petar Petrović' })).toBeVisible({ timeout: 15000 });
    await expect(mainContent.getByRole('heading', { name: 'Marko Marković' })).toBeVisible();

    // Search input
    const searchInput = mainContent.locator('input[placeholder*="Pretraga"], input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Marko');

    await expect(mainContent.getByRole('heading', { name: 'Marko Marković' })).toBeVisible();
    await expect(mainContent.getByRole('heading', { name: 'Petar Petrović' })).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(mainContent.getByRole('heading', { name: 'Petar Petrović' })).toBeVisible();
  });

  test('should filter activity logs by user dropdown selection', async ({ page }) => {
    await page.goto('/data-management/activity-logs');

    const mainContent = page.locator('main');
    await expect(mainContent.getByRole('heading', { name: 'Petar Petrović' })).toBeVisible({ timeout: 15000 });
    await expect(mainContent.getByRole('heading', { name: 'Marko Marković' })).toBeVisible();

    // Click User select dropdown
    const userSelect = mainContent.getByRole('combobox', { name: /Korisnik|User/i });
    await userSelect.click();

    // Select Marko Marković from dropdown
    const option = page.getByRole('option', { name: 'Marko Marković' });
    await option.click();

    // Verify Marko's user card heading is visible in main and Petar's user card heading is not visible in main
    await expect(mainContent.getByRole('heading', { name: 'Marko Marković' })).toBeVisible();
    await expect(mainContent.getByRole('heading', { name: 'Petar Petrović' })).not.toBeVisible();
  });

  test('should toggle activity logging active and paused status', async ({ page }) => {
    await page.goto('/data-management/activity-logs');

    const mainContent = page.locator('main');
    await expect(mainContent.getByRole('heading', { name: /Istorija aktivnosti|Activity Logs/i })).toBeVisible({ timeout: 15000 });

    // Locate active switch
    const toggleSwitch = mainContent.locator('input[type="checkbox"]').first();
    await expect(toggleSwitch).toBeChecked();

    // Click to pause logging
    await toggleSwitch.click();

    // A confirmation dialog appears for deactivating
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();
    const confirmBtn = confirmDialog.getByRole('button', { name: /Deaktiviraj|Deactivate|Pauziraj/i });
    await confirmBtn.click();
    await expect(confirmDialog).not.toBeVisible();

    expect(mockStatus.enabled).toBe(false);
  });

  test('should record and display a new activity log after user action', async ({ page }) => {
    await page.goto('/data-management/activity-logs');

    const mainContent = page.locator('main');
    await expect(mainContent.getByRole('heading', { name: 'Petar Petrović' })).toBeVisible({ timeout: 15000 });

    // Add a new activity log entry to mock data dynamically
    const newLog = {
      id: 'log-new-action',
      userId: 'u-1',
      userName: 'Petar Petrović',
      type: 'ACTION',
      path: '/data-management/services',
      details: JSON.stringify({
        action: 'CREATE',
        model: 'Service',
        recordId: 'srv-99',
        diff: { name: { new: 'Nova Eko Usluga' } },
      }),
      durationSeconds: 10,
      sessionId: 'sess-1',
      timestamp: new Date().toISOString(),
    };
    mockLogs.unshift(newLog);

    // Click refresh button with RefreshIcon to re-fetch logs
    const refreshBtn = mainContent.locator('button:has([data-testid="RefreshIcon"])');
    await refreshBtn.click();

    // Verify the new activity path / model is now reflected
    await expect(mainContent.getByText(/Usluge|Services/i).first()).toBeVisible();
  });

  test('should clear all activity logs with confirmation', async ({ page }) => {
    await page.goto('/data-management/activity-logs');

    const mainContent = page.locator('main');
    await expect(mainContent.getByRole('heading', { name: 'Petar Petrović' })).toBeVisible({ timeout: 15000 });

    const clearAllBtn = mainContent.getByRole('button', { name: /Obriši sve|Clear All/i });
    await clearAllBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const confirmBtn = dialog.getByRole('button', { name: /Obriši|Delete|Potvrdi|Confirm/i });
    await confirmBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(mockLogs.length).toBe(0);

    // Empty state should be visible
    await expect(mainContent.getByText(/Nema pronađenih sesija|Nema sesija|No sessions found/i)).toBeVisible();
  });
});
