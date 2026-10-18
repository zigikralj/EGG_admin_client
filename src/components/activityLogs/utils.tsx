/* eslint-disable react/only-export-components */
import React from 'react';
import { Chip, alpha } from '@mui/material';
import {
  AccessTimeIcon,
  CheckCircleIcon,
  DashboardIcon,
  AssignmentIcon,
  BusinessIcon,
  AssignmentTurnedInIcon,
  PeopleIcon,
  BuildIcon,
  HandymanIcon,
  CategoryIcon,
  NotificationsActiveIcon,
  ReceiptLongIcon,
  SecurityIcon,
  WebIcon,
  LoginIcon,
  LogoutIcon,
  CloudOffIcon,
} from '../icons';
import type { ActivityLog } from '../../types';
import { API_BASE_PREFIX, API_ROUTES, PAGE_ROUTES } from '../../constants';

export const LIFECYCLE_TYPES = new Set(['LOGIN', 'LOGOUT', 'ONLINE', 'OFFLINE']);

export const MODULE_COLORS = [
  '#2e7d32', // green
  '#0284c7', // sky
  '#7c3aed', // purple
  '#d97706', // amber
  '#059669', // emerald
  '#e11d48', // rose
  '#475569', // slate
];

export const isEmptyUpdateLog = (log: ActivityLog): boolean => {
  if (log.type !== 'UPDATE') return false;
  // If details is not loaded / omitted by the list endpoint (lazy-loaded), do not drop the log
  if (log.details === null || log.details === undefined || log.details === '') return false;
  try {
    const detailsObj = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
    const diff = detailsObj?.diff;
    if (!diff || typeof diff !== 'object') return false;
    const entries = Object.entries(diff).filter(([_, val]: [string, any]) => {
      if (val && typeof val === 'object' && ('old' in val || 'new' in val)) {
        return JSON.stringify(val.old) !== JSON.stringify(val.new);
      }
      return true;
    });
    return entries.length === 0;
  } catch {
    return false;
  }
};

export const getActionChip = (action?: string, type?: string) => {
  const act = (action || type || '').toLowerCase();
  if (act === 'update') {
    return (
      <Chip
        label="UPDATE"
        size="small"
        sx={{
          height: 18,
          fontSize: '0.62rem',
          fontWeight: 700,
          bgcolor: alpha('#f59e0b', 0.15),
          color: '#d97706'
        }}
      />
    );
  }
  if (act === 'create') {
    return (
      <Chip
        label="CREATE"
        size="small"
        sx={{
          height: 18,
          fontSize: '0.62rem',
          fontWeight: 700,
          bgcolor: alpha('#10b981', 0.15),
          color: '#059669'
        }}
      />
    );
  }
  if (act === 'delete') {
    return (
      <Chip
        label="DELETE"
        size="small"
        sx={{
          height: 18,
          fontSize: '0.62rem',
          fontWeight: 700,
          bgcolor: alpha('#ef4444', 0.15),
          color: '#dc2626'
        }}
      />
    );
  }
  return null;
};

export const formatDiffValue = (v: any) => {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

export const formatDuration = (seconds?: number) => {
  if (!seconds && seconds !== 0) return '-';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  const h = Math.floor(m / 60);
  const remainingM = m % 60;
  return `${h}h ${remainingM > 0 ? `${remainingM}m` : ''}`.trim();
};

export const formatDateTime = (date: Date, language: string = 'en') => {
  return date.toLocaleString(language === 'en' ? 'en-US' : 'sr-RS', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatDateOnly = (date: Date, language: string = 'en') => {
  return date.toLocaleDateString(language === 'en' ? 'en-US' : 'sr-RS', {
    month: 'short',
    day: 'numeric'
  });
};

export const formatTimeOnly = (date: Date, language: string = 'en') => {
  return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'sr-RS', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const API_PREFIX_TO_PAGE_ROUTE: Array<{ prefix: string; page: string }> = [
  { prefix: API_ROUTES.PROVIDED_SERVICES.BASE, page: PAGE_ROUTES.PROVIDED_SERVICES },
  { prefix: API_ROUTES.CATEGORIES.BASE, page: PAGE_ROUTES.CATEGORIES },
  { prefix: API_ROUTES.INVOICES.BASE, page: PAGE_ROUTES.INVOICES },
  { prefix: API_ROUTES.PROJECTS.BASE, page: PAGE_ROUTES.PROJECTS },
  { prefix: API_ROUTES.CLIENTS.BASE, page: PAGE_ROUTES.CLIENTS },
  { prefix: API_ROUTES.SERVICES.BASE, page: PAGE_ROUTES.SERVICES },
  { prefix: API_ROUTES.PERMITS.BASE, page: PAGE_ROUTES.PERMITS },
  { prefix: API_ROUTES.USERS.BASE, page: PAGE_ROUTES.USERS },
  { prefix: API_ROUTES.ROLES.BASE, page: PAGE_ROUTES.ROLES },
  { prefix: API_ROUTES.REMINDERS.BASE, page: PAGE_ROUTES.REMINDERS },
  { prefix: API_ROUTES.ACTIVITY_LOGS.BASE, page: PAGE_ROUTES.ACTIVITY_LOGS },
];

export const getCanonicalPagePath = (rawPath?: string): string => {
  if (!rawPath) return '';
  if (rawPath === '/' || rawPath === PAGE_ROUTES.HOME) {
    return PAGE_ROUTES.PROJECT_TRACKER_PROJECTS;
  }
  const apiRootPrefix = `${API_BASE_PREFIX}/`;
  if (rawPath.startsWith(apiRootPrefix)) {
    const clean = rawPath.split('?')[0].toLowerCase();
    for (const mapping of API_PREFIX_TO_PAGE_ROUTE) {
      if (clean === mapping.prefix || clean.startsWith(mapping.prefix + '/')) {
        return mapping.page;
      }
    }
    const resource = rawPath.replace(apiRootPrefix, '').split('?')[0].split('/')[0].toLowerCase();
    return `${PAGE_ROUTES.DATA_MANAGEMENT_PREFIX}/${resource}`;
  }
  return rawPath;
};

export const getPathLabelAndIcon = (
  path?: string,
  type?: string,
  t: (key: any) => string = (k) => k,
  language: string = 'en'
): { label: string; icon: React.ReactElement } => {
  if (!path && type === 'LOGIN') {
    return {
      label: language === 'en' ? 'Login' : language === 'sr-Cyrl' ? 'Пријава' : 'Prijava',
      icon: <LoginIcon fontSize="small" sx={{ color: '#16a34a' }} />,
    };
  }
  if (!path && type === 'LOGOUT') {
    return {
      label: language === 'en' ? 'Logout' : language === 'sr-Cyrl' ? 'Одјава' : 'Odjava',
      icon: <LogoutIcon fontSize="small" sx={{ color: '#dc2626' }} />,
    };
  }
  if (!path && type === 'OFFLINE') {
    return {
      label: language === 'en' ? 'Offline' : language === 'sr-Cyrl' ? 'Неактиван' : 'Neaktivan',
      icon: <CloudOffIcon fontSize="small" sx={{ color: '#94a3b8' }} />,
    };
  }
  if (!path && type === 'ONLINE') {
    return {
      label: language === 'en' ? 'Online' : language === 'sr-Cyrl' ? 'Активан' : 'Aktivan',
      icon: <CheckCircleIcon fontSize="small" sx={{ color: '#16a34a' }} />,
    };
  }

  if (!path) {
    return { label: type || 'General', icon: <WebIcon fontSize="small" /> };
  }

  if (path === '/' || path.startsWith(PAGE_ROUTES.PROJECT_TRACKER)) {
    return { label: t('tabDashboard'), icon: <DashboardIcon fontSize="small" sx={{ color: '#059669' }} /> };
  }
  if (path.includes(PAGE_ROUTES.PROJECTS) || path.includes(API_ROUTES.PROJECTS.BASE) || path.includes('/projects')) {
    return { label: t('tabProjects'), icon: <AssignmentIcon fontSize="small" sx={{ color: '#2563eb' }} /> };
  }
  if (path.includes(PAGE_ROUTES.CLIENTS) || path.includes(API_ROUTES.CLIENTS.BASE) || path.includes('/clients')) {
    return { label: t('tabClients'), icon: <BusinessIcon fontSize="small" sx={{ color: '#7c3aed' }} /> };
  }
  if (path.includes(PAGE_ROUTES.PERMITS) || path.includes(API_ROUTES.PERMITS.BASE) || path.includes('/permits')) {
    return { label: t('tabPermits'), icon: <AssignmentTurnedInIcon fontSize="small" sx={{ color: '#0891b2' }} /> };
  }
  if (path.includes(PAGE_ROUTES.USERS) || path.includes(API_ROUTES.USERS.BASE) || path.includes('/users')) {
    return { label: t('tabUsers'), icon: <PeopleIcon fontSize="small" sx={{ color: '#ea580c' }} /> };
  }
  if (path.includes(PAGE_ROUTES.SERVICES) || path.includes(API_ROUTES.SERVICES.BASE) || path.includes('/services')) {
    return { label: t('tabServices'), icon: <BuildIcon fontSize="small" sx={{ color: '#4f46e5' }} /> };
  }
  if (
    path.includes(PAGE_ROUTES.PROVIDED_SERVICES) ||
    path.includes(API_ROUTES.PROVIDED_SERVICES.BASE) ||
    path.includes('/provided-services')
  ) {
    return { label: t('tabProvidedServices'), icon: <HandymanIcon fontSize="small" sx={{ color: '#0d9488' }} /> };
  }
  if (
    path.includes(PAGE_ROUTES.CATEGORIES) ||
    path.includes(API_ROUTES.CATEGORIES.BASE) ||
    path.includes('/categories')
  ) {
    return { label: t('tabCategories'), icon: <CategoryIcon fontSize="small" sx={{ color: '#ca8a04' }} /> };
  }
  if (path.includes(PAGE_ROUTES.REMINDERS) || path.includes(API_ROUTES.REMINDERS.BASE) || path.includes('/reminders')) {
    return { label: t('tabReminders'), icon: <NotificationsActiveIcon fontSize="small" sx={{ color: '#e11d48' }} /> };
  }
  if (
    path.includes(PAGE_ROUTES.INVOICES) ||
    path.includes(API_ROUTES.INVOICES.BASE) ||
    path.includes('/invoices')
  ) {
    return { label: t('tabInvoices'), icon: <ReceiptLongIcon fontSize="small" sx={{ color: '#16a34a' }} /> };
  }
  if (path.includes(PAGE_ROUTES.ROLES) || path.includes(API_ROUTES.ROLES.BASE) || path.includes('/roles')) {
    return { label: t('roles'), icon: <SecurityIcon fontSize="small" sx={{ color: '#9333ea' }} /> };
  }
  if (path.includes(PAGE_ROUTES.ACTIVITY_LOGS) || path.includes(API_ROUTES.ACTIVITY_LOGS.BASE) || path.includes('/activity-logs')) {
    return { label: t('tabActivityLogs'), icon: <AccessTimeIcon fontSize="small" sx={{ color: '#475569' }} /> };
  }
  if (path.includes(PAGE_ROUTES.LOGIN) || path.includes(API_ROUTES.AUTH.LOGIN) || path.includes('/login')) {
    return {
      label: language === 'en' ? 'Login' : language === 'sr-Cyrl' ? 'Пријава' : 'Prijava',
      icon: <LoginIcon fontSize="small" />,
    };
  }

  return { label: path, icon: <WebIcon fontSize="small" /> };
};
