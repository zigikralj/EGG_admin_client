import type { Reminder } from './reminder.types';
import type { Invoice } from './invoice.types';

export interface Project {
  id: string;
  name: string;
  clientId?: string | null;
  clientName: string;
  client?: { id: string; name: string; city?: string | null } | null;
  responsible: string | null;
  responsibleId?: string | null;
  responsibleUser?: { id: string; name: string; email?: string | null; gender?: string | null } | null;
  type: string;
  serviceName?: string | null;
  service?: { id?: string; code?: string; name: string } | null;
  start: string | null;
  deadline: string | null;
  progress: number;
  done: boolean;
  notes?: string | null;
  notesPreview?: string | null;
  reminders?: Reminder[];
  invoices?: Invoice[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectUpdateSummary {
  id: string;
  name: string;
  clientId?: string | null;
  clientName?: string | null;
  responsible?: string | null;
  responsibleId?: string | null;
  type: string;
  start?: string | null;
  deadline?: string | null;
  progress: number;
  done: boolean;
  notesPreview?: string | null;
  client?: { id: string; name: string; city?: string | null } | null;
  lastModifiedAt: string;
  lastModifiedBy: string;
  revisionCount: number;
  changedFields: string[];
  noteCharDelta: number;
  addedRemindersCount: number;
  updatedRemindersCount: number;
  addedInvoicesCount: number;
  updatedInvoicesCount: number;
}

export interface ProjectUpdatesDiffResult {
  projectId: string;
  projectName: string;
  dateFrom: string;
  dateTo: string;
  fieldDiffs: Record<string, { old: any; new: any }>;
  notesDiff?: {
    vFrom: number;
    vTo: number;
    fromCreatedAt?: string;
    toCreatedAt?: string;
    oldContent?: string;
    newContent?: string;
    diff: Array<{ op: 'insert' | 'delete' | 'equal'; text: string }>;
  } | null;
  reminders: Array<{
    id: string;
    title: string;
    dueDate?: string | null;
    status: string;
    isNew: boolean;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    total?: number | null;
    currency?: string | null;
    isNew: boolean;
  }>;
}
