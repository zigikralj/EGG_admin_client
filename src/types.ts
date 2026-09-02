export interface Project {
  id: string;
  name: string;
  clientId?: string | null;
  clientName: string;
  responsible: string | null;
  type: string;
  start: string | null;
  deadline: string | null;
  progress: number;
  done: boolean;
  nextSample: string | null;
  notes?: string | null;
  reminders?: Reminder[];
  invoices?: Invoice[];
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
  projects?: Project[];
  invoices?: Invoice[];
  createdAt?: string;
}

export type UserRole = 'Administrator' | 'Manager' | 'User' | 'Accountant';

export interface User {
  id: string;
  name: string;
  email?: string | null;
  role: UserRole | string;
  phone?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  isApproved?: boolean;
  status?: string;
  isOnline?: boolean;
  lastActiveAt?: string | null;
  createdAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

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
  createdAt?: string;
  updatedAt?: string;
}

export type CustomFieldType = 'text' | 'number' | 'list' | 'datetime' | 'date';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  unit?: string;
  options?: string[];
  required?: boolean;
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

export interface ProjectStats {
  active: number;
  done: number;
  stale: number;
  monitor: number;
  overdue?: number;
  clientsCount: number;
  usersCount: number;
  servicesCount: number;
  categoriesCount?: number;
  invoicesCount?: number;
  providedServicesCount?: number;
}

export type ActiveTab = 'dashboard' | 'projects' | 'clients' | 'users' | 'services' | 'providedServices' | 'categories' | 'reminders' | 'invoices';

export type DashboardSubTab = 'projects' | 'reminders' | 'invoices' | 'waste-disposal' | 'waste-management' | 'statistic';

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

export interface SaveResult {
  success: boolean;
  id?: string;
  data?: any;
  error?: string;
}

export interface CompanyInfo {
  id?: string;
  name: string;
  legalName: string;
  registrationNumber: string;
  municipality: string;
  city: string;
  streetAddress: string;
  postalCode: string;
  postOffice: string;
  email: string;
  taxId: string;
  activityCode: string;
  bankAccounts: string[];
}


export interface AppFetchers {
  fetchProjects: () => Promise<void>;
  fetchClients: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchProvidedServices: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchReminders: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchStats: () => Promise<void>;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'MENTION' | string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  projectId?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    clientName?: string;
  } | null;
}

