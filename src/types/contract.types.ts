import type { Client } from './client.types';
import type { CompanyInfo } from './auth.types';
import type { Reminder } from './reminder.types';

export type ContractStatus = 'Draft' | 'Active' | 'Expiring' | 'Expired' | 'Terminated';

export interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  clientId: string;
  clientName: string;
  projectId?: string | null;
  projectName?: string | null;
  responsibleId?: string | null;
  responsible?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: ContractStatus;
  content?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;

  client?: Client;
  project?: { id: string; name: string };
  responsibleUser?: { id: string; name: string; email?: string | null };
  reminders?: Reminder[];
}

export interface ContractTemplate {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContractPlaceholderContext {
  ekos?: Partial<CompanyInfo> | null;
  client?: Partial<Client> | null;
  contract?: Partial<Contract> | null;
}
