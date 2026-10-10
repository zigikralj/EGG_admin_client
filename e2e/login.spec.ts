import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login flow', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    // Mock the login API
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'Admin' },
          token: 'fake-jwt-token',
          expiresIn: 3600
        }),
      });
    });

    // Mock the /api/auth/me API if it gets called immediately after
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'Test User', email: 'test@example.com', role: 'Admin' }),
      });
    });

    // Mock the /api/roles API if it gets called immediately after
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

    // Verify redirect away from login (to dashboard or projects list)
    await page.waitForURL('**/project-tracker/**', { timeout: 5000 });
    
    // We should be on a page other than login, check if a specific dashboard element is visible
    // For now we just verify we left the login page
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
});
