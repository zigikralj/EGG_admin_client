import { test, expect } from '@playwright/test';

test.describe('Categories Management', () => {
  let categoriesData = [
    {
      id: 'cat-1',
      code: 'grp-waste',
      name: 'Upravljanje otpadom',
      description: 'Usluge i projekti vezani za tokove otpada',
    },
    {
      id: 'cat-2',
      code: 'grp-legal',
      name: 'Pravna usklađenost',
      description: 'Zakonodavni konsalting i pravne procene',
    },
  ];

  test.beforeEach(async ({ page }) => {
    categoriesData = [
      {
        id: 'cat-1',
        code: 'grp-waste',
        name: 'Upravljanje otpadom',
        description: 'Usluge i projekti vezani za tokove otpada',
      },
      {
        id: 'cat-2',
        code: 'grp-legal',
        name: 'Pravna usklađenost',
        description: 'Zakonodavni konsalting i pravne procene',
      },
    ];

    await page.route('**/api/categories', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(categoriesData),
        });
      } else if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        const created = { id: 'cat-3', ...payload };
        categoriesData.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/categories/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      const idMatch = url.match(/\/api\/categories\/([^/?#]+)/);
      const id = idMatch ? idMatch[1] : null;

      if (method === 'PUT' && id) {
        const payload = route.request().postDataJSON();
        const idx = categoriesData.findIndex((c) => c.id === id);
        if (idx !== -1) {
          categoriesData[idx] = { ...categoriesData[idx], ...payload };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(categoriesData[idx] || payload),
        });
      } else if (method === 'DELETE' && id) {
        categoriesData = categoriesData.filter((c) => c.id !== id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
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

    await page.route('**/api/clients', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/services', async (route) => {
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

    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Test User', email: 'test@example.com', role: 'Admin' }]),
      });
    });

    await page.route('**/api/activity-logs', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/activity-logs/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
  });

  test('should display categories list', async ({ page }) => {
    await page.goto('/data-management/categories');

    await expect(page.locator('td', { hasText: 'Upravljanje otpadom' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td', { hasText: 'Pravna usklađenost' })).toBeVisible();
  });

  test('should add a new category', async ({ page }) => {
    let createdPayload: any = null;
    await page.route('**/api/categories', async (route) => {
      if (route.request().method() === 'POST') {
        createdPayload = route.request().postDataJSON();
        const created = { id: 'cat-3', ...createdPayload };
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(categoriesData),
        });
      }
    });

    await page.goto('/data-management/categories');
    await expect(page.locator('td', { hasText: 'Upravljanje otpadom' })).toBeVisible({ timeout: 10000 });

    const newBtn = page.getByRole('button', { name: /Nova kategorija|New Category/i });
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/Šifra kategorije|Category Code/i).fill('grp-tech');
    await dialog.getByLabel(/Naziv kategorije|Category Name/i).fill('Tehnički pregledi');
    await dialog.getByLabel(/Opis|Description/i).fill('Kategorija za tehničku kontrolu');

    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(createdPayload).not.toBeNull();
    expect(createdPayload.code).toBe('grp-tech');
    expect(createdPayload.name).toBe('Tehnički pregledi');
  });

  test('should edit an existing category', async ({ page }) => {
    let updatedPayload: any = null;
    await page.route('**/api/categories/cat-1', async (route) => {
      if (route.request().method() === 'PUT') {
        updatedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'cat-1', ...updatedPayload }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/data-management/categories');
    await expect(page.locator('td', { hasText: 'Upravljanje otpadom' })).toBeVisible({ timeout: 10000 });

    const row = page.getByRole('row').filter({ hasText: 'Upravljanje otpadom' });
    const editBtn = row.locator('button:has([data-testid="EditIcon"])');
    await editBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByLabel(/Naziv kategorije|Category Name/i);
    await expect(nameInput).toHaveValue('Upravljanje otpadom');
    await nameInput.fill('Upravljanje otpadom i resursima');

    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(updatedPayload).not.toBeNull();
    expect(updatedPayload.name).toBe('Upravljanje otpadom i resursima');
  });

  test('should delete a category after confirmation', async ({ page }) => {
    let deleted = false;
    await page.route('**/api/categories/cat-1', async (route) => {
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

    await page.goto('/data-management/categories');
    await expect(page.locator('td', { hasText: 'Upravljanje otpadom' })).toBeVisible({ timeout: 10000 });

    const row = page.getByRole('row').filter({ hasText: 'Upravljanje otpadom' });
    const deleteBtn = row.locator('button:has([data-testid="DeleteIcon"])');
    await deleteBtn.click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    const confirmBtn = confirmDialog.getByRole('button', { name: /Obriši|Delete/i });
    await confirmBtn.click();

    await expect(confirmDialog).not.toBeVisible();
    expect(deleted).toBe(true);
  });
});
