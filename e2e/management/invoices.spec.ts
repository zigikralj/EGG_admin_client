import { test, expect } from '@playwright/test';

test.describe('Invoices Management', () => {
  let invoicesData = [
    {
      id: '1',
      invoiceNumber: 'INV-2023-001',
      invoiceType: 'Standard',
      clientId: '1',
      clientName: 'Eko Metal d.o.o.',
      projectId: '101',
      projectName: 'Solarni Paneli Blok A',
      dateCreated: '2023-01-01',
      dueDate: '2023-01-15',
      totalAmount: 1500,
      status: 'Draft',
      currency: 'RSD',
      items: [
        {
          id: 'item-1',
          description: 'Konsultantske usluge',
          quantity: 1,
          unitPrice: 1500,
          currency: 'RSD',
        },
      ],
    },
  ];

  test.beforeEach(async ({ page }) => {
    invoicesData = [
      {
        id: '1',
        invoiceNumber: 'INV-2023-001',
        invoiceType: 'Standard',
        clientId: '1',
        clientName: 'Eko Metal d.o.o.',
        projectId: '101',
        projectName: 'Solarni Paneli Blok A',
        dateCreated: '2023-01-01',
        dueDate: '2023-01-15',
        totalAmount: 1500,
        status: 'Draft',
        currency: 'RSD',
        items: [
          {
            id: 'item-1',
            description: 'Konsultantske usluge',
            quantity: 1,
            unitPrice: 1500,
            currency: 'RSD',
          },
        ],
      },
    ];

    // Mock all necessary endpoints
    await page.route('**/api/invoices', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(invoicesData),
        });
      } else if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        const created = { id: '2', ...payload, totalAmount: 2000 };
        invoicesData.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/invoices/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/status') && method === 'PATCH') {
        const payload = route.request().postDataJSON();
        const idMatch = url.match(/\/api\/invoices\/([^/?#]+)\/status/);
        const id = idMatch ? idMatch[1] : null;
        if (id) {
          const inv = invoicesData.find((i) => i.id === id);
          if (inv) {
            inv.status = payload.status;
            if (payload.paymentDate) inv.paymentDate = payload.paymentDate;
          }
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, ...payload }),
        });
        return;
      }

      const idMatch = url.match(/\/api\/invoices\/([^/?#]+)/);
      const id = idMatch ? idMatch[1] : null;

      if (method === 'PUT' && id) {
        const payload = route.request().postDataJSON();
        const idx = invoicesData.findIndex((i) => i.id === id);
        if (idx !== -1) {
          invoicesData[idx] = { ...invoicesData[idx], ...payload };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(invoicesData[idx] || payload),
        });
      } else if (method === 'DELETE' && id) {
        invoicesData = invoicesData.filter((i) => i.id !== id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/clients', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Eko Metal d.o.o.', city: 'Kraljevo' },
        ]),
      });
    });

    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '101', name: 'Solarni Paneli Blok A', clientId: '1', clientName: 'Eko Metal d.o.o.' },
        ]),
      });
    });

    await page.route('**/api/provided-services', async (route) => {
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

    await page.route('**/api/services', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/categories', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
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

  test('should display the invoices list', async ({ page }) => {
    await page.goto('/data-management/invoices');

    await expect(page.locator('td', { hasText: 'INV-2023-001' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td', { hasText: 'Eko Metal d.o.o.' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Solarni Paneli Blok A' })).toBeVisible();
  });

  test('should create a new invoice linked with a project', async ({ page }) => {
    let createdPayload: any = null;
    await page.route('**/api/invoices', async (route) => {
      if (route.request().method() === 'POST') {
        createdPayload = route.request().postDataJSON();
        const created = { id: '2', ...createdPayload, totalAmount: 2500 };
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(invoicesData),
        });
      }
    });

    await page.goto('/data-management/invoices');
    await expect(page.locator('td', { hasText: 'INV-2023-001' })).toBeVisible({ timeout: 10000 });

    // Click "New Invoice" / "Nova faktura"
    const newBtn = page.getByRole('button', { name: /Nova faktura|New Invoice/i });
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    // Dialog is visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill Invoice Number
    await dialog.getByLabel(/Broj fakture|Invoice Number/i).fill('INV-2024-999');

    // Select Client using autocomplete
    const clientInput = dialog.getByLabel(/Klijent|Client/i);
    await clientInput.click();
    await page.getByRole('option', { name: 'Eko Metal d.o.o.' }).click();

    // Select Project using autocomplete
    const projectInput = dialog.getByLabel(/Projekti|Projekat|Projects|Project/i);
    await projectInput.click();
    await page.getByRole('option', { name: 'Solarni Paneli Blok A' }).click();

    // Due date
    await dialog.getByLabel(/Rok \/ Datum|Due Date/i).fill('2024-12-31');

    // Item description
    const descInput = dialog.getByLabel(/^Opis/i).first();
    await descInput.fill('Izrada studije uticaja');

    // Save invoice
    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(createdPayload).not.toBeNull();
    expect(createdPayload.invoiceNumber).toBe('INV-2024-999');
    expect(createdPayload.clientId).toBe('1');
    expect(createdPayload.projectId).toBe('101');
  });

  test('should update invoice status using quick mark as paid', async ({ page }) => {
    let patchedStatus: any = null;
    await page.route('**/api/invoices/1/status', async (route) => {
      if (route.request().method() === 'PATCH') {
        patchedStatus = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, ...patchedStatus }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/data-management/invoices');
    await expect(page.locator('td', { hasText: 'INV-2023-001' })).toBeVisible({ timeout: 10000 });

    // The invoice row has status Draft, so it has a CheckCircleIcon to mark as paid
    const row = page.getByRole('row', { hasText: 'INV-2023-001' });
    const markAsPaidBtn = row.locator('button:has([data-testid="CheckCircleIcon"])');
    await expect(markAsPaidBtn).toBeVisible();
    await markAsPaidBtn.click();

    expect(patchedStatus).not.toBeNull();
    expect(patchedStatus.status).toBe('Paid');
  });
});
