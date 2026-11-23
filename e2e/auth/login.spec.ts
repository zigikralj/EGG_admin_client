import { test, expect } from '@playwright/test';
import { mockCommonApi } from '../helpers/mockApi';

test.describe('Login flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const adminUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Administrator',
    isApproved: true,
    status: 'APPROVED',
    isSystemAdmin: true,
    roleLevel: 100,
    permissions: {},
    roleEntity: {
      id: 1,
      name: 'Administrator',
      isSystemAdmin: true,
      level: 100,
      permissions: {},
    },
  };

  test('successful login redirects to dashboard', async ({ page }) => {
    await mockCommonApi(page, { user: adminUser });

    // Mock the login API
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: adminUser,
          token: 'fake-jwt-token',
          expiresIn: 3600,
        }),
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
    await mockCommonApi(page, { skipAuthMe: true });

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
    await mockCommonApi(page, { user: adminUser });

    // Mock the login API
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: adminUser,
          token: 'fake-jwt-token',
          expiresIn: 3600,
        }),
      });
    });

    await page.goto('/login');

    // Log in first
    await page.locator('input[type="text"]').first().fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Verify redirect away from login
    await page.waitForURL('**/project-tracker/**', { timeout: 10000 });
    await expect(page.getByRole('alert')).toBeHidden({ timeout: 10000 });

    // Open user avatar dropdown menu in header by clicking the user name/avatar box
    const userHeading = page.locator('header').getByRole('heading', { name: 'Test User' });
    await expect(userHeading).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('.MuiBackdrop-root')).toBeHidden({ timeout: 10000 }).catch(() => {});
    await expect(userHeading).toBeVisible({ timeout: 10000 });
    await userHeading.click();

    // Wait for the menu to open and click the logout menu item
    const logoutMenuItem = page.getByRole('menuitem', { name: /Odjavi se|Log Out/i });
    await expect(logoutMenuItem).toBeVisible();
    await logoutMenuItem.dispatchEvent('click');

    // Verify login page is rendered
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Verify auth token is cleared
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });
});
