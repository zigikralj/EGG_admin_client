import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('successful login redirects to dashboard', async ({ page }) => {
    // Mock the login API
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'Admin' },
          token: 'fake-jwt-token',
          expiresIn: 3600,
        }),
      });
    });

    // Mock the /api/auth/me API
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'Test User', email: 'test@example.com', role: 'Admin' }),
      });
    });

    // Mock the /api/roles API
    await page.route('**/api/roles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Admin', isSystemAdmin: true, permissions: {} }]),
      });
    });

    await page.goto('/login');

    // Wait for the title
    await expect(page).toHaveTitle(/Ekos Green Group/i);

    // Fill the login form
    const emailInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Verify redirect away from login
    await page.waitForURL('**/project-tracker/**', { timeout: 5000 });
    expect(page.url()).not.toContain('/login');
  });

  test('failed login shows error message', async ({ page }) => {
    // Mock the login API to fail
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'INVALID_CREDENTIALS', message: 'Invalid credentials.' }),
      });
    });

    await page.goto('/login');

    const emailInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('wrong@example.com');
    await passwordInput.fill('wrongpassword');

    await page.locator('button[type="submit"]').click();

    // Verify error message is displayed
    await expect(page.locator('.MuiAlert-message')).toContainText('Invalid credentials');
  });

  test('logout functionality clears session and redirects to login', async ({ page }) => {
    // Mock the login API
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'Admin' },
          token: 'fake-jwt-token',
          expiresIn: 3600,
        }),
      });
    });

    await page.route('**/api/auth/me', async (route) => {
      const headers = route.request().headers();
      if (!headers['authorization']) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'UNAUTHORIZED' }),
        });
        return;
      }
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

    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/reminders', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/invoices', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/activity-logs/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/login');

    // Log in first
    await page.locator('input[type="text"]').first().fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Open user avatar dropdown menu in header by clicking the user name/avatar box
    const userHeading = page.locator('header').getByRole('heading', { name: 'Test User' });
    await expect(userHeading).toBeVisible({ timeout: 10000 });
    await userHeading.click();

    // Wait for the menu to open and click the logout menu item
    const logoutMenuItem = page.getByRole('menuitem', { name: /Odjavi se|Log Out/i });
    await expect(logoutMenuItem).toBeVisible();
    await logoutMenuItem.click();

    // Verify login page is rendered
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Verify auth token is cleared
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });
});
