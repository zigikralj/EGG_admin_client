import type { Client } from './client.types';
import type { Project } from './project.types';

export type InvoiceCurrency = 'RSD' | '€' | string;
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled' | string;
export type InvoiceType = 'Standard' | 'Advance' | 'Final' | 'Partial' | string;

export interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: InvoiceCurrency;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType?: InvoiceType | null;
  parentInvoiceId?: string | null;
  parentInvoice?: Invoice | null;
  childInvoices?: Invoice[];
  dateCreated?: string | null;
  dueDate?: string | null;
  paymentDate?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  status: InvoiceStatus;
  notes?: string | null;
  totalAmount?: number | null;
  currency?: InvoiceCurrency | null;
  items?: InvoiceItem[];
  client?: Client | null;
  project?: Project | null;
  providedServices?: { id: string; scheduledDate?: string | null; status?: string | null }[];
  isNewStaged?: boolean;
  isLinkedExisting?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
