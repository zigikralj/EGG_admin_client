import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import type {
  Project,
  DashboardSubTab,
  ProvidedServicesSubTab,
} from './types';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoadingProvider } from './context/LoadingContext';
import { CustomThemeProvider } from './context/ThemeContext';
import { apiFetch } from './api';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoadingMask } from './components/common/LoadingMask';
import { ConfirmDialog } from './components/dialogs/ConfirmDialog';
import { ConfirmDeleteDialog } from './components/dialogs/ConfirmDeleteDialog';
import { VersionUpdatePrompt } from './components/dialogs/VersionUpdatePrompt';
import { LoginPage } from './pages/auth/LoginPage';
import { useProjectsQuery, useRemindersQuery, useStatsQuery, usePreferencesQuery, usePreferencesMutations } from './queries';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './index.css';

const TrackerPage = React.lazy(() => import('./pages/tracker/TrackerPage'));
const ProjectsPage = React.lazy(() => import('./pages/management/ProjectsPage'));
const ClientsPage = React.lazy(() => import('./pages/management/ClientsPage'));
const UsersPage = React.lazy(() => import('./pages/management/UsersPage'));
const ServicesPage = React.lazy(() => import('./pages/management/ServicesPage'));
const ProvidedServicesPage = React.lazy(() => import('./pages/management/ProvidedServicesPage'));
const CategoriesPage = React.lazy(() => import('./pages/management/CategoriesPage'));
const RemindersPage = React.lazy(() => import('./pages/management/RemindersPage'));
const InvoicesPage = React.lazy(() => import('./pages/management/InvoicesPage'));
const RolesPage = React.lazy(() => import('./pages/management/RolesPage'));
const PermitsPage = React.lazy(() => import('./pages/management/PermitsPage'));
const ProjectModal = React.lazy(() => import('./components/project/ProjectModal'));
const ProjectViewModal = React.lazy(() => import('./components/project/ProjectViewModal'));

function MainApp() {
  const { t } = useLanguage();
  const { currentUser, isAccountant } = useAuth();

  // ── UI State ────────────────────────────────────────────────────────────────
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const providedServicesSubTab: ProvidedServicesSubTab = 'summary';


  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectViewModalOpen, setIsProjectViewModalOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  const [completeConfirmState, setCompleteConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  // ── Queries & State ─────────────────────────────────────────────────────────
  const { data: userPreferences = {} } = usePreferencesQuery();
  const { updatePreferenceMutation } = usePreferencesMutations();
  const updatePreference = (key: string, value: any) => updatePreferenceMutation.mutate({ key, value });

  const { data: stats = { active: 0, done: 0, stale: 0, monitor: 0, clientsCount: 0, usersCount: 0, servicesCount: 0 } } = useStatsQuery();
  const { data: projects = [] } = useProjectsQuery();
  const { data: reminders = [] } = useRemindersQuery();

  // ── Derived State ─────────────────────────────────────────────────────────────
  const derivedStats = useMemo(() => {
    const today = new Date(new Date().toDateString());

    const approachingCount = reminders.filter((r) => {
      const s = (r.status || '').toLowerCase();
      if (s === 'completed' || s === 'završeno' || s === 'завршено') return false;
      if (!r.dueDate) return false;
      const due = new Date(r.dueDate.split('T')[0]);
      const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 10;
    }).length;

    const overdueCount = projects.filter(
      (p) => !p.done && p.deadline && new Date(p.deadline) < today
    ).length;

    return {
      ...stats,
      monitor: approachingCount,
      overdue: overdueCount,
    };
  }, [stats, reminders, projects]);

  const currentViewingProject = useMemo(() => {
    if (!viewingProject) return null;
    return projects.find((p) => p.id === viewingProject.id) || viewingProject;
  }, [projects, viewingProject]);

  // ── Project Modal Helpers ─────────────────────────────────────────────────────
  const handleViewProject = (p: Project) => {
    setViewingProject(p);
    setIsProjectViewModalOpen(true);
  };

  const handleOpenProjectById = useCallback(async (projectId: string) => {
    let target = projects.find((p) => p.id === projectId);
    if (!target) {
      try {
        const res = await apiFetch('/api/projects');
        if (res.ok) {
          const allProjects: Project[] = await res.json();
          target = allProjects.find((p) => p.id === projectId);
        }
      } catch (e) {
        console.error('Error fetching project for notification:', e);
      }
    }
    if (target) {
      setViewingProject(target);
      setIsProjectViewModalOpen(true);
    }
  }, [projects]);

  const handleEditProject = (p: Project | null) => {
    setIsProjectViewModalOpen(false);
    setViewingProject(null);
    setEditingProject(p);
    setIsProjectModalOpen(true);
  };

  if (!currentUser) {
    return (
      <CustomThemeProvider
        initialMode={userPreferences.theme || 'light'}
        onThemeChange={(mode) => updatePreference('theme', mode)}
      >
        <LoginPage />
        <LoadingMask />
        <VersionUpdatePrompt />
      </CustomThemeProvider>
    );
  }

  return (
    <CustomThemeProvider
      initialMode={userPreferences.theme || 'light'}
      onThemeChange={(mode) => updatePreference('theme', mode)}
    >
      <AdminLayout
        stats={derivedStats}
        userPreferences={userPreferences}
        onPreferenceChange={updatePreference}
        onOpenProject={handleOpenProjectById}
      >
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}><CircularProgress /></Box>}>
          <Routes>
            <Route path="/EGG_admin_client/*" element={<Navigate to="/" replace />} />
            <Route path="/project-tracker/statistic-waste-management" element={<Navigate to="/project-tracker/statistic-waste-disposal" replace />} />
            <Route path="/project-tracker/waste-management" element={<Navigate to="/project-tracker/statistic-waste-disposal" replace />} />
            <Route path="/project-tracker/*" element={
              <TrackerPage
                dashboardSubTab={(location.pathname.split('/')[2] as DashboardSubTab) || 'projects'}
                onViewProject={handleViewProject}
                onEditProject={handleEditProject}
                onOpenNewProject={() => handleEditProject(null)}
                onNavigateToProjects={() => navigate('/project-tracker/projects')}
                onNavigateToInvoices={() => {
                  if (isAccountant) {
                    navigate('/project-tracker/invoices');
                  } else {
                    navigate('/data-management/invoices');
                  }
                }}
                quickFilters={userPreferences.quick_filter_dashboard_projects}
                onQuickFiltersChange={(filters) => updatePreference('quick_filter_dashboard_projects', filters)}
                quickFilterDashboardReminders={userPreferences.quick_filter_dashboard_reminders}
                onQuickFilterDashboardRemindersChange={(val) => updatePreference('quick_filter_dashboard_reminders', val)}
                remindersRowsPerPageOptions={userPreferences.rowsPerPageOptions_dashboard_reminders}
                onRemindersRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_dashboard_reminders', opts)}
                remindersRowsPerPage={userPreferences.rowsPerPage_dashboard_reminders}
                onRemindersRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_dashboard_reminders', rpp)}
                invoicesRowsPerPageOptions={userPreferences.rowsPerPageOptions_dashboard_invoices}
                onInvoicesRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_dashboard_invoices', opts)}
                invoicesRowsPerPage={userPreferences.rowsPerPage_dashboard_invoices}
                onInvoicesRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_dashboard_invoices', rpp)}
                wasteManagementRowsPerPageOptions={userPreferences.rowsPerPageOptions_dashboard_waste_management}
                onWasteManagementRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_dashboard_waste_management', opts)}
                wasteManagementRowsPerPage={userPreferences.rowsPerPage_dashboard_waste_management}
                onWasteManagementRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_dashboard_waste_management', rpp)}
              />
            } />
            <Route path="/data-management/projects" element={
              <ProjectsPage
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenNew={() => handleEditProject(null)}
                onView={handleViewProject}
                onEdit={handleEditProject}
                visibleColumns={userPreferences.cols_projects}
                onVisibleColumnsChange={(cols) => updatePreference('cols_projects', cols)}
                rowsPerPageOptions={userPreferences.rowsPerPageOptions_projects}
                onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_projects', opts)}
                rowsPerPage={userPreferences.rowsPerPage_projects}
                onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_projects', rpp)}
                sortState={userPreferences.sort_projects}
                onSortChange={(sort) => updatePreference('sort_projects', sort)}
                quickFilters={Array.isArray(userPreferences.quick_filter_projects) ? userPreferences.quick_filter_projects : (userPreferences.quick_filter_projects && userPreferences.quick_filter_projects !== 'all' ? [userPreferences.quick_filter_projects] : [])}
                onQuickFiltersChange={(val) => updatePreference('quick_filter_projects', val)}
              />
            } />
            <Route path="/data-management/clients" element={
              <ClientsPage
                visibleColumns={userPreferences.cols_clients}
                onVisibleColumnsChange={(cols) => updatePreference('cols_clients', cols)}
                rowsPerPageOptions={userPreferences.rowsPerPageOptions_clients}
                onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_clients', opts)}
                rowsPerPage={userPreferences.rowsPerPage_clients}
                onRowsPerPageChange={(rows) => updatePreference('rowsPerPage_clients', rows)}
                sortState={userPreferences.sort_clients}
                onSortChange={(sort) => updatePreference('sort_clients', sort)}
              />
            } />
            <Route path="/data-management/permits" element={
              <PermitsPage
                visibleColumns={userPreferences.cols_permits}
                onVisibleColumnsChange={(cols) => updatePreference('cols_permits', cols)}
                rowsPerPageOptions={userPreferences.rowsPerPageOptions_permits}
                onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_permits', opts)}
                rowsPerPage={userPreferences.rowsPerPage_permits}
                onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_permits', rpp)}
                sortState={userPreferences.sort_permits}
                onSortChange={(sort) => updatePreference('sort_permits', sort)}
                quickFilters={Array.isArray(userPreferences.quick_filter_permits) ? userPreferences.quick_filter_permits : (userPreferences.quick_filter_permits && userPreferences.quick_filter_permits !== 'all' ? [userPreferences.quick_filter_permits] : [])}
                onQuickFiltersChange={(val) => updatePreference('quick_filter_permits', val)}
              />
            } />
            <Route path="/data-management/users" element={
              <UsersPage
                visibleColumns={userPreferences.cols_users}
                onVisibleColumnsChange={(cols) => updatePreference('cols_users', cols)}
                rowsPerPageOptions={userPreferences.rowsPerPageOptions_users}
                onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_users', opts)}
                rowsPerPage={userPreferences.rowsPerPage_users}
                onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_users', rpp)}
                sortState={userPreferences.sort_users}
                onSortChange={(sort) => updatePreference('sort_users', sort)}
                quickFilters={Array.isArray(userPreferences.quick_filter_users) ? userPreferences.quick_filter_users : (userPreferences.quick_filter_users && userPreferences.quick_filter_users !== 'all' ? [userPreferences.quick_filter_users] : [])}
                onQuickFiltersChange={(val) => updatePreference('quick_filter_users', val)}
              />
            } />
            <Route path="/data-management/services" element={
              <ServicesPage
                visibleColumns={userPreferences.cols_services}
                onVisibleColumnsChange={(cols) => updatePreference('cols_services', cols)}
                rowsPerPageOptions={userPreferences.rowsPerPageOptions_services}
                onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_services', opts)}
                rowsPerPage={userPreferences.rowsPerPage_services}
                onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_services', rpp)}
                sortState={userPreferences.sort_services}
                onSortChange={(sort) => updatePreference('sort_services', sort)}
              />
            } />
            <Route path="/data-management/provided-services" element={
              <ProvidedServicesPage
                subTab={providedServicesSubTab}
                visibleColumns={userPreferences.cols_providedServices}
                onVisibleColumnsChange={(cols) => updatePreference('cols_providedServices', cols)}
                rowsPerPageOptions={userPreferences.rowsPerPageOptions_providedServices}
                onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_providedServices', opts)}
                rowsPerPage={userPreferences.rowsPerPage_providedServices}
                onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_providedServices', rpp)}
                sortState={userPreferences.sort_providedServices}
                onSortChange={(sort) => updatePreference('sort_providedServices', sort)}
                quickFilter={userPreferences.quick_filter_providedServices || 'all'}
                onQuickFilterChange={(val) => updatePreference('quick_filter_providedServices', val)}
              />
            } />
            <Route path="/data-management/categories" element={
              <CategoriesPage
                visibleColumns={userPreferences.cols_categories}
                onVisibleColumnsChange={(cols) => updatePreference('cols_categories', cols)}
                rowsPerPageOptions={userPreferences.rowsPerPageOptions_categories}
                onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_categories', opts)}
                rowsPerPage={userPreferences.rowsPerPage_categories}
                onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_categories', rpp)}
                sortState={userPreferences.sort_categories}
                onSortChange={(sort) => updatePreference('sort_categories', sort)}
              />
            } />
            <Route path="/data-management/invoices" element={
              <InvoicesPage
                visibleColumns={userPreferences.cols_invoices}
                onVisibleColumnsChange={(cols) => updatePreference('cols_invoices', cols)}
                rowsPerPageOptions={userPreferences.rowsPerPageOptions_invoices}
                onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_invoices', opts)}
                rowsPerPage={userPreferences.rowsPerPage_invoices}
                onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_invoices', rpp)}
                sortState={userPreferences.sort_invoices}
                onSortChange={(sort) => updatePreference('sort_invoices', sort)}
              />
            } />
            <Route path="/data-management/reminders" element={
              <RemindersPage
                visibleColumns={userPreferences.cols_reminders}
                onVisibleColumnsChange={(cols) => updatePreference('cols_reminders', cols)}
                rowsPerPageOptions={userPreferences.rowsPerPageOptions_reminders}
                onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_reminders', opts)}
                rowsPerPage={userPreferences.rowsPerPage_reminders}
                onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_reminders', rpp)}
                sortState={userPreferences.sort_reminders}
                onSortChange={(sort) => updatePreference('sort_reminders', sort)}
                quickFilters={Array.isArray(userPreferences.quick_filter_reminders) ? userPreferences.quick_filter_reminders : (userPreferences.quick_filter_reminders && userPreferences.quick_filter_reminders !== 'all' ? [userPreferences.quick_filter_reminders] : [])}
                onQuickFiltersChange={(val) => updatePreference('quick_filter_reminders', val)}
              />
            } />
            <Route path="/data-management/roles" element={<RolesPage />} />
            <Route path="/" element={<Navigate to="/project-tracker/projects" replace />} />
            <Route path="*" element={<Navigate to="/project-tracker/projects" replace />} />
          </Routes>
        </Suspense>

        {isProjectViewModalOpen && currentViewingProject && (
          <Suspense fallback={null}>
            <ProjectViewModal
              isOpen={isProjectViewModalOpen}
              project={currentViewingProject}
              onClose={() => {
                setIsProjectViewModalOpen(false);
                setViewingProject(null);
              }}
              onEdit={handleEditProject}
            />
          </Suspense>
        )}

        {isProjectModalOpen && (
          <Suspense fallback={null}>
            <ProjectModal
              isOpen={isProjectModalOpen}
              projectToEdit={editingProject}
              onClose={() => {
                setIsProjectModalOpen(false);
                setEditingProject(null);
              }}
            />
          </Suspense>
        )}

        <ConfirmDeleteDialog
          open={deleteConfirmState.open}
          message={deleteConfirmState.message}
          onConfirm={deleteConfirmState.onConfirm}
          onClose={() => setDeleteConfirmState((prev) => ({ ...prev, open: false }))}
        />
        <ConfirmDialog
          open={completeConfirmState.open}
          title={t('confirmCompleteTitle')}
          message={completeConfirmState.message}
          confirmLabel={t('btnConfirm')}
          confirmColor="success"
          iconType="success"
          onConfirm={completeConfirmState.onConfirm}
          onClose={() => setCompleteConfirmState((prev) => ({ ...prev, open: false }))}
        />
        <VersionUpdatePrompt />
      </AdminLayout>
      <LoadingMask />
    </CustomThemeProvider>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <LoadingProvider>
            <MainApp />
          </LoadingProvider>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

