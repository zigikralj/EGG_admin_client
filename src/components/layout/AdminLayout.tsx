import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { UserProfileDialog } from './UserProfileDialog';
import { SettingsDialog } from './SettingsDialog';
import { CompanyInfoModal } from '../company/CompanyInfoModal';
import { DashboardIcon, FolderIcon, BusinessIcon, AssignmentTurnedInIcon, PeopleIcon, BuildIcon, HandymanIcon, CategoryIcon, NotificationsActiveIcon, ReceiptLongIcon, SecurityIcon, AccessTimeIcon } from '../icons';
import { useProjectModal } from '../../context/ProjectModalContext';
import { useWasteDisposalServiceId } from '../../queries';
import { PAGE_ROUTES } from '../../constants';

interface Props {
  userPreferences?: Record<string, any>;
  onPreferenceChange?: (key: string, value: any) => void;
  onOpenProject?: (projectId: string) => void;
  children: React.ReactNode;
}

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

  const navItems = useMemo(() => [
    { path: PAGE_ROUTES.PROJECT_TRACKER, label: t('tabDashboard'), icon: <DashboardIcon />, show: true },
    { path: PAGE_ROUTES.PROJECTS, label: t('tabProjects'), icon: <FolderIcon />, show: hasPermission('projects', 'view') },
    { path: PAGE_ROUTES.CLIENTS, label: t('tabClients'), icon: <BusinessIcon />, show: hasPermission('clients', 'view') },
    { path: PAGE_ROUTES.PERMITS, label: t('tabPermits'), icon: <AssignmentTurnedInIcon />, show: hasPermission('permits', 'view') },
    { path: PAGE_ROUTES.USERS, label: t('tabUsers'), icon: <PeopleIcon />, show: hasPermission('users', 'view') },
    { path: PAGE_ROUTES.SERVICES, label: t('tabServices'), icon: <BuildIcon />, show: hasPermission('services', 'view') },
    { path: PAGE_ROUTES.PROVIDED_SERVICES, label: t('tabProvidedServices'), icon: <HandymanIcon />, show: hasPermission('providedServices', 'view') },
    { path: PAGE_ROUTES.CATEGORIES, label: t('tabCategories'), icon: <CategoryIcon />, show: hasPermission('categories', 'view') },
    { path: PAGE_ROUTES.REMINDERS, label: t('tabReminders'), icon: <NotificationsActiveIcon />, show: hasPermission('reminders', 'view') },
    { path: PAGE_ROUTES.INVOICES, label: t('tabInvoices'), icon: <ReceiptLongIcon />, show: hasPermission('invoices', 'view') },
    { path: PAGE_ROUTES.ROLES, label: t('tabRoles'), icon: <SecurityIcon />, show: hasPermission('roles', 'view') },
    { path: PAGE_ROUTES.ACTIVITY_LOGS, label: t('tabActivityLogs'), icon: <AccessTimeIcon />, show: hasPermission('activityLogs', 'view') },
  ], [t, hasPermission]);

  useEffect(() => {
    if (isRolesLoading || isSettingsLoading) return;

    const parts = location.pathname.split('/').filter(Boolean);
    const appName = parts[0];
    const page = parts[1];

    if (!appName) return;

    const canAccessTracker = hasPermission('apps', 'project-tracker');
    const canAccessDataMgmt = hasPermission('apps', 'data-management');

    const canAccessApp = appName === 'data-management' ? canAccessDataMgmt : canAccessTracker;

    if (!canAccessApp) {
      if (appName === 'data-management' && canAccessTracker) {
        navigate(PAGE_ROUTES.PROJECT_TRACKER, { replace: true });
        return;
      }
      if (appName === 'project-tracker' && canAccessDataMgmt) {
        const firstAllowed = navItems.find((item) => item.show && item.path.startsWith(`${PAGE_ROUTES.DATA_MANAGEMENT_PREFIX}/`));
        navigate(firstAllowed ? firstAllowed.path : PAGE_ROUTES.PROJECTS, { replace: true });
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
        if (page === 'updates') resource = 'tracker_updates';
        if (page === 'reminders') resource = 'tracker_reminders';
        if (page === 'invoices') resource = 'tracker_invoices';
        if (page === 'statistic') resource = 'statistics';
        if (page === 'waste-disposal' || page === 'statistic-waste-disposal' || page === 'statistic-waste-management') resource = 'wasteDisposal';
      }

      let hasAccess = hasPermission(resource, 'view');
      if (hasAccess && (page === 'statistic-waste-disposal' || page === 'statistic-waste-management')) {
        if (!wasteDisposalServiceId) {
          hasAccess = false;
        }
      }
      if (hasAccess && (page === 'waste-disposal' || page === 'waste-management')) {
        if (!wasteDisposalServiceId && !isRealAdmin) {
          hasAccess = false;
        }
      }

      if (!hasAccess) {
        if (appName === 'data-management') {
          const firstAllowed = navItems.find((item) => item.show && item.path.startsWith(`${PAGE_ROUTES.DATA_MANAGEMENT_PREFIX}/`) && item.path !== location.pathname);
          if (firstAllowed) {
            navigate(firstAllowed.path, { replace: true });
            return;
          }
          if (canAccessTracker) {
            navigate(PAGE_ROUTES.PROJECT_TRACKER, { replace: true });
            return;
          }
        } else if (appName === 'project-tracker') {
          const canAccessWasteDisposal = hasPermission('wasteDisposal', 'view') && (Boolean(wasteDisposalServiceId) || Boolean(isRealAdmin));
          const trackerSubTabs = [
            { path: PAGE_ROUTES.PROJECT_TRACKER_PROJECTS, allowed: hasPermission('tracker_projects', 'view') },
            { path: PAGE_ROUTES.PROJECT_TRACKER_UPDATES, allowed: hasPermission('tracker_updates', 'view') },
            { path: PAGE_ROUTES.PROJECT_TRACKER_INVOICES, allowed: hasPermission('tracker_invoices', 'view') },
            { path: PAGE_ROUTES.PROJECT_TRACKER_REMINDERS, allowed: hasPermission('tracker_reminders', 'view') },
            { path: PAGE_ROUTES.PROJECT_TRACKER_WASTE, allowed: canAccessWasteDisposal },
            { path: PAGE_ROUTES.PROJECT_TRACKER_STATISTICS, allowed: hasPermission('statistics', 'view') },
          ];
          const firstAllowedSub = trackerSubTabs.find((sub) => sub.allowed && sub.path !== location.pathname);
          if (firstAllowedSub) {
            navigate(firstAllowedSub.path, { replace: true });
            return;
          }
          if (canAccessDataMgmt) {
            const firstAllowed = navItems.find((item) => item.show && item.path.startsWith(`${PAGE_ROUTES.DATA_MANAGEMENT_PREFIX}/`));
            navigate(firstAllowed ? firstAllowed.path : PAGE_ROUTES.PROJECTS, { replace: true });
            return;
          }
        }
      }
    }
  }, [role, isRolesLoading, isSettingsLoading, wasteDisposalServiceId, isRealAdmin, hasPermission, location.pathname, navigate, navItems]);

  useEffect(() => {
    // Scroll window and main content
    const resetScroll = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
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
