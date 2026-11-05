/**
 * Domain constants for client entity statuses, roles, types, and settings.
 * All selectable and stored statuses are canonical lowercase slugs.
 */

export const USER_ROLES = {
  ADMINISTRATOR: 'Administrator',
  MANAGER: 'Manager',
  USER: 'User',
  ACCOUNTANT: 'Accountant',
} as const;

export type UserRoleType = typeof USER_ROLES[keyof typeof USER_ROLES];

export const USER_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  BLOCKED: 'blocked',
  REJECTED: 'rejected',
} as const;

export type UserStatusType = typeof USER_STATUSES[keyof typeof USER_STATUSES];

export const REMINDER_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  DRAFT: 'draft',
} as const;

export type ReminderStatusType = typeof REMINDER_STATUSES[keyof typeof REMINDER_STATUSES];

export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  UNPAID: 'unpaid', // Sentinel for filter queries
} as const;

export type InvoiceStatusType = typeof INVOICE_STATUSES[keyof typeof INVOICE_STATUSES];

export const INVOICE_TYPES = {
  STANDARD: 'standard',
  ADVANCE: 'advance',
  FINAL: 'final',
  PARTIAL: 'partial',
} as const;

export type InvoiceTypeType = typeof INVOICE_TYPES[keyof typeof INVOICE_TYPES];

export const PROVIDED_SERVICE_STATUSES = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ProvidedServiceStatusType = typeof PROVIDED_SERVICE_STATUSES[keyof typeof PROVIDED_SERVICE_STATUSES];

export const PERMIT_TYPES = {
  SAKUPLJANJE: 'Sakupljanje',
  TRANSPORT: 'Transport',
  SKLADISTENJE: 'Skladistenje',
  TRETMAN: 'Tretman',
  ODLAGANJE: 'Odlaganje',
} as const;

export type PermitTypeType = typeof PERMIT_TYPES[keyof typeof PERMIT_TYPES];

export const PERMIT_TYPE_LIST: PermitTypeType[] = [
  PERMIT_TYPES.SAKUPLJANJE,
  PERMIT_TYPES.TRANSPORT,
  PERMIT_TYPES.SKLADISTENJE,
  PERMIT_TYPES.TRETMAN,
  PERMIT_TYPES.ODLAGANJE,
];

export const CUSTOM_FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  LIST: 'list',
  DATETIME: 'datetime',
  DATE: 'date',
  CLIENT: 'client',
} as const;

export type CustomFieldTypeType = typeof CUSTOM_FIELD_TYPES[keyof typeof CUSTOM_FIELD_TYPES];

export const LINKED_LIST_TYPES = {
  NONE: 'none',
  CLIENTS: 'clients',
  INDEX_NUMBER: 'index_number',
  PERMIT_TYPE: 'permit_type',
  USERS: 'users',
  CATEGORY: 'category',
} as const;

export type LinkedListTypeType = typeof LINKED_LIST_TYPES[keyof typeof LINKED_LIST_TYPES];

export const CURRENCIES = {
  RSD: 'RSD',
  EUR: '€',
} as const;

export type CurrencyType = typeof CURRENCIES[keyof typeof CURRENCIES];

export const COMMON_FILTERS = {
  ALL: 'all',
  SORT_ASC: 'asc',
  SORT_DESC: 'desc',
} as const;

export const SUPPORTED_LANGUAGES = {
  SR_LATN: 'sr-Latn',
  SR_CYRL: 'sr-Cyrl',
  EN: 'en',
} as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[keyof typeof SUPPORTED_LANGUAGES];

export const INTL_LOCALE_MAP: Record<string, string> = {
  [SUPPORTED_LANGUAGES.SR_LATN]: 'sr-Latn-RS',
  [SUPPORTED_LANGUAGES.SR_CYRL]: 'sr-Cyrl-RS',
  [SUPPORTED_LANGUAGES.EN]: 'en-US',
};

export const isReminderCompleted = (status?: string | null): boolean => {
  if (!status) return false;
  return status.trim().toLowerCase() === REMINDER_STATUSES.COMPLETED;
};

export const isInvoicePaid = (status?: string | null): boolean => {
  if (!status) return false;
  return status.trim().toLowerCase() === INVOICE_STATUSES.PAID;
};

export const isProvidedServiceCompleted = (status?: string | null): boolean => {
  if (!status) return false;
  return status.trim().toLowerCase() === PROVIDED_SERVICE_STATUSES.COMPLETED;
};

export const isProvidedServiceCancelled = (status?: string | null): boolean => {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === PROVIDED_SERVICE_STATUSES.CANCELLED || s === 'canceled';
};

export const isInvoiceCancelled = (status?: string | null): boolean => {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === INVOICE_STATUSES.CANCELLED || s === 'canceled';
};
