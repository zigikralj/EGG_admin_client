/**
 * Centralized keys for localStorage, sessionStorage, CustomEvents, and SystemSettings.
 */

export const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  AUTH_TOKEN: 'auth_token',
  AUTH_SESSION_EXPIRES_AT: 'auth_session_expires_at',
  APP_LANGUAGE: 'app_language',
  THEME_MODE: 'theme_mode',
  ACTIVITY_SESSION_ID: 'activity_session_id',
  ACTIVITY_SESSION_LAST_ACTIVE: 'activity_session_last_active',
  ACTIVITY_LOGIN_LOGGED: 'activity_login_logged',
  USER_PREFERENCES: (userId: string) => `ekos_user_preferences_${userId}`,
  DRAFT_NOTES: (projectId: string) => `ekos_draft_notes_${projectId}`,
} as const;

export const APP_EVENTS = {
  AUTH_EXPIRED: 'auth:expired',
  ROLES_CHANGED: 'roles:changed',
  ACTIVITY_LOGGING_CHANGED: 'activity-logging:changed',
  NOTIFICATIONS_REFRESH: 'notifications:refresh',
  WASTE_CATALOG_UPDATED: 'ekos:waste-catalog-updated',
} as const;

export const SYSTEM_SETTING_KEYS = {
  WASTE_DISPOSAL_SERVICE_ID: 'waste_disposal_service_id',
  ACTIVITY_LOGGING_ENABLED: 'activity_logging_enabled',
  ACTIVITY_LOG_RETENTION_DAYS: 'activity_log_retention_days',
} as const;

export const TABLE_PREFERENCE_KEYS = {
  PROJECTS: 'projects',
  CLIENTS: 'clients',
  PERMITS: 'permits',
  SERVICES: 'services',
  PROVIDED_SERVICES: 'providedServices',
  CATEGORIES: 'categories',
  INVOICES: 'invoices',
  REMINDERS: 'reminders',
  ROLES: 'roles',
  USERS: 'users',
  ACTIVITY_LOGS: 'activityLogs',
  TRACKER_PROJECTS: 'tracker_projects',
  TRACKER_REMINDERS: 'tracker_reminders',
  TRACKER_INVOICES: 'tracker_invoices',
  TRACKER_WASTE: 'tracker_waste',
} as const;

export type TablePreferenceKey = typeof TABLE_PREFERENCE_KEYS[keyof typeof TABLE_PREFERENCE_KEYS];
