/**
 * Centralized API route definitions for the client.
 * Strongly typed route constants and parameterized URL helpers.
 */

export const API_BASE_PREFIX = '/api';

export const API_ROUTES = {
  AUTH: {
    BASE: '/api/auth',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
  },
  ROLES: {
    BASE: '/api/roles',
    BY_NAME: (name: string) => `/api/roles/${encodeURIComponent(name)}`,
  },
  USERS: {
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${encodeURIComponent(id)}`,
    APPROVE: (id: string) => `/api/users/${encodeURIComponent(id)}/approve`,
    REJECT: (id: string) => `/api/users/${encodeURIComponent(id)}/reject`,
    FORCE_LOGOUT: (id: string) => `/api/users/${encodeURIComponent(id)}/force-logout`,
    STATUS: (id: string) => `/api/users/${encodeURIComponent(id)}/status`,
  },
  PROJECTS: {
    BASE: '/api/projects',
    STATS: '/api/projects/stats',
    BY_ID: (id: string) => `/api/projects/${encodeURIComponent(id)}`,
    TOGGLE_DONE: (id: string) => `/api/projects/${encodeURIComponent(id)}/toggle-done`,
  },
  CLIENTS: {
    BASE: '/api/clients',
    BY_ID: (id: string) => `/api/clients/${encodeURIComponent(id)}`,
  },
  SERVICES: {
    BASE: '/api/services',
    BY_ID: (id: string) => `/api/services/${encodeURIComponent(id)}`,
  },
  CATEGORIES: {
    BASE: '/api/categories',
    BY_ID: (id: string) => `/api/categories/${encodeURIComponent(id)}`,
  },
  PROVIDED_SERVICES: {
    BASE: '/api/provided-services',
    BY_ID: (id: string) => `/api/provided-services/${encodeURIComponent(id)}`,
  },
  REMINDERS: {
    BASE: '/api/reminders',
    BY_ID: (id: string) => `/api/reminders/${encodeURIComponent(id)}`,
    STATUS: (id: string) => `/api/reminders/${encodeURIComponent(id)}/status`,
  },
  INVOICES: {
    BASE: '/api/invoices',
    BY_ID: (id: string) => `/api/invoices/${encodeURIComponent(id)}`,
    STATUS: (id: string) => `/api/invoices/${encodeURIComponent(id)}/status`,
  },
  PERMITS: {
    BASE: '/api/permits',
    BY_ID: (id: string) => `/api/permits/${encodeURIComponent(id)}`,
  },
  WASTE_CATALOG: {
    BASE: '/api/waste-catalog',
    FREQUENT: (id: string) => `/api/waste-catalog/${encodeURIComponent(id)}/frequent`,
  },
  ACTIVITY_LOGS: {
    BASE: '/api/activity-logs',
    SUMMARY: '/api/activity-logs/summary',
    MONTHLY_STATS: '/api/activity-logs/monthly-stats',
    ANALYTICS: '/api/activity-logs/analytics',
    STATUS: '/api/activity-logs/status',
    CLEAR_ALL: '/api/activity-logs/clear-all',
    BULK_DELETE: '/api/activity-logs/bulk-delete',
    SESSION: (sessionId: string) => `/api/activity-logs/session/${encodeURIComponent(sessionId)}`,
    BY_ID: (id: string) => `/api/activity-logs/${encodeURIComponent(id)}`,
  },
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    READ: (id: string) => `/api/notifications/${encodeURIComponent(id)}/read`,
    CLEAR_ALL: '/api/notifications/clear-all',
    BY_ID: (id: string) => `/api/notifications/${encodeURIComponent(id)}`,
  },
  PREFERENCES: {
    BASE: '/api/preferences',
    BY_KEY: (key: string) => `/api/preferences/${encodeURIComponent(key)}`,
  },
  COMPANY_INFO: {
    BASE: '/api/company-info',
  },
  HISTORY: {
    BASE: '/api/history',
    TIMELINE: (entityType: string, id: string) => `/api/history/${encodeURIComponent(entityType)}/${encodeURIComponent(id)}`,
    DIFF: (entityType: string, id: string, from: number, to: number) => `/api/history/${encodeURIComponent(entityType)}/${encodeURIComponent(id)}/diff?from=${from}&to=${to}`,
    VERSION: (entityType: string, id: string, version: number) => `/api/history/${encodeURIComponent(entityType)}/${encodeURIComponent(id)}/versions/${version}`,
    RESTORE: (entityType: string, id: string, version: number) => `/api/history/${encodeURIComponent(entityType)}/${encodeURIComponent(id)}/restore/${version}`,
    CHANGESET: (id: string) => `/api/history/changesets/${encodeURIComponent(id)}`,
  },
  IMPORT: {
    BASE: '/api/import',
  },
} as const;
