export interface SaveResult {
  success: boolean;
  id?: string;
  data?: any;
  error?: string;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TableViewProps {
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  rowsPerPageOptions?: number[];
  onRowsPerPageOptionsChange?: (options: number[]) => void;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  sortState?: SortState;
  onSortChange?: (sort: SortState) => void;
  onRefresh?: () => Promise<void> | void;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
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
  fetchPermits: () => Promise<void>;
  fetchWasteCatalog: () => Promise<void>;
  fetchStats: () => Promise<void>;
}

export type ActiveTab =
  | 'dashboard'
  | 'projects'
  | 'clients'
  | 'permits'
  | 'users'
  | 'services'
  | 'providedServices'
  | 'categories'
  | 'reminders'
  | 'invoices'
  | 'roles'
  | 'activityLogs';

export type AppSection = 'project-tracker' | 'data-management';
