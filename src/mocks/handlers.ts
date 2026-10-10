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
  http.get('/api/activity-logs/status', () => HttpResponse.json({ hasUpdates: false })),
  http.get('/api/categories', () => HttpResponse.json([])),
  http.get('/api/reminders', () => HttpResponse.json([])),
  http.get('/api/roles', () => HttpResponse.json([])),
  http.get('/api/users', () => HttpResponse.json([])),
  http.post('/api/auth/login', () => HttpResponse.json({ success: true, token: 'mock-token', user: { id: '1', name: 'Test User', role: 'ADMIN' } })),
  http.post('/api/auth/register', () => HttpResponse.json({ success: true })),
];
