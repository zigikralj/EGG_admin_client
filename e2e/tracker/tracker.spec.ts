import { test, expect } from '@playwright/test';

test.describe('Tracker Dashboard', () => {
  const mockProjects = [
    {
      id: '1',
      name: 'Eko Analiza Vazduha',
      clientName: 'Fabrika Cementa',
      type: 'Merenje emisije',
      responsible: 'Test User',
      progress: 50,
      start: '2025-01-10',
      deadline: '2025-12-31',
      done: false,
      status: 'ACTIVE',
    },
    {
      id: '2',
      name: 'Ispitivanje Otpadnih Voda',
      clientName: 'Hemijska Industrija',
      type: 'Uzorkovanje vode',
      responsible: 'Test User',
      progress: 80,
      start: '2025-02-01',
      deadline: '2025-11-30',
      done: false,
      status: 'ACTIVE',
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProjects),
      });
    });

    await page.route('**/api/clients', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Fabrika Cementa' },
          { id: '2', name: 'Hemijska Industrija' },
        ]),
      });
    });

    await page.route('**/api/services', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/categories', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/provided-services', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/reminders', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/invoices', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Test User', email: 'test@example.com', role: 'Admin' }]),
      });
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

    await page.route('**/api/projects/stats', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/activity-logs/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
  });

  test('tracker dashboard loads correctly with active project list', async ({ page }) => {
    await page.goto('/');

    // Verify main navigation / tracker title
    await expect(page.locator('header')).toBeVisible();

    // Verify projects are rendered on dashboard
    await expect(page.getByText('Eko Analiza Vazduha')).toBeVisible();
    await expect(page.getByText('Fabrika Cementa')).toBeVisible();
    await expect(page.getByText('Ispitivanje Otpadnih Voda')).toBeVisible();
    await expect(page.getByText('Hemijska Industrija')).toBeVisible();

    // Verify progress text
    await expect(page.getByText('50%')).toBeVisible();
    await expect(page.getByText('80%')).toBeVisible();
  });

  test('filters active project list via search input', async ({ page }) => {
    await page.goto('/');

    // Wait for projects to be displayed
    await expect(page.getByText('Eko Analiza Vazduha')).toBeVisible();

    // Find and click the collapsed search button to expand it
    const searchButton = page.getByRole('button', { name: /Pretraga|Search/i });
    await expect(searchButton).toBeVisible();
    await searchButton.click();

    // Type query matching only the second project in the expanded input
    const searchInput = page.getByPlaceholder(/Pretraga|Search/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Otpadnih Voda');

    // Second project is visible, first is filtered out
    await expect(page.getByText('Ispitivanje Otpadnih Voda')).toBeVisible();
    await expect(page.getByText('Eko Analiza Vazduha')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.getByText('Eko Analiza Vazduha')).toBeVisible();
    await expect(page.getByText('Ispitivanje Otpadnih Voda')).toBeVisible();
  });

  test('interacts with project card and toggles completion status', async ({ page }) => {
    let toggleRequested = false;
    await page.route('**/api/projects/1/toggle-done', async (route) => {
      toggleRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/');
    await expect(page.getByText('Eko Analiza Vazduha')).toBeVisible();

    // Locate the first project card
    const firstCard = page.locator('.MuiCard-root', { hasText: 'Eko Analiza Vazduha' });
    await expect(firstCard).toBeVisible();

    // Toggle completion checkbox on the project card
    const doneCheckbox = firstCard.locator('input[type="checkbox"]').first();
    await doneCheckbox.click();

    // Verify PATCH request was dispatched
    expect(toggleRequested).toBe(true);
  });
});
