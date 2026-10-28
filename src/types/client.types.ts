import type { Permit } from './permit.types';
import type { Project } from './project.types';
import type { Invoice } from './invoice.types';

export interface ClientExtraData {
  id: string;
  clientId: string;
  permitId?: string | null;
  permit?: Permit | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  permitId?: string | null;
  permit?: Permit | null;
  permits?: Permit[];
  extraData?: ClientExtraData | null;
  projects?: Project[];
  invoices?: Invoice[];
  createdAt?: string;
}
