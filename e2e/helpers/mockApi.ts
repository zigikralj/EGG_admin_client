import type { Page } from '@playwright/test';

export interface MockApiOptions {
  user?: Record<string, any>;
  skipAuthMe?: boolean;
  users?: any[];
  roles?: any[];
  preferences?: Record<string, any>;
  stats?: Record<string, any>;
  notifications?: any[];
  reminders?: any[];
  services?: any[];
  categories?: any[];
  clients?: any[];
  projects?: any[];
  invoices?: any[];
  permits?: any[];
  providedServices?: any[];
  activityLogs?: any[];
  wasteCatalog?: any[];
  systemSettings?: Record<string, any>;
}

/**
 * Standard default mocks for application background and common queries.
 * Registers a catch-all `/api/**` fallback first (lowest priority in Playwright's LIFO matching)
 * so unmocked endpoints never leak to localhost:5000 and trigger 401 auto-logout.
 */
export async function mockCommonApi(page: Page, options: MockApiOptions = {}) {
  const defaultUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Administrator',
    isApproved: true,
    status: 'APPROVED',
    isSystemAdmin: true,
    roleLevel: 100,
    permissions: {},
    roleEntity: {
      id: 1,
      name: 'Administrator',
      isSystemAdmin: true,
      level: 100,
      permissions: {},
    },
  };

  const resolvedUser = options.user
    ? {
        ...defaultUser,
        ...options.user,
        roleEntity: {
          ...defaultUser.roleEntity,
          ...(options.user.roleEntity || {}),
        },
      }
    : defaultUser;

  const defaultRoles = [
    {
      id: 1,
      name: 'Administrator',
      isSystemAdmin: true,
      level: 100,
      permissions: {},
    },
  ];

  // 1. Lowest-priority catch-all for any unmocked /api/** requests
  await page.route('**/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  // 2. Messaging SSE stream and REST endpoints
  await page.route('**/api/messaging/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/api/messaging/stream')) {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: {
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
        body: 'retry: 60000\nevent: CONNECTED\ndata: {"onlineUserIds":[]}\n\n',
      });
      return;
    }

    if (url.includes('/api/messaging/unread-summary')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUnread: 0,
          byConversation: {},
          byProject: {},
          dndUntil: null,
        }),
      });
      return;
    }

    if (url.includes('/api/messaging/conversations/context/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'conv-ctx-1',
          type: 'CONTEXTUAL',
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
          participants: [],
        }),
      });
      return;
    }

    if (url.includes('/api/messaging/conversations')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // 3. Permissions, Auth, Roles, Preferences & Settings
  await page.route('**/api/permissions/catalog', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ apps: [] }),
    });
  });

  if (!options.skipAuthMe) {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(resolvedUser),
      });
    });
  }

  await page.route('**/api/roles**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.roles || defaultRoles),
    });
  });

  await page.route('**/api/preferences**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.preferences || {}),
    });
  });

  await page.route('**/api/system-settings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.systemSettings || {}),
    });
  });

  await page.route('**/api/company-info**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  // 4. Stats & Notifications
  await page.route('**/api/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.stats || {}),
    });
  });

  await page.route('**/api/projects/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.stats || {}),
    });
  });

  await page.route('**/api/projects/statistics**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.stats || {}),
    });
  });

  await page.route('**/api/notifications**', async (route) => {
    const list = options.notifications || [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        notifications: list,
        unreadCount: 0,
        pendingUsersCount: 0,
      }),
    });
  });

  // 5. Activity Logs defaults
  await page.route('**/api/activity-logs**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/api/activity-logs/status')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ enabled: true, retentionDays: 90 }),
      });
      return;
    }

    if (url.includes('/api/activity-logs/summary')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kpiStats: {
            totalUsers: 0,
            activeToday: 0,
            totalSessions: 0,
            totalTrackedSeconds: 0,
            topModule: null,
            topModulePercent: 0,
          },
          userSummaries: [],
        }),
      });
      return;
    }

    if (url.includes('/api/activity-logs/monthly-stats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.activityLogs || []),
    });
  });

  // 6. Waste Catalog default
  await page.route('**/api/waste-catalog**', async (route) => {
    const catalog = options.wasteCatalog || [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: catalog,
        total: catalog.length,
        page: 1,
        hasMore: false,
      }),
    });
  });

  // 7. Collection defaults (supporting optional query strings)
  await page.route(/\/api\/users(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.users || [resolvedUser]),
    });
  });

  await page.route(/\/api\/projects(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.projects || []),
    });
  });

  await page.route(/\/api\/clients(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.clients || []),
    });
  });

  await page.route(/\/api\/services(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.services || []),
    });
  });

  await page.route(/\/api\/categories(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.categories || []),
    });
  });

  await page.route(/\/api\/permits(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.permits || []),
    });
  });

  await page.route(/\/api\/reminders(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.reminders || []),
    });
  });

  await page.route(/\/api\/invoices(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.invoices || []),
    });
  });

  await page.route(/\/api\/provided-services(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.providedServices || []),
    });
  });
}
