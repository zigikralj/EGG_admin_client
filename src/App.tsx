import React, { useState, useCallback, Suspense } from 'react';
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
import { usePreferencesQuery, usePreferencesMutations } from './queries';
import { useActivityTracker } from './hooks/useActivityTracker';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { API_ROUTES, PAGE_ROUTES } from './constants';
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
const ActivityLogsPage = React.lazy(() => import('./pages/management/ActivityLogsPage'));
const ActivityAnalyticsPage = React.lazy(() => import('./pages/management/ActivityAnalyticsPage'));

function MainApp() {
  useActivityTracker();
  const { t } = useLanguage();
  const { currentUser, hasPermission } = useAuth();

  // ── UI State ────────────────────────────────────────────────────────────────
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const providedServicesSubTab: ProvidedServicesSubTab = 'summary';


  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectViewModalOpen, setIsProjectViewModalOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [projectDiffRange, setProjectDiffRange] = useState<{ dateFrom: string; dateTo: string } | null>(null);

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

  // ── Project Modal Helpers ─────────────────────────────────────────────────────
  const handleViewProject = (p: Project, diffRange?: { dateFrom: string; dateTo: string } | null) => {
    setViewingProject(p);
    setProjectDiffRange(diffRange || null);
    setIsProjectViewModalOpen(true);
  };

  const handleOpenProjectById = useCallback(async (projectId: string) => {
    try {
      const res = await apiFetch(`${API_ROUTES.PROJECTS.BASE}/${projectId}`);
      if (res.ok) {
        const target: Project = await res.json();
        setViewingProject(target);
        setIsProjectViewModalOpen(true);
      }
    } catch (e) {
      console.error('Error fetching project for notification:', e);
    }
  }, []);

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
                onNavigateToProjects={() => navigate(PAGE_ROUTES.PROJECT_TRACKER_PROJECTS)}
                onNavigateToInvoices={() => {
                  if (hasPermission('apps', 'data-management') && hasPermission('invoices', 'view')) {
                    navigate(PAGE_ROUTES.INVOICES);
                  } else {
                    navigate(PAGE_ROUTES.PROJECT_TRACKER_INVOICES);
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
                sortDashboardProjects={userPreferences.sort_dashboard_projects}
                onSortDashboardProjectsChange={(sort) => updatePreference('sort_dashboard_projects', sort)}
              />
            } />
            <Route path={PAGE_ROUTES.PROJECTS} element={
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
            <Route path={PAGE_ROUTES.CLIENTS} element={
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
            <Route path={PAGE_ROUTES.PERMITS} element={
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
            <Route path={PAGE_ROUTES.USERS} element={
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
            <Route path={PAGE_ROUTES.SERVICES} element={
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
            <Route path={PAGE_ROUTES.PROVIDED_SERVICES} element={
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
            <Route path={PAGE_ROUTES.CATEGORIES} element={
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
            <Route path={PAGE_ROUTES.INVOICES} element={
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
            <Route path={PAGE_ROUTES.REMINDERS} element={
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
            <Route path={PAGE_ROUTES.ROLES} element={<RolesPage />} />
            <Route path={PAGE_ROUTES.ACTIVITY_LOGS} element={<ActivityLogsPage />} />
            <Route path={PAGE_ROUTES.ACTIVITY_ANALYTICS} element={<ActivityAnalyticsPage />} />
            <Route path="/" element={<Navigate to={PAGE_ROUTES.PROJECT_TRACKER_PROJECTS} replace />} />
            <Route path="*" element={<Navigate to={PAGE_ROUTES.PROJECT_TRACKER_PROJECTS} replace />} />
          </Routes>
        </Suspense>

        {isProjectViewModalOpen && viewingProject && (
          <Suspense fallback={null}>
            <ProjectViewModal
              isOpen={isProjectViewModalOpen}
              project={viewingProject}
              diffRange={projectDiffRange}
              onClose={() => {
                setIsProjectViewModalOpen(false);
                setViewingProject(null);
                setProjectDiffRange(null);
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

