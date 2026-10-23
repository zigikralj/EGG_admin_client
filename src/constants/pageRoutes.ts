/**
 * Centralized client navigation route definitions.
 */

export const PAGE_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PROJECT_TRACKER: '/project-tracker',
  PROJECT_TRACKER_PROJECTS: '/project-tracker/projects',
  PROJECT_TRACKER_UPDATES: '/project-tracker/updates',
  PROJECT_TRACKER_INVOICES: '/project-tracker/invoices',
  PROJECT_TRACKER_REMINDERS: '/project-tracker/reminders',
  PROJECT_TRACKER_WASTE: '/project-tracker/waste-disposal',
  PROJECT_TRACKER_STATISTICS: '/project-tracker/statistic',
  DATA_MANAGEMENT_PREFIX: '/data-management',
  PROJECTS: '/data-management/projects',
  CLIENTS: '/data-management/clients',
  PERMITS: '/data-management/permits',
  USERS: '/data-management/users',
  SERVICES: '/data-management/services',
  PROVIDED_SERVICES: '/data-management/provided-services',
  CATEGORIES: '/data-management/categories',
  INVOICES: '/data-management/invoices',
  REMINDERS: '/data-management/reminders',
  ROLES: '/data-management/roles',
  ACTIVITY_LOGS: '/data-management/activity-logs',
  ACTIVITY_ANALYTICS: '/data-management/activity-logs/analytics',
} as const;

export type PageRoute = typeof PAGE_ROUTES[keyof typeof PAGE_ROUTES];
