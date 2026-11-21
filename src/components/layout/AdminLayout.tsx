import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { UserProfileDialog } from './UserProfileDialog';
import { SettingsDialog } from './SettingsDialog';
import { CompanyInfoModal } from '../company/CompanyInfoModal';
import {
  DashboardIcon,
  FolderIcon,
  BusinessIcon,
  AssignmentTurnedInIcon,
  PeopleIcon,
  BuildIcon,
  HandymanIcon,
  CategoryIcon,
  NotificationsActiveIcon,
  ReceiptLongIcon,
  SecurityIcon,
  AccessTimeIcon,
  SettingsIcon,
} from '../icons';
import { useProjectModal } from '../../context/ProjectModalContext';
import { useWasteDisposalServiceId } from '../../queries';
import {
  APP_REGISTRY,
  APP_SECTIONS,
  LEGACY_ROUTE_REDIRECTS,
  PAGE_ROUTES,
  resolveRouteAccess,
  type AppNavIconKey,
  type AppNavItem,
  type AppRegistryEntry,
} from '../../constants';

interface Props {
  userPreferences?: Record<string, any>;
  onPreferenceChange?: (key: string, value: any) => void;
  onOpenProject?: (projectId: string) => void;
  children: React.ReactNode;
}

const renderNavIcon = (iconKey: AppNavIconKey): React.ReactNode => {
  switch (iconKey) {
    case 'folder': return <FolderIcon />;
    case 'business': return <BusinessIcon />;
    case 'assignment': return <AssignmentTurnedInIcon />;
    case 'people': return <PeopleIcon />;
    case 'build': return <BuildIcon />;
    case 'handyman': return <HandymanIcon />;
    case 'category': return <CategoryIcon />;
    case 'notifications': return <NotificationsActiveIcon />;
    case 'receipt': return <ReceiptLongIcon />;
    case 'security': return <SecurityIcon />;
    case 'accessTime': return <AccessTimeIcon />;
    case 'settings': return <SettingsIcon />;
    case 'dashboard':
    default:
      return <DashboardIcon />;
  }
};

export const AdminLayout: React.FC<Props> = ({
  userPreferences,
  onPreferenceChange,
  onOpenProject,
  children,
}) => {
  const { openProjectById } = useProjectModal();
  const effectiveOpenProject = onOpenProject || openProjectById;
  const { t } = useLanguage();
  const {
    role,
    isRolesLoading,
    hasPermission,
    isRealAdmin,
    logout,
  } = useAuth();
  const { wasteDisposalServiceId, isLoading: isSettingsLoading } = useWasteDisposalServiceId();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isStatisticExpanded, setIsStatisticExpanded] = useState(true);
  const [isProvidedServicesExpanded, setIsProvidedServicesExpanded] = useState(true);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);
  const mainContentRef = useRef<HTMLElement | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const canAccessNavItem = useCallback(
    (item: AppNavItem): boolean => {
      const hasPrimary = hasPermission(item.resourceId, item.action);
      const hasAlt = item.altPermission
        ? hasPermission(item.altPermission.resourceId, item.altPermission.action)
        : false;
      if (!hasPrimary && !hasAlt) return false;

      if (
        item.path === PAGE_ROUTES.PROJECT_TRACKER_WASTE_STATISTICS ||
        item.path === '/project-tracker/statistic-waste-management'
      ) {
        return Boolean(wasteDisposalServiceId);
      }

      if (
        item.path === PAGE_ROUTES.PROJECT_TRACKER_WASTE ||
        item.path === '/project-tracker/waste-management'
      ) {
        return (
          Boolean(wasteDisposalServiceId) ||
          hasPermission('systemSettings', 'edit') ||
          Boolean(isRealAdmin)
        );
      }

      return true;
    },
    [hasPermission, wasteDisposalServiceId, isRealAdmin]
  );

  const navItems = useMemo(() => {
    const registryItems = APP_REGISTRY.filter(
      (app) => app.id === APP_SECTIONS.DATA_MANAGEMENT || app.id === APP_SECTIONS.SYSTEM
    ).flatMap((app) =>
      app.navItems
        .filter((item) => !item.hiddenInSidebar)
        .map((item) => ({
          path: item.path,
          label: t(item.labelKey as any),
          icon: renderNavIcon(item.iconKey),
          show: canAccessNavItem(item),
        }))
    );

    return [
      { path: PAGE_ROUTES.PROJECT_TRACKER, label: t('tabDashboard'), icon: <DashboardIcon />, show: true },
      ...registryItems,
    ];
  }, [t, canAccessNavItem]);

  const findFirstAllowedPathForApp = useCallback(
    (appEntry: AppRegistryEntry, excludePath?: string): string | null => {
      const candidate = appEntry.navItems.find(
        (item) =>
          !item.hiddenInSidebar &&
          item.path !== excludePath &&
          canAccessNavItem(item)
      );
      return candidate ? candidate.path : null;
    },
    [canAccessNavItem]
  );

  useEffect(() => {
    if (isRolesLoading || isSettingsLoading) return;

    // Allow legacy URLs (/data-management/roles, /data-management/activity-logs*)
    // to pass through to AppRoutes' <Navigate replace /> redirects
    if (LEGACY_ROUTE_REDIRECTS[location.pathname]) return;

    const resolved = resolveRouteAccess(location.pathname);
    if (!resolved) return;

    const { app, navItem } = resolved;

    const redirectToOtherAccessibleApp = () => {
      for (const candidateApp of APP_REGISTRY) {
        if (candidateApp.id === app.id) continue;
        if (!hasPermission('apps', candidateApp.id)) continue;
        const firstAllowed = findFirstAllowedPathForApp(candidateApp);
        navigate(firstAllowed || candidateApp.defaultPath, { replace: true });
        return true;
      }
      return false;
    };

    if (!hasPermission('apps', app.id)) {
      redirectToOtherAccessibleApp();
      return;
    }

    if (navItem && !canAccessNavItem(navItem)) {
      const firstAllowedInSameApp = findFirstAllowedPathForApp(app, location.pathname);
      if (firstAllowedInSameApp) {
        navigate(firstAllowedInSameApp, { replace: true });
        return;
      }
      redirectToOtherAccessibleApp();
    }
  }, [
    role,
    isRolesLoading,
    isSettingsLoading,
    hasPermission,
    canAccessNavItem,
    findFirstAllowedPathForApp,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    resetScroll();
    const timeoutId = setTimeout(resetScroll, 100);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onPreferenceChange={onPreferenceChange}
        handleOpenProfile={() => setIsProfileOpen(true)}
        handleOpenPreferences={() => setIsPreferencesOpen(true)}
        handleLogoutClick={logout}
        setIsCompanyInfoOpen={setIsCompanyInfoOpen}
        onOpenProject={effectiveOpenProject}
      />

      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isStatisticExpanded={isStatisticExpanded}
        setIsStatisticExpanded={setIsStatisticExpanded}
        isProvidedServicesExpanded={isProvidedServicesExpanded}
        setIsProvidedServicesExpanded={setIsProvidedServicesExpanded}
        navItems={navItems}
        onPreferenceChange={onPreferenceChange}
      />

      {/* MAIN CONTENT AREA */}
      <Box
        component="main"
        id="main-content"
        ref={mainContentRef}
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: '100%',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          pb: { xs: 8, md: 4 },
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* MODALS AND DIALOGS */}
      <UserProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <SettingsDialog
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        userPreferences={userPreferences}
        onPreferenceChange={onPreferenceChange}
      />

      <CompanyInfoModal
        open={isCompanyInfoOpen}
        onClose={() => setIsCompanyInfoOpen(false)}
      />
    </Box>
  );
};
