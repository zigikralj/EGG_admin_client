import { test, expect } from '@playwright/test';

test.describe('Reminders Management', () => {
  let remindersData = [
    {
      id: 'rem-1',
      title: 'Godišnji izveštaj o otpadu',
      projectId: 'proj-1',
      projectName: 'Eko Plan 2026',
      clientId: 'client-1',
      clientName: 'Eko Metal d.o.o.',
      responsibleId: 'u-1',
      responsible: 'Petar Petrović',
      status: 'Pending',
      notes: 'Podneti izveštaj do kraja meseca',
      dueDate: '2026-11-15',
      permitId: null,
      permitNumber: null,
    },
    {
      id: 'rem-2',
      title: 'Obnova dozvole za skladištenje',
      projectId: 'proj-2',
      projectName: 'Reciklaža Centar',
      clientId: 'client-2',
      clientName: 'BioReciklaža d.o.o.',
      responsibleId: 'u-2',
      responsible: 'Marko Marković',
      status: 'Completed',
      notes: 'Dozvola uspešno obnovljena',
      dueDate: '2026-10-01',
      permitId: null,
      permitNumber: null,
    },
    {
      id: 'rem-3',
      title: 'Periodično merenje buke',
      projectId: 'proj-1',
      projectName: 'Eko Plan 2026',
      clientId: 'client-1',
      clientName: 'Eko Metal d.o.o.',
      responsibleId: 'u-1',
      responsible: 'Petar Petrović',
      status: 'Overdue',
      notes: 'Hitno kontaktirati laboratoriju',
      dueDate: '2026-09-01',
      permitId: null,
      permitNumber: null,
    },
  ];

  test.beforeEach(async ({ page }) => {
    remindersData = [
      {
        id: 'rem-1',
        title: 'Godišnji izveštaj o otpadu',
        projectId: 'proj-1',
        projectName: 'Eko Plan 2026',
        clientId: 'client-1',
        clientName: 'Eko Metal d.o.o.',
        responsibleId: 'u-1',
        responsible: 'Petar Petrović',
        status: 'Pending',
        notes: 'Podneti izveštaj do kraja meseca',
        dueDate: '2026-11-15',
        permitId: null,
        permitNumber: null,
      },
      {
        id: 'rem-2',
        title: 'Obnova dozvole za skladištenje',
        projectId: 'proj-2',
        projectName: 'Reciklaža Centar',
        clientId: 'client-2',
        clientName: 'BioReciklaža d.o.o.',
        responsibleId: 'u-2',
        responsible: 'Marko Marković',
        status: 'Completed',
        notes: 'Dozvola uspešno obnovljena',
        dueDate: '2026-10-01',
        permitId: null,
        permitNumber: null,
      },
      {
        id: 'rem-3',
        title: 'Periodično merenje buke',
        projectId: 'proj-1',
        projectName: 'Eko Plan 2026',
        clientId: 'client-1',
        clientName: 'Eko Metal d.o.o.',
        responsibleId: 'u-1',
        responsible: 'Petar Petrović',
        status: 'Overdue',
        notes: 'Hitno kontaktirati laboratoriju',
        dueDate: '2026-09-01',
        permitId: null,
        permitNumber: null,
      },
    ];

    await page.route('**/api/reminders/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/status') && method === 'PATCH') {
        const idMatch = url.match(/\/api\/reminders\/([^/]+)\/status/);
        const id = idMatch ? idMatch[1] : null;
        const body = route.request().postDataJSON();
        const item = remindersData.find((r) => r.id === id);
        if (item) {
          item.status = body.status;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item || { success: true }),
        });
        return;
      }

      const idMatch = url.match(/\/api\/reminders\/([^/?#]+)$/);
      const id = idMatch ? idMatch[1] : null;

      if (method === 'PUT' && id) {
        const payload = route.request().postDataJSON();
        const idx = remindersData.findIndex((r) => r.id === id);
        if (idx !== -1) {
          remindersData[idx] = { ...remindersData[idx], ...payload };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(remindersData[idx] || payload),
        });
      } else if (method === 'DELETE' && id) {
        remindersData = remindersData.filter((r) => r.id !== id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/reminders', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(remindersData),
        });
      } else if (method === 'POST') {
        const newRem = route.request().postDataJSON();
        const created = {
          ...newRem,
          id: `rem-${Date.now()}`,
          status: newRem.status || 'Pending',
        };
        remindersData.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u-1',
          name: 'Petar Petrović',
          email: 'petar@example.com',
          role: 'Admin',
        }),
      });
    });

    await page.route('**/api/roles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Admin', isSystemAdmin: true, permissions: {} }]),
      });
    });

    await page.route('**/api/preferences/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'proj-1', name: 'Eko Plan 2026', clientId: 'client-1', clientName: 'Eko Metal d.o.o.' },
          { id: 'proj-2', name: 'Reciklaža Centar', clientId: 'client-2', clientName: 'BioReciklaža d.o.o.' },
        ]),
      });
    });

    await page.route('**/api/clients', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'client-1', name: 'Eko Metal d.o.o.', city: 'Kraljevo' },
          { id: 'client-2', name: 'BioReciklaža d.o.o.', city: 'Beograd' },
        ]),
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

    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'u-1', name: 'Petar Petrović', email: 'petar@example.com', role: 'Worker', isApproved: true },
          { id: 'u-2', name: 'Marko Marković', email: 'marko@example.com', role: 'Worker', isApproved: true },
        ]),
      });
    });

    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/activity-logs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ logs: [], totalCount: 0, totalPages: 1 }),
      });
    });

    await page.route('**/api/activity-logs/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ enabled: true }),
      });
    });

    await page.route('**/api/invoices', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/provided-services', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });

  test('should display reminders list with status chips and column values', async ({ page }) => {
    await page.goto('/data-management/reminders');

    await expect(page.getByText('Godišnji izveštaj o otpadu')).toBeVisible();
    await expect(page.getByText('Obnova dozvole za skladištenje')).toBeVisible();
    await expect(page.getByText('Periodično merenje buke')).toBeVisible();

    // Verify status chips (support both Serbian and English locales)
    const rowPending = page.getByRole('row').filter({ hasText: 'Godišnji izveštaj o otpadu' });
    await expect(rowPending.locator('.MuiChip-root', { hasText: /Na čekanju|Pending/i })).toBeVisible();

    const rowCompleted = page.getByRole('row').filter({ hasText: 'Obnova dozvole za skladištenje' });
    await expect(rowCompleted.locator('.MuiChip-root', { hasText: /Završeno|Completed/i })).toBeVisible();

    const rowOverdue = page.getByRole('row').filter({ hasText: 'Periodično merenje buke' });
    await expect(rowOverdue.locator('.MuiChip-root', { hasText: /Kasni|Overdue/i })).toBeVisible();
  });

  test('should search and filter reminders', async ({ page }) => {
    await page.goto('/data-management/reminders');

    await expect(page.getByText('Godišnji izveštaj o otpadu')).toBeVisible();

    // Search filter: click search button if collapsed
    const searchTrigger = page.locator('button:has([data-testid="SearchIcon"]), button[aria-label*="Pretraga"], button[aria-label*="Search"]');
    if (await searchTrigger.isVisible()) {
      await searchTrigger.click();
    }
    const searchInput = page.locator('input[placeholder*="Pretraga"], input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Godišnji');

    await expect(page.getByText('Godišnji izveštaj o otpadu')).toBeVisible();
    await expect(page.getByText('Obnova dozvole za skladištenje')).not.toBeVisible();
    await expect(page.getByText('Periodično merenje buke')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.getByText('Obnova dozvole za skladištenje')).toBeVisible();

    // Quick filter: click Pending / Na čekanju checkbox
    const quickFilterPending = page.getByRole('checkbox', { name: /Na čekanju|Pending/i });
    await quickFilterPending.click();

    await expect(page.getByText('Godišnji izveštaj o otpadu')).toBeVisible();
    await expect(page.getByText('Obnova dozvole za skladištenje')).not.toBeVisible();
  });

  test('should create a new reminder', async ({ page }) => {
    await page.goto('/data-management/reminders');

    const newBtn = page.getByRole('button', { name: /Novi podsetnik|New Reminder/i });
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Novi podsetnik|New Reminder/i)).toBeVisible();

    // Fill title
    const titleInput = dialog.getByLabel(/Naziv podsetnika|Reminder Title/i);
    await titleInput.fill('Provera filtera za vazduh');

    // Fill notes
    const notesInput = dialog.getByLabel(/Napomene|Notes/i);
    await notesInput.fill('Redovna tromesečna zamena filtera');

    // Submit dialog
    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/reminders') && res.request().method() === 'POST'),
      saveBtn.click(),
    ]);

    await expect(dialog).not.toBeVisible();
    expect(response.status()).toBe(201);
    const createdItem = await response.json();
    expect(createdItem.title).toBe('Provera filtera za vazduh');
    expect(createdItem.notes).toBe('Redovna tromesečna zamena filtera');

    // Verify new row renders in table
    await expect(page.getByText('Provera filtera za vazduh')).toBeVisible();
  });

  test('should mark a reminder as completed via table action', async ({ page }) => {
    let patchedStatus: string | null = null;
    await page.route('**/api/reminders/rem-1/status', async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON();
        patchedStatus = body.status;
        const item = remindersData.find((r) => r.id === 'rem-1');
        if (item) item.status = body.status;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item || { success: true }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/data-management/reminders');

    const targetRow = page.getByRole('row').filter({ hasText: 'Godišnji izveštaj o otpadu' });
    await expect(targetRow).toBeVisible();

    // Click complete button (button with CheckIcon or tooltip Završeno / Completed)
    const completeBtn = targetRow.locator('button:has([data-testid="CheckIcon"])');
    await completeBtn.click();

    expect(patchedStatus).toBe('Completed');

    // Verify row now shows Completed status chip
    await expect(targetRow.locator('.MuiChip-root', { hasText: /Završeno|Completed/i })).toBeVisible();
  });

  test('should edit an existing reminder', async ({ page }) => {
    let putBody: any = null;
    await page.route('**/api/reminders/rem-3', async (route) => {
      if (route.request().method() === 'PUT') {
        putBody = route.request().postDataJSON();
        const idx = remindersData.findIndex((r) => r.id === 'rem-3');
        if (idx !== -1) {
          remindersData[idx] = { ...remindersData[idx], ...putBody };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(remindersData[idx] || putBody),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/data-management/reminders');

    const targetRow = page.getByRole('row').filter({ hasText: 'Periodično merenje buke' });
    await expect(targetRow).toBeVisible();

    const editBtn = targetRow.locator('button:has([data-testid="EditIcon"])');
    await editBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Izmeni podsetnik|Edit Reminder/i)).toBeVisible();

    // Edit notes
    const notesInput = dialog.getByLabel(/Napomene|Notes/i);
    await notesInput.fill('Laboratorija kontaktirana, dogovoren termin');

    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(putBody).toBeTruthy();
    expect(putBody.notes).toBe('Laboratorija kontaktirana, dogovoren termin');

    await expect(page.getByText('Laboratorija kontaktirana, dogovoren termin')).toBeVisible();
  });

  test('should delete a reminder with confirmation', async ({ page }) => {
    let deletedId: string | null = null;
    await page.route('**/api/reminders/rem-3', async (route) => {
      if (route.request().method() === 'DELETE') {
        deletedId = 'rem-3';
        remindersData = remindersData.filter((r) => r.id !== 'rem-3');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/data-management/reminders');

    const targetRow = page.getByRole('row').filter({ hasText: 'Periodično merenje buke' });
    await expect(targetRow).toBeVisible();

    const deleteBtn = targetRow.locator('button:has([data-testid="DeleteIcon"])');
    await deleteBtn.click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    const confirmBtn = confirmDialog.getByRole('button', { name: /Potvrdi|Confirm|Obriši|Delete|Yes/i });
    await confirmBtn.click();

    await expect(confirmDialog).not.toBeVisible();
    expect(deletedId).toBe('rem-3');

    // Verify row is no longer in table
    await expect(page.getByText('Periodično merenje buke')).not.toBeVisible();
  });
});
