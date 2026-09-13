import React, { useEffect, useState } from 'react';
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
import { DashboardIcon, FolderIcon, BusinessIcon, AssignmentTurnedInIcon, PeopleIcon, BuildIcon, HandymanIcon, CategoryIcon, NotificationsActiveIcon, ReceiptLongIcon } from '../icons';

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
    isUser,
    isAccountant,
    canManageClients,
    canManagePermits,
    canManageUsers,
    canManageServices,
    canManageInvoices,
    canManageProvidedServices,
    pendingUsersCount,
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
  const currentApp = location.pathname.startsWith('/data-management') ? 'data-management' : 'project-tracker';

  useEffect(() => {
    if (currentApp === 'data-management' && (isUser || isAccountant || !(role === 'Administrator' || role === 'Manager'))) {
      navigate('/project-tracker');
    }
  }, [currentApp, role, isUser, isAccountant, navigate]);

  useEffect(() => {
    if (isUser && !location.pathname.startsWith('/project-tracker')) {
      navigate('/project-tracker');
    } else if (isAccountant && !location.pathname.startsWith('/project-tracker')) {
      navigate('/project-tracker');
    }
  }, [isUser, isAccountant, location.pathname, navigate]);

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

  const navItems = [
    { path: '/project-tracker', label: t('tabDashboard'), icon: <DashboardIcon />, count: 0, show: true },
    { path: '/data-management/projects', label: t('tabProjects'), icon: <FolderIcon />, count: stats.active, show: !isUser && !isAccountant },
    { path: '/data-management/clients', label: t('tabClients'), icon: <BusinessIcon />, count: stats.clientsCount, show: canManageClients },
    { path: '/data-management/permits', label: t('tabPermits'), icon: <AssignmentTurnedInIcon />, count: 0, show: canManagePermits },
    {
      path: '/data-management/users',
      label: t('tabUsers'),
      icon: <PeopleIcon />,
      count: canManageUsers && pendingUsersCount > 0 ? pendingUsersCount : stats.usersCount,
      color: canManageUsers && pendingUsersCount > 0 ? ('warning' as const) : undefined,
      show: canManageUsers,
    },
    { path: '/data-management/services', label: t('tabServices'), icon: <BuildIcon />, count: 0, show: canManageServices },
    { path: '/data-management/provided-services', label: t('tabProvidedServices'), icon: <HandymanIcon />, count: 0, show: canManageProvidedServices },
    { path: '/data-management/categories', label: t('tabCategories'), icon: <CategoryIcon />, count: stats.categoriesCount || 0, show: canManageServices },
    { path: '/data-management/reminders', label: t('tabReminders'), icon: <NotificationsActiveIcon />, count: stats.monitor, show: !isUser && !isAccountant, color: 'error' as const },
    { path: '/data-management/invoices', label: t('tabInvoices'), icon: <ReceiptLongIcon />, count: stats.invoicesCount || 0, show: !isAccountant && (!isUser && canManageInvoices) },
  ];

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
