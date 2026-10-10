import { test, expect } from '@playwright/test';

test.describe('Projects Management', () => {
  let projectsData = [
    {
      id: '1',
      name: 'Test Project 1',
      clientId: '1',
      clientName: 'Test Client',
      type: 'SRV-01',
      responsible: 'Test User',
      progress: 50,
      start: '2025-01-01',
      deadline: '2025-12-31',
      done: false,
      status: 'ACTIVE',
    },
  ];

  test.beforeEach(async ({ page }) => {
    projectsData = [
      {
        id: '1',
        name: 'Test Project 1',
        clientId: '1',
        clientName: 'Test Client',
        type: 'SRV-01',
        responsible: 'Test User',
        progress: 50,
        start: '2025-01-01',
        deadline: '2025-12-31',
        done: false,
        status: 'ACTIVE',
      },
    ];

    await page.route('**/api/projects', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(projectsData),
        });
      } else if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        const created = {
          id: '2',
          ...payload,
        };
        projectsData.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/projects/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      const idMatch = url.match(/\/api\/projects\/([^/?#]+)/);
      const id = idMatch ? idMatch[1] : null;

      if (method === 'PUT' && id) {
        const payload = route.request().postDataJSON();
        const idx = projectsData.findIndex((p) => p.id === id);
        if (idx !== -1) {
          projectsData[idx] = { ...projectsData[idx], ...payload };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(projectsData[idx] || payload),
        });
      } else if (method === 'DELETE' && id) {
        projectsData = projectsData.filter((p) => p.id !== id);
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
          { id: '1', name: 'Test Client', city: 'Beograd' },
        ]),
      });
    });

    await page.route('**/api/services', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Merenje buke', code: 'SRV-01' },
        ]),
      });
    });

    await page.route('**/api/categories', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/provided-services', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Test User', email: 'test@example.com', role: 'Admin' }]),
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

    await page.route('**/api/invoices', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/activity-logs/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
  });

  test('should display the projects list', async ({ page }) => {
    await page.goto('/data-management/projects');

    // Verify table headers and row content
    await expect(page.locator('td', { hasText: 'Test Project 1' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Test Client' })).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    let postReceived = false;
    await page.route('**/api/projects', async (route) => {
      if (route.request().method() === 'POST') {
        postReceived = true;
        const payload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: '2', ...payload }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(projectsData),
        });
      }
    });

    await page.goto('/data-management/projects');
    await expect(page.locator('td', { hasText: 'Test Project 1' })).toBeVisible();

    // Click "New Project" button
    const newProjectBtn = page.getByRole('button', { name: /Novi projekat|New Project/i });
    await expect(newProjectBtn).toBeVisible();
    await newProjectBtn.click();

    // Modal dialog is open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill project name
    const nameInput = dialog.getByLabel(/Naziv projekta|Project Name/i);
    await nameInput.fill('Ekološki Projekat 2025');

    // Select client by typing into autocomplete and clicking matching option
    const clientSelect = dialog.getByRole('combobox', { name: /Klijent/i });
    await clientSelect.fill('Test Client');
    await page.getByRole('option', { name: /Test Client/i }).click();

    // Select service by typing into autocomplete and clicking matching option
    const serviceSelect = dialog.getByRole('combobox', { name: /Usluga/i });
    await serviceSelect.fill('Merenje');
    await page.getByRole('option', { name: /Merenje buke/i }).click();

    // Save project
    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    // Wait for modal to close
    await expect(dialog).not.toBeVisible();
    expect(postReceived).toBe(true);
  });

  test('should edit existing project details', async ({ page }) => {
    let putReceived = false;
    await page.route('**/api/projects/1', async (route) => {
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

    await page.goto('/data-management/projects');
    await expect(page.locator('td', { hasText: 'Test Project 1' })).toBeVisible();

    // Click edit button in the row
    const editBtn = page.getByRole('row', { hasText: 'Test Project 1' }).getByRole('button', { name: /Izmeni|Edit/i });
    await editBtn.click();

    // Modal opens with current name
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByLabel(/Naziv projekta|Project Name/i);
    await expect(nameInput).toHaveValue('Test Project 1');
    await nameInput.fill('Ažurirani Test Projekat');

    // Save
    const saveBtn = dialog.getByRole('button', { name: /Sačuvaj|Save/i });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(putReceived).toBe(true);
  });

  test('should delete a project after confirmation', async ({ page }) => {
    let deleteReceived = false;
    await page.route('**/api/projects/1', async (route) => {
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

    await page.goto('/data-management/projects');
    await expect(page.locator('td', { hasText: 'Test Project 1' })).toBeVisible();

    // Click delete button on the row
    const deleteBtn = page.getByRole('row', { hasText: 'Test Project 1' }).getByRole('button', { name: /Obriši|Delete/i });
    await deleteBtn.click();

    // ConfirmDialog opens
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    // Click confirm delete button inside dialog
    const confirmBtn = confirmDialog.getByRole('button', { name: /Obriši|Delete/i });
    await confirmBtn.click();

    await expect(confirmDialog).not.toBeVisible();
    expect(deleteReceived).toBe(true);
  });
});
