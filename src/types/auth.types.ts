export type UserRole = string;

export interface Role {
  name: string;
  description?: string;
  isSystemAdmin: boolean;
  permissions: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  _count?: { users: number };
}

export interface User {
  id: string;
  name: string;
  email?: string | null;
  role?: UserRole;
  roleEntity?: Role | null;
  permissions?: Record<string, any>;
  isSystemAdmin?: boolean;
  activityLoggingEnabled?: boolean;
  phone?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  isApproved?: boolean;
  status?: string;
  createdAt?: string;
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
