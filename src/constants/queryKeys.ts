/**
 * Centralized React Query key factory to eliminate string literals in queries & cache invalidations.
 */

export const QUERY_KEYS = {
  PROJECTS: {
    ALL: ['projects'] as const,
    SUMMARY: ['projects', 'summary'] as const,
    DETAILS: (id: string) => ['projects', 'details', id] as const,
    NOTE: (id: string) => ['projects', 'note', id] as const,
    NOTE_REVISIONS: (id: string) => ['projects', 'note', 'revisions', id] as const,
    UPDATES: (params?: unknown) => ['projects', 'updates', params] as const,
    UPDATES_DIFF: (id: string, from?: string, to?: string) => ['projects', 'updates-diff', id, from, to] as const,
  },
  CLIENTS: {
    ALL: ['clients'] as const,
    SUMMARY: ['clients', 'summary'] as const,
    DETAILS: (id: string) => ['clients', 'details', id] as const,
  },
  PERMITS: {
    ALL: ['permits'] as const,
    SUMMARY: ['permits', 'summary'] as const,
    DETAILS: (id: string) => ['permits', 'details', id] as const,
    WASTE_CATALOG: ['waste-catalog'] as const,
  },
  SERVICES: {
    ALL: ['services'] as const,
    DETAILS: (id: string) => ['services', 'details', id] as const,
    CATEGORIES: ['categories'] as const,
  },
  PROVIDED_SERVICES: {
    ALL: ['provided-services'] as const,
    DETAILS: (id: string) => ['provided-services', 'details', id] as const,
  },
  INVOICES: {
    ALL: ['invoices'] as const,
    SUMMARY: ['invoices', 'summary'] as const,
    DETAILS: (id: string) => ['invoices', 'details', id] as const,
  },
  REMINDERS: {
    ALL: ['reminders'] as const,
    DETAILS: (id: string) => ['reminders', 'details', id] as const,
  },
  USERS: {
    ALL: ['users'] as const,
    SUMMARY: ['users', 'summary'] as const,
    DETAILS: (id: string) => ['users', 'details', id] as const,
    ROLES: ['roles'] as const,
  },
  ACTIVITY_LOGS: {
    ALL: ['activity-logs'] as const,
    SUMMARY: (from?: string) => ['activity-logs', 'summary', from ?? 'all'] as const,
    USER: (userId: string, from?: string) => ['activity-logs', 'user', userId, from] as const,
    MONTHLY: (userId?: string, fromYM?: string, toYM?: string) => ['activity-logs', 'monthly-stats', userId, fromYM, toYM] as const,
    ANALYTICS: (params?: unknown) => ['activity-logs', 'analytics', params] as const,
    STATUS: ['activity-logs-status'] as const,
  },
  PREFERENCES: {
    ALL: ['preferences'] as const,
    BY_USER: (userId?: string) => ['preferences', userId] as const,
  },
  SYSTEM_SETTINGS: {
    ALL: ['system-settings'] as const,
  },
  COMPANY_INFO: {
    ALL: ['company-info'] as const,
  },
  NOTIFICATIONS: {
    ALL: ['notifications'] as const,
  },
  HISTORY: {
    ALL: ['history'] as const,
    TIMELINE: (entityType: string, id: string) => ['history', entityType, id] as const,
    DIFF: (entityType: string, id: string, from: number, to: number) => ['history-diff', entityType, id, from, to] as const,
    DIFF_DATE: (entityType: string, id: string, dateFrom?: string, dateTo?: string) => ['history-diff-date', entityType, id, dateFrom, dateTo] as const,
    VERSION: (entityType: string, id: string, version: number) => ['history-version', entityType, id, version] as const,
  },
} as const;
