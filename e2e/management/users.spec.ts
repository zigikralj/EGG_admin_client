import { test, expect } from '@playwright/test';

test.describe('Users & Roles Management', () => {
  let usersData = [
    {
      id: '1',
      name: 'Petar Petrović',
      email: 'petar@ekosgreen.rs',
      role: 'Manager',
      status: 'APPROVED',
      phone: '+381641234567',
      gender: 'Male',
    },
    {
      id: '2',
      name: 'Jelena Jovanović',
      email: 'jelena@ekosgreen.rs',
      role: 'User',
      status: 'APPROVED',
      phone: '+381649876543',
      gender: 'Female',
    },
  ];

  let rolesData = [
    {
      id: 'r-1',
      name: 'Administrator',
      description: 'Puni sistemski pristup',
      isSystemAdmin: true,
      permissions: { all: true },
      _count: { users: 1 },
    },
    {
      id: 'r-2',
      name: 'Manager',
      description: 'Menadžer projekata i klijenata',
      isSystemAdmin: false,
      permissions: { projects: ['view', 'create', 'edit'] },
      _count: { users: 1 },
    },
    {
      id: 'r-3',
      name: 'User',
      description: 'Standardni korisnik sistema',
      isSystemAdmin: false,
      permissions: { projects: ['view'] },
      _count: { users: 1 },
    },
  ];

  test.beforeEach(async ({ page }) => {
    usersData = [
      {
        id: '1',
        name: 'Petar Petrović',
        email: 'petar@ekosgreen.rs',
        role: 'Manager',
        status: 'APPROVED',
        phone: '+381641234567',
        gender: 'Male',
      },
      {
        id: '2',
        name: 'Jelena Jovanović',
        email: 'jelena@ekosgreen.rs',
        role: 'User',
        status: 'APPROVED',
        phone: '+381649876543',
        gender: 'Female',
      },
    ];

    rolesData = [
      {
        id: 'r-1',
        name: 'Administrator',
        description: 'Puni sistemski pristup',
        isSystemAdmin: true,
        permissions: { all: true },
        _count: { users: 1 },
      },
      {
        id: 'r-2',
        name: 'Manager',
        description: 'Menadžer projekata i klijenata',
        isSystemAdmin: false,
        permissions: { projects: ['view', 'create', 'edit'] },
        _count: { users: 1 },
      },
      {
        id: 'r-3',
        name: 'User',
        description: 'Standardni korisnik sistema',
        isSystemAdmin: false,
        permissions: { projects: ['view'] },
        _count: { users: 1 },
      },
    ];

    await page.route('**/api/users', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(usersData),
        });
      } else if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        const created = { id: '3', status: 'APPROVED', ...payload };
        usersData.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/users/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      const idMatch = url.match(/\/api\/users\/([^/?#]+)/);
      const id = idMatch ? idMatch[1] : null;

      if (method === 'PUT' && id) {
        const payload = route.request().postDataJSON();
        const idx = usersData.findIndex((u) => u.id === id);
        if (idx !== -1) {
          usersData[idx] = { ...usersData[idx], ...payload };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(usersData[idx] || payload),
        });
      } else if (method === 'DELETE' && id) {
        usersData = usersData.filter((u) => u.id !== id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/roles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rolesData),
      });
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: '99', name: 'Admin Root', email: 'root@ekosgreen.rs', role: 'Administrator' }),
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

    await page.route('**/api/activity-logs', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/activity-logs/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
  });

  test('should display the users list', async ({ page }) => {
    await page.goto('/data-management/users');

    await expect(page.locator('td', { hasText: 'Petar Petrović' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td', { hasText: 'petar@ekosgreen.rs' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Jelena Jovanović' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'jelena@ekosgreen.rs' })).toBeVisible();
  });

  test('should add a new user', async ({ page }) => {
    let createdPayload: any = null;
    await page.route('**/api/users', async (route) => {
      if (route.request().method() === 'POST') {
        createdPayload = route.request().postDataJSON();
        const created = { id: '3', status: 'APPROVED', ...createdPayload };
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(usersData),
        });
      }
    });

    await page.goto('/data-management/users');
    await expect(page.locator('td', { hasText: 'Petar Petrović' })).toBeVisible({ timeout: 10000 });

    // Click "Novi korisnik" button
    const newBtn = page.getByRole('button', { name: /Novi korisnik|New User/i });
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill user name
    await dialog.getByLabel(/Ime i prezime|Full Name/i).fill('Milan Nikolić');

    // Select role
    const roleSelect = dialog.getByRole('combobox').first();
    await roleSelect.click();
    await page.getByRole('option', { name: /Menadžer|Manager/i }).first().click();

    // Fill email
    await dialog.getByLabel(/E-pošta|Email/i).fill('milan@ekosgreen.rs');

    // Fill initial password
    await dialog.getByLabel(/Lozinka|Password/i).fill('SigurnaLozinka123!');

    // Save
    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(createdPayload).not.toBeNull();
    expect(createdPayload.name).toBe('Milan Nikolić');
    expect(createdPayload.email).toBe('milan@ekosgreen.rs');
    expect(createdPayload.role).toBe('Manager');
  });

  test('should edit existing user role', async ({ page }) => {
    let updatedPayload: any = null;
    await page.route('**/api/users/2', async (route) => {
      if (route.request().method() === 'PUT') {
        updatedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: '2', ...updatedPayload }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/data-management/users');
    await expect(page.locator('td', { hasText: 'Jelena Jovanović' })).toBeVisible({ timeout: 10000 });

    const row = page.getByRole('row').filter({ hasText: 'Jelena Jovanović' });
    const editBtn = row.locator('button:has([data-testid="EditIcon"])');
    await editBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Change role from User to Manager
    const roleSelect = dialog.getByRole('combobox').first();
    await roleSelect.click();
    await page.getByRole('option', { name: /Menadžer|Manager/i }).first().click();

    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(updatedPayload).not.toBeNull();
    expect(updatedPayload.role).toBe('Manager');
  });

  test('should display the roles page with roles list', async ({ page }) => {
    await page.goto('/data-management/roles');

    await expect(page.getByRole('heading', { name: /Roles & Permissions/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td', { hasText: 'Administrator' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Manager' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'User' })).toBeVisible();
  });
});
