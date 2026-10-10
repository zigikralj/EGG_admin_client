import { test, expect } from '@playwright/test';

test.describe('Permits Management', () => {
  let permitsData = [
    {
      id: 'p-1',
      permitNumber: 'DOZ-2023-001',
      indexNumber: '15 01 01',
      permitTypes: ['Sakupljanje', 'Transport'],
      clientId: 'c-1',
      client: { id: 'c-1', name: 'Eko Metal d.o.o.', city: 'Kraljevo' },
      clientName: 'Eko Metal d.o.o.',
      startDate: '2023-01-01',
      endDate: '2028-12-31',
      notes: 'Dozvola za neopasan ambalažni otpad',
      wasteCatalogIds: ['wc-1'],
      wasteCatalogs: [
        {
          id: 'wc-1',
          code: '15 01 01',
          description: 'Papirna i kartonska ambalaža',
          isHazardous: false,
        },
      ],
    },
    {
      id: 'p-2',
      permitNumber: 'DOZ-EXPIRED-99',
      indexNumber: '17 04 05',
      permitTypes: ['Skladištenje'],
      clientId: 'c-1',
      client: { id: 'c-1', name: 'Eko Metal d.o.o.', city: 'Kraljevo' },
      clientName: 'Eko Metal d.o.o.',
      startDate: '2020-01-01',
      endDate: '2021-01-01',
      notes: 'Stara istekla dozvola',
      wasteCatalogIds: ['wc-2'],
      wasteCatalogs: [
        {
          id: 'wc-2',
          code: '17 04 05',
          description: 'Gvožđe i čelik',
          isHazardous: false,
        },
      ],
    },
  ];

  const wasteCatalogItems = [
    {
      id: 'wc-1',
      code: '15 01 01',
      description: 'Papirna i kartonska ambalaža',
      isHazardous: false,
    },
    {
      id: 'wc-2',
      code: '17 04 05',
      description: 'Gvožđe i čelik',
      isHazardous: false,
    },
    {
      id: 'wc-3',
      code: '13 02 08*',
      description: 'Druga motorna ulja',
      isHazardous: true,
      hazardListMark: 'H5',
    },
  ];

  test.beforeEach(async ({ page }) => {
    permitsData = [
      {
        id: 'p-1',
        permitNumber: 'DOZ-2023-001',
        indexNumber: '15 01 01',
        permitTypes: ['Sakupljanje', 'Transport'],
        clientId: 'c-1',
        client: { id: 'c-1', name: 'Eko Metal d.o.o.', city: 'Kraljevo' },
        clientName: 'Eko Metal d.o.o.',
        startDate: '2023-01-01',
        endDate: '2028-12-31',
        notes: 'Dozvola za neopasan ambalažni otpad',
        wasteCatalogIds: ['wc-1'],
        wasteCatalogs: [
          {
            id: 'wc-1',
            code: '15 01 01',
            description: 'Papirna i kartonska ambalaža',
            isHazardous: false,
          },
        ],
      },
      {
        id: 'p-2',
        permitNumber: 'DOZ-EXPIRED-99',
        indexNumber: '17 04 05',
        permitTypes: ['Skladištenje'],
        clientId: 'c-1',
        client: { id: 'c-1', name: 'Eko Metal d.o.o.', city: 'Kraljevo' },
        clientName: 'Eko Metal d.o.o.',
        startDate: '2020-01-01',
        endDate: '2021-01-01',
        notes: 'Stara istekla dozvola',
        wasteCatalogIds: ['wc-2'],
        wasteCatalogs: [
          {
            id: 'wc-2',
            code: '17 04 05',
            description: 'Gvožđe i čelik',
            isHazardous: false,
          },
        ],
      },
    ];

    await page.route('**/api/permits', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(permitsData),
        });
      } else if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        const created = {
          id: 'p-3',
          ...payload,
          wasteCatalogs: wasteCatalogItems.filter((w) =>
            (payload.wasteCatalogIds || []).includes(w.id)
          ),
        };
        permitsData.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/permits/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      const idMatch = url.match(/\/api\/permits\/([^/?#]+)/);
      const id = idMatch ? idMatch[1] : null;

      if (method === 'PUT' && id) {
        const payload = route.request().postDataJSON();
        const idx = permitsData.findIndex((p) => p.id === id);
        if (idx !== -1) {
          permitsData[idx] = { ...permitsData[idx], ...payload };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(permitsData[idx] || payload),
        });
      } else if (method === 'DELETE' && id) {
        permitsData = permitsData.filter((p) => p.id !== id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/waste-catalog**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: wasteCatalogItems,
          total: wasteCatalogItems.length,
          page: 1,
          hasMore: false,
        }),
      });
    });

    await page.route('**/api/clients', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'c-1', name: 'Eko Metal d.o.o.', city: 'Kraljevo' },
        ]),
      });
    });

    await page.route('**/api/reminders', async (route) => {
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

  test('should display the permits list and status badges', async ({ page }) => {
    await page.goto('/data-management/permits');

    await expect(page.locator('td', { hasText: 'DOZ-2023-001' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td', { hasText: 'DOZ-EXPIRED-99' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Eko Metal d.o.o.' }).first()).toBeVisible();

    // Check status chips
    await expect(page.getByText(/Važeća|Active/i).first()).toBeVisible();
    await expect(page.getByText(/Istekla|Expired/i).first()).toBeVisible();
  });

  test('should create a new permit', async ({ page }) => {
    let createdPayload: any = null;
    await page.route('**/api/permits', async (route) => {
      if (route.request().method() === 'POST') {
        createdPayload = route.request().postDataJSON();
        const created = { id: 'p-3', ...createdPayload };
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(permitsData),
        });
      }
    });

    await page.goto('/data-management/permits');
    await expect(page.locator('td', { hasText: 'DOZ-2023-001' })).toBeVisible({ timeout: 10000 });

    // Click "Nova dozvola" button
    const newBtn = page.getByRole('button', { name: /Nova dozvola|New Permit/i });
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    // Dialog is visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill permit number
    await dialog.getByLabel(/Broj dozvole|Permit Number/i).fill('DOZ-2024-555');

    // Select Waste Catalog
    const indexInput = dialog.getByLabel(/Indeksni broj|Index Number/i);
    await indexInput.click();
    await page.getByRole('option', { name: /15 01 01/i }).first().click();

    // Select Client
    const clientInput = dialog.getByLabel(/Naziv klijenta|Client/i);
    await clientInput.click();
    await page.getByRole('option', { name: /Eko Metal d.o.o./i }).first().click();

    // Select Permit Type
    const typeInput = dialog.getByLabel(/Tip dozvole|Vrsta dozvole|Permit Type/i);
    await typeInput.click();
    await page.getByRole('option', { name: /Sakupljanje/i }).first().click();

    // Fill Start date
    const startDateInput = dialog.getByLabel(/Datum početka|Datum izdavanja|Start Date/i);
    await startDateInput.fill('2024-01-01');

    // Fill End date
    await dialog.getByLabel(/Datum isteka|End Date/i).fill('2029-01-01');

    // Fill Notes
    await dialog.getByLabel(/Napomene|Notes/i).fill('Nova dozvola za sakupljanje otpada');

    // Save
    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(createdPayload).not.toBeNull();
    expect(createdPayload.permitNumber).toBe('DOZ-2024-555');
    expect(createdPayload.clientId).toBe('c-1');
  });

  test('should edit an existing permit', async ({ page }) => {
    let updatedPayload: any = null;
    await page.route('**/api/permits/p-1', async (route) => {
      if (route.request().method() === 'PUT') {
        updatedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'p-1', ...updatedPayload }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/data-management/permits');
    await expect(page.locator('td', { hasText: 'DOZ-2023-001' })).toBeVisible({ timeout: 10000 });

    const row = page.getByRole('row').filter({ hasText: 'DOZ-2023-001' });
    const editBtn = row.locator('button:has([data-testid="EditIcon"])');
    await editBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const permitNumInput = dialog.getByLabel(/Broj dozvole|Permit Number/i);
    await expect(permitNumInput).toHaveValue('DOZ-2023-001');
    await permitNumInput.fill('DOZ-2023-001-IZMENJENO');

    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(updatedPayload).not.toBeNull();
    expect(updatedPayload.permitNumber).toBe('DOZ-2023-001-IZMENJENO');
  });

  test('should delete a permit after confirmation', async ({ page }) => {
    let deleted = false;
    await page.route('**/api/permits/p-1', async (route) => {
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

    await page.goto('/data-management/permits');
    await expect(page.locator('td', { hasText: 'DOZ-2023-001' })).toBeVisible({ timeout: 10000 });

    const row = page.getByRole('row').filter({ hasText: 'DOZ-2023-001' });
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
