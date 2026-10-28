import type { Client } from './client.types';
import type { Project } from './project.types';
import type { Invoice } from './invoice.types';

export type CustomFieldType = 'text' | 'number' | 'list' | 'datetime' | 'date' | 'client';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  unit?: string;
  options?: string[];
  linkedList?: string;
  permitTypeFilter?: string;
  required?: boolean;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  group: string;
  frequency: number;
  description?: string | null;
  customDataModel?: CustomFieldDefinition[] | null;
  createdAt?: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProvidedService {
  id: string;
  serviceId: string;
  clientId: string;
  projectId?: string | null;
  invoiceId?: string | null;
  status: string;
  location?: string | null;
  scheduledDate?: string | null;
  completionDate?: string | null;
  notes?: string | null;
  customData?: Record<string, any> | null;
  service?: Service;
  client?: Client;
  project?: Project | null;
  invoice?: Invoice | null;
  createdAt?: string;
  updatedAt?: string;
}

export type DashboardSubTab =
  | 'projects'
  | 'updates'
  | 'reminders'
  | 'invoices'
  | 'waste-disposal'
  | 'waste-management'
  | 'statistic'
  | 'statistic-waste-management'
  | 'statistic-waste-disposal';

export type ProvidedServicesSubTab = 'summary' | 'statistics';

export const typeGroup: Record<string, string> = {
  // English codes
  'waste-disposal': 'grp-waste',
  'waste-management': 'grp-waste',
  'special-waste-streams': 'grp-waste',
  'permits': 'grp-legal',
  'environmental-impact': 'grp-legal',
  'wastewater-testing': 'grp-testing',
  'air-emissions': 'grp-testing',
  'noise-emissions': 'grp-testing',
  'soil-testing': 'grp-testing',
  'waste-testing': 'grp-testing',
  'adr-adviser': 'grp-advisory',
  'chemical-adviser': 'grp-advisory',
  'iso': 'grp-standards',
  'fsc': 'grp-standards',
  'enplus': 'grp-standards',
  'ddd': 'grp-standards',
  'haccp': 'grp-standards',

  // Serbian fallback keys
  'zbrinjavanje': 'grp-waste',
  'odlaganje': 'grp-waste',
  'odlaganje-otpada': 'grp-waste',
  'upravljanje': 'grp-waste',
  'posebni-tokovi': 'grp-waste',
  'dozvole': 'grp-legal',
  'procena-uticaja': 'grp-legal',
  'ispitivanje-otpadnih-voda': 'grp-testing',
  'emisija-vazduh': 'grp-testing',
  'emisija-buka': 'grp-testing',
  'ispitivanje-zemljista': 'grp-testing',
  'ispitivanje-otpada': 'grp-testing',
  'savetnik-adr': 'grp-advisory',
  'savetnik-hemikalije': 'grp-advisory',
};
