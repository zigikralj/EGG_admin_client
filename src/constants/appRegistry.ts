import { PAGE_ROUTES } from './pageRoutes';
import { APP_SECTIONS, RESOURCES, PERMISSION_ACTIONS } from './permissions';

export type AppId =
  | typeof APP_SECTIONS.PROJECT_TRACKER
  | typeof APP_SECTIONS.DATA_MANAGEMENT
  | typeof APP_SECTIONS.SYSTEM;

export type AppNavIconKey =
  | 'dashboard'
  | 'folder'
  | 'business'
  | 'assignment'
  | 'people'
  | 'build'
  | 'handyman'
  | 'category'
  | 'notifications'
  | 'receipt'
  | 'security'
  | 'accessTime'
  | 'settings';

export interface AppNavItem {
  path: string;
  labelKey: string;
  iconKey: AppNavIconKey;
  resourceId: string;
  action: string;
  altPermission?: { resourceId: string; action: string };
  hiddenInSidebar?: boolean;
}

export interface AppRegistryEntry {
  id: AppId;
  prefix: string;
  defaultPath: string;
  labelKey: string;
  descKey: string;
  iconKey: 'dashboard' | 'storage' | 'settings';
  navItems: AppNavItem[];
}

export const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
  [PAGE_ROUTES.LEGACY_ROLES]: PAGE_ROUTES.ROLES,
  [PAGE_ROUTES.LEGACY_ACTIVITY_LOGS]: PAGE_ROUTES.ACTIVITY_LOGS,
  [PAGE_ROUTES.LEGACY_ACTIVITY_ANALYTICS]: PAGE_ROUTES.ACTIVITY_ANALYTICS,
};

export const APP_REGISTRY: AppRegistryEntry[] = [
  {
    id: APP_SECTIONS.PROJECT_TRACKER,
    prefix: PAGE_ROUTES.PROJECT_TRACKER,
    defaultPath: PAGE_ROUTES.PROJECT_TRACKER_PROJECTS,
    labelKey: 'appProjectTracker',
    descKey: 'appProjectTrackerDesc',
    iconKey: 'dashboard',
    navItems: [
      {
        path: PAGE_ROUTES.PROJECT_TRACKER_PROJECTS,
        labelKey: 'subTabProjects',
        iconKey: 'folder',
        resourceId: RESOURCES.TRACKER_PROJECTS,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.PROJECT_TRACKER_UPDATES,
        labelKey: 'subTabUpdates',
        iconKey: 'dashboard',
        resourceId: RESOURCES.TRACKER_UPDATES,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.PROJECT_TRACKER_REMINDERS,
        labelKey: 'subTabReminders',
        iconKey: 'notifications',
        resourceId: RESOURCES.TRACKER_REMINDERS,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.PROJECT_TRACKER_INVOICES,
        labelKey: 'tabInvoices',
        iconKey: 'receipt',
        resourceId: RESOURCES.TRACKER_INVOICES,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.PROJECT_TRACKER_WASTE,
        labelKey: 'subTabWasteDisposal',
        iconKey: 'build',
        resourceId: RESOURCES.WASTE_DISPOSAL,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: '/project-tracker/waste-management',
        labelKey: 'subTabWasteDisposal',
        iconKey: 'build',
        resourceId: RESOURCES.WASTE_DISPOSAL,
        action: PERMISSION_ACTIONS.VIEW,
        hiddenInSidebar: true,
      },
      {
        path: PAGE_ROUTES.PROJECT_TRACKER_STATISTICS,
        labelKey: 'subTabStatistic',
        iconKey: 'dashboard',
        resourceId: RESOURCES.STATISTICS,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.PROJECT_TRACKER_WASTE_STATISTICS,
        labelKey: 'subTabWasteDisposal',
        iconKey: 'build',
        resourceId: RESOURCES.WASTE_DISPOSAL,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: '/project-tracker/statistic-waste-management',
        labelKey: 'subTabWasteDisposal',
        iconKey: 'build',
        resourceId: RESOURCES.WASTE_DISPOSAL,
        action: PERMISSION_ACTIONS.VIEW,
        hiddenInSidebar: true,
      },
    ],
  },
  {
    id: APP_SECTIONS.DATA_MANAGEMENT,
    prefix: PAGE_ROUTES.DATA_MANAGEMENT_PREFIX,
    defaultPath: PAGE_ROUTES.PROJECTS,
    labelKey: 'appDataManagement',
    descKey: 'appDataManagementDesc',
    iconKey: 'storage',
    navItems: [
      {
        path: PAGE_ROUTES.PROJECTS,
        labelKey: 'tabProjects',
        iconKey: 'folder',
        resourceId: RESOURCES.PROJECTS,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.CLIENTS,
        labelKey: 'tabClients',
        iconKey: 'business',
        resourceId: RESOURCES.CLIENTS,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.PERMITS,
        labelKey: 'tabPermits',
        iconKey: 'assignment',
        resourceId: RESOURCES.PERMITS,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.USERS,
        labelKey: 'tabUsers',
        iconKey: 'people',
        resourceId: RESOURCES.USERS,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.SERVICES,
        labelKey: 'tabServices',
        iconKey: 'build',
        resourceId: RESOURCES.SERVICES,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.PROVIDED_SERVICES,
        labelKey: 'tabProvidedServices',
        iconKey: 'handyman',
        resourceId: RESOURCES.PROVIDED_SERVICES,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.CATEGORIES,
        labelKey: 'tabCategories',
        iconKey: 'category',
        resourceId: RESOURCES.CATEGORIES,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.REMINDERS,
        labelKey: 'tabReminders',
        iconKey: 'notifications',
        resourceId: RESOURCES.REMINDERS,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.INVOICES,
        labelKey: 'tabInvoices',
        iconKey: 'receipt',
        resourceId: RESOURCES.INVOICES,
        action: PERMISSION_ACTIONS.VIEW,
      },
    ],
  },
  {
    id: APP_SECTIONS.SYSTEM,
    prefix: PAGE_ROUTES.SYSTEM_PREFIX,
    defaultPath: PAGE_ROUTES.ROLES,
    labelKey: 'appSystem',
    descKey: 'appSystemDesc',
    iconKey: 'settings',
    navItems: [
      {
        path: PAGE_ROUTES.ROLES,
        labelKey: 'tabRoles',
        iconKey: 'security',
        resourceId: RESOURCES.ROLES,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.ACTIVITY_LOGS,
        labelKey: 'tabActivityLogs',
        iconKey: 'accessTime',
        resourceId: RESOURCES.ACTIVITY_LOGS,
        action: PERMISSION_ACTIONS.VIEW,
      },
      {
        path: PAGE_ROUTES.ACTIVITY_ANALYTICS,
        labelKey: 'activityAnalytics',
        iconKey: 'accessTime',
        resourceId: RESOURCES.ACTIVITY_ANALYTICS,
        action: PERMISSION_ACTIONS.VIEW,
        hiddenInSidebar: true,
      },
      {
        path: PAGE_ROUTES.SYSTEM_SETTINGS,
        labelKey: 'tabSystemSettings',
        iconKey: 'settings',
        resourceId: RESOURCES.SYSTEM_SETTINGS,
        action: PERMISSION_ACTIONS.VIEW,
        altPermission: {
          resourceId: RESOURCES.ACTIVITY_LOGS,
          action: PERMISSION_ACTIONS.CONFIGURE,
        },
      },
    ],
  },
];

export function getAppFromPathname(pathname: string): AppRegistryEntry {
  const matched = APP_REGISTRY.find(
    (app) => pathname === app.prefix || pathname.startsWith(`${app.prefix}/`)
  );
  return matched || APP_REGISTRY[0];
}

export function resolveRouteAccess(
  pathname: string
): { app: AppRegistryEntry; navItem?: AppNavItem } | null {
  const app = APP_REGISTRY.find(
    (a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`)
  );
  if (!app) return null;

  // Match longest path first so nested paths like /system/activity-logs/analytics
  // resolve before /system/activity-logs
  const sortedItems = [...app.navItems].sort((a, b) => b.path.length - a.path.length);
  const navItem = sortedItems.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
  );

  return { app, navItem };
}
