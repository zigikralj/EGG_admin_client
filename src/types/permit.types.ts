import type { Client } from './client.types';
import type { Reminder } from './reminder.types';

export interface WasteCatalog {
  id: string;
  code: string;
  description: string;
  hazardListMark?: string | null;
  isHazardous: boolean;
  frequent?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WasteCatalogResponse {
  items: WasteCatalog[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PermitWaste {
  id?: string;
  permitId?: string;
  wasteCatalogId: string;
  wasteCatalog?: WasteCatalog;
  createdAt?: string;
  updatedAt?: string;
}

export type PermitType = 'Sakupljanje' | 'Transport' | 'Skladistenje' | 'Tretman' | 'Odlaganje';

export const PERMIT_TYPE_OPTIONS: PermitType[] = [
  'Sakupljanje',
  'Transport',
  'Skladistenje',
  'Tretman',
  'Odlaganje',
];

export interface Permit {
  id: string;
  permitNumber: string;
  indexNumber?: string;
  indexNumbers?: string[];
  permitTypes?: (PermitType | string)[];
  startDate?: string | null;
  endDate?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  client?: Client | null;
  clients?: Client[];
  notes?: string | null;
  reminders?: Reminder[];
  wasteCatalogId?: string | null;
  wasteCatalog?: WasteCatalog | null;
  permitWastes?: PermitWaste[];
  wasteCatalogs?: WasteCatalog[];
  wasteCatalogIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}
