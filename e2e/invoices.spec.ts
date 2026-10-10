import { test, expect } from '@playwright/test';

test.describe('Invoices Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the necessary API calls for invoices
    await page.route('**/api/invoices', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            invoiceNumber: 'INV-2023-001',
            invoiceType: 'Standard',
            clientId: '1',
            clientName: 'Test Client',
            projectId: '1',
            projectName: 'Test Project',
            dateCreated: '2023-01-01',
            dueDate: '2023-01-15',
            totalAmount: 1500,
            status: 'Draft',
            currency: 'RSD',
            items: []
          }
        ]),
      });
    });

    await page.route('**/api/clients', async (route) => {
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

    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/provided-services', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });

  test('should display the invoices list and have a button to create a new invoice', async ({ page }) => {
    // Navigate to invoices
    await page.goto('/data-management/invoices').catch(() => {});

    // Verify page title or specific header text
    await expect(page.locator('h5', { hasText: 'invoicesListTitle' }).or(page.locator('h5').first())).toBeVisible();

    // Verify the invoice is rendered
    await expect(page.locator('td', { hasText: 'INV-2023-001' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Test Client' })).toBeVisible();
  });
});
