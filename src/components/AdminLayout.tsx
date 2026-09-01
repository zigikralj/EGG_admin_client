import React, { useEffect, useState } from 'react';
import { Box, Toolbar } from '@mui/material';

import type { ActiveTab, DashboardSubTab, ProvidedServicesSubTab, ProjectStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import { Sidebar } from './layout/Sidebar';
import { AppHeader } from './layout/AppHeader';
import { UserProfileDialog } from './layout/UserProfileDialog';
import { SettingsDialog } from './layout/SettingsDialog';
import { CompanyInfoModal } from './CompanyInfoModal';
import { DashboardIcon, FolderIcon, BusinessIcon, PeopleIcon, BuildIcon, HandymanIcon, CategoryIcon, NotificationsActiveIcon, ReceiptLongIcon } from './icons';










interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  dashboardSubTab?: DashboardSubTab;
  onDashboardSubTabChange?: (subTab: DashboardSubTab) => void;
  providedServicesSubTab?: ProvidedServicesSubTab;
  onProvidedServicesSubTabChange?: (subTab: ProvidedServicesSubTab) => void;
  stats: ProjectStats;
  userPreferences?: Record<string, any>;
  onPreferenceChange?: (key: string, value: any) => void;
  onNavigateToPendingUsers?: () => void;
  onOpenProject?: (projectId: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<Props> = ({
  activeTab,
  onTabChange,
  dashboardSubTab = 'projects',
  onDashboardSubTabChange,
  providedServicesSubTab = 'summary',
  onProvidedServicesSubTabChange,
  stats,
  userPreferences,
  onPreferenceChange,
  onNavigateToPendingUsers,
  onOpenProject,
  children,
}) => {
  const { t } = useLanguage();
  const {
    isUser,
    isAccountant,
    canManageClients,
    canManageUsers,
    canManageServices,
    canManageInvoices,
    canManageProvidedServices,
    pendingUsersCount,
    workOnEntities,
    setWorkOnEntities,
    logout,
  } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(true);
  const [isProvidedServicesExpanded, setIsProvidedServicesExpanded] = useState(true);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);

  useEffect(() => {
    if (userPreferences && typeof userPreferences.work_on_entities === 'boolean') {
      if (userPreferences.work_on_entities !== workOnEntities) {
        setWorkOnEntities(userPreferences.work_on_entities);
      }
    }
  }, [userPreferences?.work_on_entities, workOnEntities, setWorkOnEntities]);

  useEffect(() => {
    if (isUser && activeTab !== 'dashboard') {
      onTabChange('dashboard');
    } else if (isAccountant && !['dashboard'].includes(activeTab)) {
      onTabChange('dashboard');
    }
  }, [isUser, isAccountant, activeTab, onTabChange]);

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
  }, [activeTab, dashboardSubTab, providedServicesSubTab]);

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: t('tabDashboard'), icon: <DashboardIcon />, count: 0, show: true },
    { id: 'projects' as ActiveTab, label: t('tabProjects'), icon: <FolderIcon />, count: stats.active, show: !isUser && !isAccountant },
    { id: 'clients' as ActiveTab, label: t('tabClients'), icon: <BusinessIcon />, count: stats.clientsCount, show: canManageClients },
    {
      id: 'users' as ActiveTab,
      label: t('tabUsers'),
      icon: <PeopleIcon />,
      count: canManageUsers && pendingUsersCount > 0 ? pendingUsersCount : stats.usersCount,
      color: canManageUsers && pendingUsersCount > 0 ? ('warning' as const) : undefined,
      show: canManageUsers,
    },
    { id: 'services' as ActiveTab, label: t('tabServices'), icon: <BuildIcon />, count: 0, show: canManageServices },
    { id: 'providedServices' as ActiveTab, label: t('tabProvidedServices'), icon: <HandymanIcon />, count: 0, show: canManageProvidedServices },
    { id: 'categories' as ActiveTab, label: t('tabCategories'), icon: <CategoryIcon />, count: stats.categoriesCount || 0, show: canManageServices },
    { id: 'reminders' as ActiveTab, label: t('tabReminders'), icon: <NotificationsActiveIcon />, count: stats.monitor, show: !isUser && !isAccountant, color: 'error' as const },
    { id: 'invoices' as ActiveTab, label: t('tabInvoices'), icon: <ReceiptLongIcon />, count: stats.invoicesCount || 0, show: !isAccountant && (!isUser && canManageInvoices) },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onPreferenceChange={onPreferenceChange}
        onNavigateToPendingUsers={onNavigateToPendingUsers}
        handleOpenProfile={() => setIsProfileOpen(true)}
        handleOpenPreferences={() => setIsPreferencesOpen(true)}
        handleLogoutClick={logout}
        setIsCompanyInfoOpen={setIsCompanyInfoOpen}
        onOpenProject={onOpenProject}
      />

      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        activeTab={activeTab}
        onTabChange={onTabChange}
        dashboardSubTab={dashboardSubTab}
        onDashboardSubTabChange={onDashboardSubTabChange}
        isDashboardExpanded={isDashboardExpanded}
        setIsDashboardExpanded={setIsDashboardExpanded}
        providedServicesSubTab={providedServicesSubTab}
        onProvidedServicesSubTabChange={onProvidedServicesSubTabChange}
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
