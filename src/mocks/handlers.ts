import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/projects', () => {
    return HttpResponse.json([
      { 
        id: '1', 
        name: 'Test Project', 
        clientName: 'Test Client',
        type: 'Test Service',
        responsible: 'Test User',
        progress: 50,
        start: '2023-01-01',
        deadline: '2023-12-31',
        done: false,
        status: 'ACTIVE' 
      },
    ]);
  }),
  http.get('/api/services', () => {
    return HttpResponse.json([
      { id: '1', name: 'Test Service', isActive: true },
    ]);
  }),
  http.get('/api/invoices', () => {
    return HttpResponse.json([]);
  }),
  http.get('/api/clients', () => {
    return HttpResponse.json([
      { id: '1', name: 'Mock Client', email: 'client@example.com', pib: '123456789', mb: '98765432' },
    ]);
  }),
  http.get('/api/permits', () => {
    return HttpResponse.json([]);
  }),
  http.get('/api/provided-services', () => HttpResponse.json([])),
  http.get('/api/waste-catalog', () => HttpResponse.json({ items: [], total: 0 })),
  http.get('/api/activity-logs', () => HttpResponse.json([])),
  http.get('/api/activity-logs/analytics', () => HttpResponse.json({
    range: { from: '2026-09-16T00:00:00.000Z', to: '2026-10-16T00:00:00.000Z', granularity: 'day', tz: 'UTC' },
    totals: {
      activeUsers: 3,
      sessions: 12,
      pageViews: 45,
      actions: 18,
      trackedSeconds: 3600,
      avgSessionSeconds: 300,
      avgPagesPerSession: 3.8,
    },
    previousTotals: {
      activeUsers: 2,
      sessions: 8,
      pageViews: 30,
      actions: 10,
      trackedSeconds: 2400,
      avgSessionSeconds: 300,
      avgPagesPerSession: 3.7,
    },
    timeline: [
      { bucket: '2026-10-15', activeUsers: 2, sessions: 6, trackedSeconds: 1800, pageViews: 20, actions: 10 },
      { bucket: '2026-10-16', activeUsers: 3, sessions: 6, trackedSeconds: 1800, pageViews: 25, actions: 8 },
    ],
    pages: [
      { path: '/data-management/projects', views: 25, totalSeconds: 2000, avgSeconds: 80, uniqueUsers: 3, sessions: 8 },
      { path: '/data-management/clients', views: 20, totalSeconds: 1600, avgSeconds: 80, uniqueUsers: 2, sessions: 6 },
    ],
    actions: [
      { model: 'Project', action: 'update', count: 12, uniqueUsers: 3 },
      { model: 'Client', action: 'create', count: 6, uniqueUsers: 2 },
    ],
    users: [
      {
        userId: 'u1',
        userName: 'Admin User',
        role: 'Administrator',
        sessions: 8,
        activeDays: 2,
        trackedSeconds: 2400,
        pageViews: 30,
        actions: 12,
        avgSessionSeconds: 300,
        lastActive: '2026-10-16T12:00:00.000Z',
        pageSeconds: [{ path: '/data-management/projects', seconds: 1800 }],
        pageActions: [{ path: '/api/projects', actions: 8 }, { path: '/api/invoices', actions: 4 }],
      },
    ],
    heatmap: [
      { dow: 0, hour: 10, trackedSeconds: 1200, actions: 5 },
    ],
    sessionLengthBuckets: [
      { bucket: '<1m', count: 2 },
      { bucket: '1-5m', count: 6 },
      { bucket: '5-15m', count: 4 },
      { bucket: '15-30m', count: 0 },
      { bucket: '30-60m', count: 0 },
      { bucket: '60m+', count: 0 },
    ],
    transitions: [
      { from: '/data-management/projects', to: '/data-management/clients', count: 5 },
    ],
    entryPages: [
      { path: '/data-management/projects', count: 8 },
    ],
    exitPages: [
      { path: '/data-management/clients', count: 6 },
    ],
    editedFields: [
      { model: 'Project', field: 'progress', count: 8, uniqueUsers: 2 },
    ],
    quickDeletes: [],
    stickiness: { dau: 2.5, wau: 3, mau: 3 },
    totalRegisteredActiveUsers: 3,
  })),
  http.get('/api/activity-logs/status', () => HttpResponse.json({ hasUpdates: false })),
  http.get('/api/categories', () => HttpResponse.json([])),
  http.get('/api/reminders', () => HttpResponse.json([])),
  http.get('/api/roles', () => HttpResponse.json([])),
  http.get('/api/users', () => HttpResponse.json([])),
  http.post('/api/auth/login', () => HttpResponse.json({ success: true, token: 'mock-token', user: { id: '1', name: 'Test User', role: 'ADMIN' } })),
  http.post('/api/auth/register', () => HttpResponse.json({ success: true })),
];
