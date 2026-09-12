import React, { useEffect, useState } from 'react';
import { Box, Toolbar } from '@mui/material';

import type { ActiveTab, AppSection, DashboardSubTab, ProvidedServicesSubTab, ProjectStats } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { UserProfileDialog } from './UserProfileDialog';
import { SettingsDialog } from './SettingsDialog';
import { CompanyInfoModal } from '../dialogs/CompanyInfoModal';
import { DashboardIcon, FolderIcon, BusinessIcon, AssignmentTurnedInIcon, PeopleIcon, BuildIcon, HandymanIcon, CategoryIcon, NotificationsActiveIcon, ReceiptLongIcon } from '../icons';

interface Props {
  currentApp: AppSection;
  onAppChange: (app: AppSection) => void;
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
  currentApp,
  onAppChange,
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

  useEffect(() => {
    if (currentApp === 'data-management' && (isUser || isAccountant || !(role === 'Administrator' || role === 'Manager'))) {
      onAppChange('project-tracker');
      onTabChange('dashboard');
    }
  }, [currentApp, role, isUser, isAccountant, onAppChange, onTabChange]);

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
    { id: 'permits' as ActiveTab, label: t('tabPermits'), icon: <AssignmentTurnedInIcon />, count: 0, show: canManagePermits },
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
        currentApp={currentApp}
        onAppChange={onAppChange}
        activeTab={activeTab}
        onTabChange={onTabChange}
        dashboardSubTab={dashboardSubTab}
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
        currentApp={currentApp}
        activeTab={activeTab}
        onTabChange={onTabChange}
        dashboardSubTab={dashboardSubTab}
        onDashboardSubTabChange={onDashboardSubTabChange}
        providedServicesSubTab={providedServicesSubTab}
        onProvidedServicesSubTabChange={onProvidedServicesSubTabChange}
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
