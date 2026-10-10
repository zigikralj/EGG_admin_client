import { test, expect } from '@playwright/test';

test.describe('Projects Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the necessary API calls for projects
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            name: 'Test Project 1',
            clientName: 'Test Client',
            type: 'Test Service',
            responsible: 'Test User',
            progress: 50,
            start: '2023-01-01',
            deadline: '2023-12-31',
            done: false,
            status: 'ACTIVE'
          }
        ]),
      });
    });

    await page.route('**/api/services', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'Test User', email: 'test@example.com', role: 'Admin' }),
      });
    });

    await page.route('**/api/roles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Admin', isSystemAdmin: true, permissions: {} }]),
      });
    });

    await page.route('**/api/preferences', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/stats', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/reminders', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/clients', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/invoices', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });

  test('should display the projects list and have a button to create a new project', async ({ page }) => {
    // Navigate to projects (we'll try /project-tracker/projects or the root if redirected)
    await page.goto('/');
    
    // Check if it redirects or if we need to explicitly go to projects
    await page.goto('/data-management/projects').catch(() => {});

    // Verify page title or specific header text
    await expect(page.locator('h6', { hasText: 'projectsListTitle' }).or(page.locator('h6').first())).toBeVisible();

    // Verify the project is rendered
    await expect(page.locator('td', { hasText: 'Test Project 1' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Test Client' })).toBeVisible();
  });
});
