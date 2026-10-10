import { test, expect } from '@playwright/test';

test.describe('Services & Provided Services Management', () => {
  let servicesData = [
    {
      id: 'srv-1',
      code: 'waste-audit',
      name: 'Revizija tokova otpada',
      group: 'grp-waste',
      frequency: 12,
      description: 'Godišnja provera upravljanja otpadom',
    },
  ];

  let providedServicesData = [
    {
      id: 'ps-1',
      serviceId: 'srv-1',
      serviceCode: 'waste-audit',
      serviceName: 'Revizija tokova otpada',
      clientId: 'c-1',
      clientName: 'Eko Metal d.o.o.',
      projectId: 'p-1',
      projectName: 'Otpad 2024',
      status: 'Completed',
      scheduledDate: '2024-05-01',
      completionDate: '2024-05-10',
      location: 'Kraljevo',
      customData: {},
    },
  ];

  test.beforeEach(async ({ page }) => {
    servicesData = [
      {
        id: 'srv-1',
        code: 'waste-audit',
        name: 'Revizija tokova otpada',
        group: 'grp-waste',
        frequency: 12,
        description: 'Godišnja provera upravljanja otpadom',
      },
    ];

    providedServicesData = [
      {
        id: 'ps-1',
        serviceId: 'srv-1',
        serviceCode: 'waste-audit',
        serviceName: 'Revizija tokova otpada',
        clientId: 'c-1',
        clientName: 'Eko Metal d.o.o.',
        projectId: 'p-1',
        projectName: 'Otpad 2024',
        status: 'Completed',
        scheduledDate: '2024-05-01',
        completionDate: '2024-05-10',
        location: 'Kraljevo',
        customData: {},
      },
    ];

    await page.route('**/api/services', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(servicesData),
        });
      } else if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        const created = { id: 'srv-2', ...payload };
        servicesData.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/services/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      const idMatch = url.match(/\/api\/services\/([^/?#]+)/);
      const id = idMatch ? idMatch[1] : null;

      if (method === 'PUT' && id) {
        const payload = route.request().postDataJSON();
        const idx = servicesData.findIndex((s) => s.id === id);
        if (idx !== -1) {
          servicesData[idx] = { ...servicesData[idx], ...payload };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(servicesData[idx] || payload),
        });
      } else if (method === 'DELETE' && id) {
        servicesData = servicesData.filter((s) => s.id !== id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/provided-services', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(providedServicesData),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'cat-1', code: 'grp-waste', name: 'Upravljanje otpadom' },
          { id: 'cat-2', code: 'grp-legal', name: 'Pravna usklađenost' },
        ]),
      });
    });

    await page.route('**/api/clients', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'c-1', name: 'Eko Metal d.o.o.' }]),
      });
    });

    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'p-1', name: 'Otpad 2024', clientId: 'c-1' }]),
      });
    });

    await page.route('**/api/invoices', async (route) => {
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

    await page.route('**/api/projects/stats', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/reminders', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Test User', email: 'test@example.com', role: 'Admin' }]),
      });
    });

    await page.route('**/api/permits', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/activity-logs', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/activity-logs/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
  });

  test('should display the services list', async ({ page }) => {
    await page.goto('/data-management/services');

    await expect(page.locator('td', { hasText: 'Revizija tokova otpada' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td', { hasText: 'Godišnja provera upravljanja otpadom' })).toBeVisible();
  });

  test('should add a new service', async ({ page }) => {
    let createdPayload: any = null;
    await page.route('**/api/services', async (route) => {
      if (route.request().method() === 'POST') {
        createdPayload = route.request().postDataJSON();
        const created = { id: 'srv-2', ...createdPayload };
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(servicesData),
        });
      }
    });

    await page.goto('/data-management/services');
    await expect(page.locator('td', { hasText: 'Revizija tokova otpada' })).toBeVisible({ timeout: 10000 });

    // Click "Nova usluga" button
    const newBtn = page.getByRole('button', { name: /Nova usluga|New Service/i });
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    // Dialog is visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill form
    await dialog.getByLabel(/Šifra usluge|Service Code/i).fill('eco-audit');
    await dialog.getByLabel(/Naziv usluge|Service Name/i).fill('Ekološki audit');
    await dialog.getByLabel(/Opis|Description/i).fill('Detaljan ekološki pregled lokacije');

    // Save
    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(createdPayload).not.toBeNull();
    expect(createdPayload.code).toBe('eco-audit');
    expect(createdPayload.name).toBe('Ekološki audit');
  });

  test('should edit an existing service', async ({ page }) => {
    let updatedPayload: any = null;
    await page.route('**/api/services/srv-1', async (route) => {
      if (route.request().method() === 'PUT') {
        updatedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'srv-1', ...updatedPayload }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/data-management/services');
    await expect(page.locator('td', { hasText: 'Revizija tokova otpada' })).toBeVisible({ timeout: 10000 });

    const row = page.getByRole('row', { hasText: 'Revizija tokova otpada' });
    const editBtn = row.locator('button:has([data-testid="EditIcon"])');
    await editBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByLabel(/Naziv usluge|Service Name/i);
    await expect(nameInput).toHaveValue('Revizija tokova otpada');
    await nameInput.fill('Revizija tokova otpada - Proširena');

    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(updatedPayload).not.toBeNull();
    expect(updatedPayload.name).toBe('Revizija tokova otpada - Proširena');
  });

  test('should delete a service after confirmation', async ({ page }) => {
    let deleted = false;
    await page.route('**/api/services/srv-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleted = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/data-management/services');
    await expect(page.locator('td', { hasText: 'Revizija tokova otpada' })).toBeVisible({ timeout: 10000 });

    const row = page.getByRole('row', { hasText: 'Revizija tokova otpada' });
    const deleteBtn = row.locator('button:has([data-testid="DeleteIcon"])');
    await deleteBtn.click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    const confirmBtn = confirmDialog.getByRole('button', { name: /Obriši|Delete/i });
    await confirmBtn.click();

    await expect(confirmDialog).not.toBeVisible();
    expect(deleted).toBe(true);
  });

  test('should display provided services list', async ({ page }) => {
    await page.goto('/data-management/provided-services');

    await expect(page.locator('td', { hasText: 'Revizija tokova otpada' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td', { hasText: 'Eko Metal d.o.o.' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Otpad 2024' })).toBeVisible();
  });
});
