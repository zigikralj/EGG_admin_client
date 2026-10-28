import type { Permit } from './permit.types';

export interface Reminder {
  id: string;
  title?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  responsibleId?: string | null;
  responsible?: string | null;
  status: string;
  notes?: string | null;
  dueDate?: string | null;
  permitId?: string | null;
  permitNumber?: string | null;
  permit?: Permit | null;
  isNewStaged?: boolean;
  isLinkedExisting?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
