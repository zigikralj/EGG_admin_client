import { test, expect } from '@playwright/test';

test.describe('Project Notes & TipTap Editor', () => {
  const mockProject = {
    id: '1',
    name: 'Eko Analiza Vazduha',
    clientId: '1',
    clientName: 'Fabrika Cementa',
    type: 'Merenje emisije',
    responsible: 'Test User',
    progress: 50,
    start: '2025-01-10',
    deadline: '2025-12-31',
    done: false,
    status: 'ACTIVE',
    notesPreview: 'Initial project notes preview.',
  };

  const mockNote = {
    id: 'note-1',
    projectId: '1',
    content: '<p>Initial project notes content from TipTap.</p>',
    version: 1,
    notesPreview: 'Initial project notes preview.',
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: '2025-01-10T10:00:00.000Z',
  };

  const mockHistory = {
    total: 2,
    versions: [
      {
        version: 2,
        kind: 'D',
        createdAt: '2025-01-12T12:00:00.000Z',
        author: { id: 1, name: 'Test User' },
        byteSize: 120,
      },
      {
        version: 1,
        kind: 'S',
        createdAt: '2025-01-10T10:00:00.000Z',
        author: { id: 1, name: 'Test User' },
        byteSize: 450,
      },
    ],
  };

  const mockDiff = {
    v1: 1,
    v2: 2,
    diff: [
      { op: 'equal', text: 'Initial project notes content ' },
      { op: 'insert', text: 'with updated information ' },
      { op: 'equal', text: 'from TipTap.' },
    ],
  };

  test.beforeEach(async ({ page }) => {
    await page.route(/\/api\/projects(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockProject]),
      });
    });

    await page.route('**/api/projects/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockProject,
          notes: mockNote.content,
        }),
      });
    });

    await page.route('**/api/projects/1/note', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockNote),
        });
      } else if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockNote,
            content: body.content,
            version: 2,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/projects/1/note/history*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockHistory),
      });
    });

    await page.route('**/api/projects/1/note/diff*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDiff),
      });
    });

    await page.route('**/api/projects/1/note/restore/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockNote,
          version: 3,
        }),
      });
    });

    await page.route(/\/api\/clients(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: '1', name: 'Fabrika Cementa' }]),
      });
    });

    await page.route(/\/api\/services(\?.*)?$/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route(/\/api\/categories(\?.*)?$/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route(/\/api\/provided-services(\?.*)?$/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route(/\/api\/reminders(\?.*)?$/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route(/\/api\/invoices(\?.*)?$/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route(/\/api\/users(\?.*)?$/, async (route) => {
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

    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/activity-logs/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
  });

  test('loads project notes in TipTap editor when viewing project details', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Eko Analiza Vazduha')).toBeVisible();

    // Open project details modal by clicking project title
    await page.getByText('Eko Analiza Vazduha').first().click();

    // Verify modal dialog opened
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify TipTap editor rendered with initial note content
    const tiptapContent = dialog.locator('.tiptap.ProseMirror');
    await expect(tiptapContent).toBeVisible();
    await expect(tiptapContent).toContainText('Initial project notes content from TipTap.');

    // Verify TipTap toolbar buttons are rendered
    await expect(dialog.getByRole('button', { name: /Podebljano|Bold/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Kurziv|Italic/i })).toBeVisible();
  });
});
