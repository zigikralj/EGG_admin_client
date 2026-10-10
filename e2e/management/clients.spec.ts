import { test, expect } from '@playwright/test';

test.describe('Clients Management', () => {
  let clientsData = [
    {
      id: '1',
      name: 'Eko Metal d.o.o.',
      city: 'Kraljevo',
      contactPerson: 'Milan Marković',
      email: 'milan@ekometal.rs',
      phone: '+381641112233',
      projectCount: 3,
    },
  ];

  test.beforeEach(async ({ page }) => {
    clientsData = [
      {
        id: '1',
        name: 'Eko Metal d.o.o.',
        city: 'Kraljevo',
        contactPerson: 'Milan Marković',
        email: 'milan@ekometal.rs',
        phone: '+381641112233',
        projectCount: 3,
      },
    ];

    await page.route('**/api/clients', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clientsData),
        });
      } else if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        const created = { id: '2', ...payload, projectCount: 0 };
        clientsData.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/clients/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      const idMatch = url.match(/\/api\/clients\/([^/?#]+)/);
      const id = idMatch ? idMatch[1] : null;

      if (method === 'PUT' && id) {
        const payload = route.request().postDataJSON();
        const idx = clientsData.findIndex((c) => c.id === id);
        if (idx !== -1) {
          clientsData[idx] = { ...clientsData[idx], ...payload };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clientsData[idx] || payload),
        });
      } else if (method === 'DELETE' && id) {
        clientsData = clientsData.filter((c) => c.id !== id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/permits', async (route) => {
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

    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Test User', email: 'test@example.com', role: 'Admin' }]),
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

    await page.route('**/api/activity-logs', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/activity-logs/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
  });

  test('should display the clients list', async ({ page }) => {
    await page.goto('/data-management/clients');

    await expect(page.locator('td', { hasText: 'Eko Metal d.o.o.' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td', { hasText: 'Kraljevo' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Milan Marković' })).toBeVisible();
  });

  test('should add a new client', async ({ page }) => {
    let postReceived = false;
    await page.route('**/api/clients', async (route) => {
      if (route.request().method() === 'POST') {
        postReceived = true;
        const payload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: '2', ...payload, projectCount: 0 }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clientsData),
        });
      }
    });

    await page.goto('/data-management/clients');
    await expect(page.locator('td', { hasText: 'Eko Metal d.o.o.' })).toBeVisible({ timeout: 10000 });

    // Click "New Client" button
    const newBtn = page.getByRole('button', { name: /Novi klijent|New Client/i });
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    // Modal dialog is open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill form
    await dialog.getByLabel(/Naziv klijenta/i).fill('Zelena Energija d.o.o.');
    await dialog.getByLabel(/Grad/i).fill('Novi Sad');
    await dialog.getByLabel(/Kontakt osoba/i).fill('Jovan Petrović');
    await dialog.getByLabel(/E-pošta|Email/i).fill('jovan@zelena.rs');
    await dialog.getByLabel(/Telefon|Phone/i).fill('+38121555666');

    // Save
    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(postReceived).toBe(true);
  });

  test('should update an existing client', async ({ page }) => {
    let putReceived = false;
    await page.route('**/api/clients/1', async (route) => {
      if (route.request().method() === 'PUT') {
        putReceived = true;
        const payload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: '1', ...payload }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/data-management/clients');
    await expect(page.locator('td', { hasText: 'Eko Metal d.o.o.' })).toBeVisible();

    // Click edit icon button on the client row
    const editBtn = page.getByRole('row', { hasText: 'Eko Metal d.o.o.' }).locator('button:has([data-testid="EditIcon"])');
    await editBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByLabel(/Naziv klijenta/i);
    await expect(nameInput).toHaveValue('Eko Metal d.o.o.');
    await nameInput.fill('Eko Metal Global d.o.o.');

    // Save
    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(putReceived).toBe(true);
  });

  test('should delete a client after confirmation', async ({ page }) => {
    let deleteReceived = false;
    await page.route('**/api/clients/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteReceived = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/data-management/clients');
    await expect(page.locator('td', { hasText: 'Eko Metal d.o.o.' })).toBeVisible();

    // Click delete icon button on the client row
    const deleteBtn = page.getByRole('row', { hasText: 'Eko Metal d.o.o.' }).locator('button:has([data-testid="DeleteIcon"])');
    await deleteBtn.click();

    // Confirm dialog
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    const confirmBtn = confirmDialog.getByRole('button', { name: /Obriši|Delete/i });
    await confirmBtn.click();

    await expect(confirmDialog).not.toBeVisible();
    expect(deleteReceived).toBe(true);
  });
});
