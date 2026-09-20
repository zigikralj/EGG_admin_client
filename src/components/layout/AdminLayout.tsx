import React, { useEffect, useMemo, useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import type { ProjectStats } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { UserProfileDialog } from './UserProfileDialog';
import { SettingsDialog } from './SettingsDialog';
import { CompanyInfoModal } from '../dialogs/CompanyInfoModal';
import { DashboardIcon, FolderIcon, BusinessIcon, AssignmentTurnedInIcon, PeopleIcon, BuildIcon, HandymanIcon, CategoryIcon, NotificationsActiveIcon, ReceiptLongIcon, SecurityIcon } from '../icons';

interface Props {
  stats: ProjectStats;
  userPreferences?: Record<string, any>;
  onPreferenceChange?: (key: string, value: any) => void;
  onOpenProject?: (projectId: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<Props> = ({
  stats,
  userPreferences,
  onPreferenceChange,
  onOpenProject,
  children,
}) => {
  const { t } = useLanguage();
  const {
    role,
    isAdmin,
    isRolesLoading,
    pendingUsersCount,
    hasPermission,
    logout,
  } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isStatisticExpanded, setIsStatisticExpanded] = useState(true);
  const [isProvidedServicesExpanded, setIsProvidedServicesExpanded] = useState(true);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useMemo(() => [
    { path: '/project-tracker', label: t('tabDashboard'), icon: <DashboardIcon />, count: 0, show: true },
    { path: '/data-management/projects', label: t('tabProjects'), icon: <FolderIcon />, count: stats.active, show: hasPermission('projects', 'view') },
    { path: '/data-management/clients', label: t('tabClients'), icon: <BusinessIcon />, count: stats.clientsCount, show: hasPermission('clients', 'view') },
    { path: '/data-management/permits', label: t('tabPermits'), icon: <AssignmentTurnedInIcon />, count: 0, show: hasPermission('permits', 'view') },
    {
      path: '/data-management/users',
      label: t('tabUsers'),
      icon: <PeopleIcon />,
      count: hasPermission('users', 'view') && pendingUsersCount > 0 ? pendingUsersCount : stats.usersCount,
      color: hasPermission('users', 'view') && pendingUsersCount > 0 ? ('warning' as const) : undefined,
      show: hasPermission('users', 'view'),
    },
    { path: '/data-management/services', label: t('tabServices'), icon: <BuildIcon />, count: 0, show: hasPermission('services', 'view') },
    { path: '/data-management/provided-services', label: t('tabProvidedServices'), icon: <HandymanIcon />, count: 0, show: hasPermission('providedServices', 'view') },
    { path: '/data-management/categories', label: t('tabCategories'), icon: <CategoryIcon />, count: stats.categoriesCount || 0, show: hasPermission('categories', 'view') },
    { path: '/data-management/reminders', label: t('tabReminders'), icon: <NotificationsActiveIcon />, count: stats.monitor, show: hasPermission('reminders', 'view'), color: 'error' as const },
    { path: '/data-management/invoices', label: t('tabInvoices'), icon: <ReceiptLongIcon />, count: stats.invoicesCount || 0, show: hasPermission('invoices', 'view') },
    { path: '/data-management/roles', label: 'Roles', icon: <SecurityIcon />, count: 0, show: hasPermission('roles', 'view') },
  ], [t, stats, pendingUsersCount, hasPermission]);

  useEffect(() => {
    if (isAdmin || isRolesLoading) return;

    const parts = location.pathname.split('/').filter(Boolean);
    const appName = parts[0];
    const page = parts[1];

    if (!appName) return;

    const canAccessTracker = hasPermission('apps', 'project-tracker');
    const canAccessDataMgmt = hasPermission('apps', 'data-management');

    const canAccessApp = appName === 'data-management' ? canAccessDataMgmt : canAccessTracker;

    if (!canAccessApp) {
      if (appName === 'data-management' && canAccessTracker) {
        navigate('/project-tracker', { replace: true });
        return;
      }
      if (appName === 'project-tracker' && canAccessDataMgmt) {
        const firstAllowed = navItems.find((item) => item.show && item.path.startsWith('/data-management/'));
        navigate(firstAllowed ? firstAllowed.path : '/data-management/projects', { replace: true });
        return;
      }
      // If neither app is accessible, do not navigate in an infinite loop
      return;
    }

    if (page) {
      let resource = page.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      
      // Map project-tracker pages to their respective role resource IDs
      if (appName === 'project-tracker') {
        if (page === 'projects') resource = 'tracker_projects';
        if (page === 'reminders') resource = 'tracker_reminders';
        if (page === 'invoices') resource = 'tracker_invoices';
        if (page === 'statistic') resource = 'statistics';
        if (page === 'waste-disposal' || page === 'statistic-waste-disposal' || page === 'statistic-waste-management') resource = 'wasteDisposal';
      }

      if (!hasPermission(resource, 'view')) {
        if (appName === 'data-management') {
          const firstAllowed = navItems.find((item) => item.show && item.path.startsWith('/data-management/') && item.path !== location.pathname);
          if (firstAllowed) {
            navigate(firstAllowed.path, { replace: true });
            return;
          }
          if (canAccessTracker) {
            navigate('/project-tracker', { replace: true });
            return;
          }
        } else if (appName === 'project-tracker') {
          const trackerSubTabs = [
            { path: '/project-tracker/projects', resource: 'tracker_projects' },
            { path: '/project-tracker/invoices', resource: 'tracker_invoices' },
            { path: '/project-tracker/reminders', resource: 'tracker_reminders' },
            { path: '/project-tracker/waste-disposal', resource: 'wasteDisposal' },
            { path: '/project-tracker/statistic', resource: 'statistics' },
          ];
          const firstAllowedSub = trackerSubTabs.find((sub) => hasPermission(sub.resource, 'view') && sub.path !== location.pathname);
          if (firstAllowedSub) {
            navigate(firstAllowedSub.path, { replace: true });
            return;
          }
          if (canAccessDataMgmt) {
            const firstAllowed = navItems.find((item) => item.show && item.path.startsWith('/data-management/'));
            navigate(firstAllowed ? firstAllowed.path : '/data-management/projects', { replace: true });
            return;
          }
        }
      }
    }
  }, [role, isAdmin, isRolesLoading, hasPermission, location.pathname, navigate, navItems]);

  useEffect(() => {
    // Scroll window and main content
    const resetScroll = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const mainEl = document.getElementById('main-content');
      if (mainEl) {
        mainEl.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    
    // Call immediately
    resetScroll();
    
    // Call again after a short delay to account for React.lazy / Suspense rendering new content
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
        onOpenProject={onOpenProject}
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
