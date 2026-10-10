import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Mock the login APIs similar to login.spec.ts to perform the login
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

  await page.goto('/login');
  
  await page.locator('input[type="text"]').first().fill('test@example.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();

  // Wait until the page receives the cookies/local storage
  await page.waitForURL('**/project-tracker/**');
  
  // End of authentication steps.
  // Save storage state into the file.
  await page.context().storageState({ path: authFile });
});
