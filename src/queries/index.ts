/**
 * Unified Queries Barrel Export
 * Domain queries have been modularized into separate files:
 * - queryUtils.ts: common query and mutation helpers (useAuthHeaders, pagination, generic mutations)
 * - preferences.queries.ts: table & user preference queries
 * - projects.queries.ts: project list, details, notes, updates, mutations
 * - clients.queries.ts: client queries & mutations
 * - users.queries.ts: user & role queries & mutations
 * - services.queries.ts: service & category queries & mutations
 * - providedServices.queries.ts: provided services queries & mutations
 * - reminders.queries.ts: reminder queries & mutations
 * - invoices.queries.ts: invoice queries & mutations
 * - permits.queries.ts: permit & waste catalog queries & mutations
 * - activity.queries.ts: activity log & analytics queries & mutations
 * - history.queries.ts: entity history, timeline, diff, and restore queries
 * - autocomplete.queries.ts: autocomplete suggestions
 */

export * from './queryUtils';
export * from './preferences.queries';
export * from './projects.queries';
export * from './clients.queries';
export * from './users.queries';
export * from './services.queries';
export * from './providedServices.queries';
export * from './reminders.queries';
export * from './invoices.queries';
export * from './permits.queries';
export * from './activity.queries';
export * from './history.queries';
export * from './autocomplete.queries';
