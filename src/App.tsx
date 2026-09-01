import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import type {
  Project,
  ActiveTab,
  DashboardSubTab,
  ProvidedServicesSubTab,
  SaveResult,
} from './types';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomThemeProvider } from './context/ThemeContext';
import { AdminLayout } from './components/AdminLayout';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ConfirmDeleteDialog } from './components/ConfirmDeleteDialog';
import { LoginView } from './components/auth/LoginView';
import { useProjects } from './hooks/useProjects';
import { useClients } from './hooks/useClients';
import { useUsers } from './hooks/useUsers';
import { useServices } from './hooks/useServices';
import { useProvidedServices } from './hooks/useProvidedServices';
import { useCategories } from './hooks/useCategories';
import { useReminders } from './hooks/useReminders';
import { useInvoices } from './hooks/useInvoices';
import { useAppData } from './hooks/useAppData';
import './index.css';

const DashboardView = React.lazy(() => import('./components/views/DashboardView'));
const ProjectsView = React.lazy(() => import('./components/views/ProjectsView'));
const ClientsView = React.lazy(() => import('./components/views/ClientsView'));
const UsersView = React.lazy(() => import('./components/views/UsersView'));
const ServicesView = React.lazy(() => import('./components/views/ServicesView'));
const ProvidedServicesView = React.lazy(() => import('./components/views/ProvidedServicesView'));
const CategoriesView = React.lazy(() => import('./components/views/CategoriesView'));
const RemindersView = React.lazy(() => import('./components/views/RemindersView'));
const InvoicesView = React.lazy(() => import('./components/views/InvoicesView'));
const ProjectModal = React.lazy(() => import('./components/ProjectModal'));
const ProjectViewModal = React.lazy(() => import('./components/ProjectViewModal'));

function MainApp() {
  const { t } = useLanguage();
  const { currentUser, isAccountant } = useAuth();

  // ── UI State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState<DashboardSubTab>('projects');
  const [providedServicesSubTab, setProvidedServicesSubTab] = useState<ProvidedServicesSubTab>('summary');
  const [usersFilterStatus, setUsersFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const askDeleteConfirm = useCallback((message: string, onConfirm: () => void) => {
    setDeleteConfirmState({ open: true, message, onConfirm });
  }, []);

  // ── Auth Headers ─────────────────────────────────────────────────────────────
  const authHeaders = useCallback(() => {
    const headers: Record<string, string> = {};
    if (currentUser?.id) headers['X-User-Id'] = currentUser.id;
    return headers;
  }, [currentUser?.id]);

  // ── fetchersRef: breaks the circular dependency between domain hooks
  //    (which need fetch functions) and useAppData (which needs domain setters).
  const fetchersRef = useRef<{
    fetchProjects: () => Promise<void>;
    fetchClients: () => Promise<void>;
    fetchUsers: () => Promise<void>;
    fetchServices: () => Promise<void>;
    fetchProvidedServices: () => Promise<void>;
    fetchCategories: () => Promise<void>;
    fetchReminders: () => Promise<void>;
    fetchInvoices: () => Promise<void>;
    fetchStats: () => Promise<void>;
  }>({
    fetchProjects: async () => {},
    fetchClients: async () => {},
    fetchUsers: async () => {},
    fetchServices: async () => {},
    fetchProvidedServices: async () => {},
    fetchCategories: async () => {},
    fetchReminders: async () => {},
    fetchInvoices: async () => {},
    fetchStats: async () => {},
  });

  const stableFetchers = useMemo(() => ({
    fetchProjects: () => fetchersRef.current.fetchProjects(),
    fetchClients: () => fetchersRef.current.fetchClients(),
    fetchUsers: () => fetchersRef.current.fetchUsers(),
    fetchServices: () => fetchersRef.current.fetchServices(),
    fetchProvidedServices: () => fetchersRef.current.fetchProvidedServices(),
    fetchCategories: () => fetchersRef.current.fetchCategories(),
    fetchReminders: () => fetchersRef.current.fetchReminders(),
    fetchInvoices: () => fetchersRef.current.fetchInvoices(),
    fetchStats: () => fetchersRef.current.fetchStats(),
  }), []);

  // ── Domain Hooks ──────────────────────────────────────────────────────────────
  const projectsHook = useProjects(
    authHeaders,
    stableFetchers,
    askDeleteConfirm,
    (message, onConfirm) => setCompleteConfirmState({ open: true, message, onConfirm }),
  );

  const clientsHook = useClients(authHeaders, stableFetchers, askDeleteConfirm);
  const usersHook = useUsers(authHeaders, stableFetchers, askDeleteConfirm);
  const servicesHook = useServices(authHeaders, stableFetchers, askDeleteConfirm);
  const providedServicesHook = useProvidedServices(authHeaders, stableFetchers, askDeleteConfirm);
  const categoriesHook = useCategories(authHeaders, stableFetchers, askDeleteConfirm);
  const remindersHook = useReminders(authHeaders, stableFetchers, askDeleteConfirm);
  const invoicesHook = useInvoices(authHeaders, stableFetchers, askDeleteConfirm);

  // ── Stats (kept local since it drives the sidebar badges) ────────────────────
  const [stats, setStats] = useState({
    active: 0, done: 0, stale: 0, monitor: 0, clientsCount: 0, usersCount: 0, servicesCount: 0,
  });

  // ── Orchestration Hook (data fetching + preferences) ─────────────────────────
  const { fetchAllData, fetchPreferences, updatePreference, userPreferences, fetchers } = useAppData(
    authHeaders,
    searchQuery,
    {
      setProjects: projectsHook.setProjects,
      setClients: clientsHook.setClients,
      setUsers: usersHook.setUsers,
      setServices: servicesHook.setServices,
      setProvidedServices: providedServicesHook.setProvidedServices,
      setCategories: categoriesHook.setCategories,
      setReminders: remindersHook.setReminders,
      setInvoices: invoicesHook.setInvoices,
      setStats,
    },
  );

  // Wire the ref so domain hooks always call the latest fetchers
  fetchersRef.current = fetchers;

  // ── Initial data load ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      fetchAllData();
      fetchPreferences();
    }
  }, [currentUser, fetchAllData, fetchPreferences]);

  // ── Derived State ─────────────────────────────────────────────────────────────
  const derivedStats = useMemo(() => {
    const today = new Date(new Date().toDateString());

    const approachingCount = remindersHook.reminders.filter((r) => {
      const s = (r.status || '').toLowerCase();
      if (s === 'completed' || s === 'završeno' || s === 'завршено') return false;
      if (!r.dueDate) return false;
      const due = new Date(r.dueDate.split('T')[0]);
      const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 10;
    }).length;

    const overdueCount = projectsHook.projects.filter(
      (p) => !p.done && p.deadline && new Date(p.deadline) < today
    ).length;

    return {
      ...stats,
      monitor: approachingCount,
      overdue: overdueCount,
    };
  }, [stats, remindersHook.reminders, projectsHook.projects]);

  const currentViewingProject = useMemo(() => {
    if (!viewingProject) return null;
    return projectsHook.projects.find((p) => p.id === viewingProject.id) || viewingProject;
  }, [projectsHook.projects, viewingProject]);

  // ── Project Modal Helpers ─────────────────────────────────────────────────────
  const handleViewProject = (p: Project) => {
    setViewingProject(p);
    setIsProjectViewModalOpen(true);
  };

  const handleEditProject = (p: Project | null) => {
    setIsProjectViewModalOpen(false);
    setViewingProject(null);
    setEditingProject(p);
    setIsProjectModalOpen(true);
  };

  // Thin wrapper: hook handles the API call; App.tsx handles closing the modal
  const handleSaveProject = async (data: Partial<Project>): Promise<SaveResult> => {
    const result = await projectsHook.handleSaveProject(data);
    if (result.success && isProjectModalOpen) {
      setIsProjectModalOpen(false);
      setEditingProject(null);
    }
    return result;
  };

  if (!currentUser) {
    return (
      <CustomThemeProvider
        initialMode={userPreferences.theme || 'light'}
        onThemeChange={(mode) => updatePreference('theme', mode)}
      >
        <LoginView />
      </CustomThemeProvider>
    );
  }

  return (
    <CustomThemeProvider
      initialMode={userPreferences.theme || 'light'}
      onThemeChange={(mode) => updatePreference('theme', mode)}
    >
      <AdminLayout
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'users') setUsersFilterStatus('all');
        }}
        onNavigateToPendingUsers={() => {
          setActiveTab('users');
          setUsersFilterStatus('pending');
        }}
        dashboardSubTab={dashboardSubTab}
        onDashboardSubTabChange={setDashboardSubTab}
        providedServicesSubTab={providedServicesSubTab}
        onProvidedServicesSubTabChange={setProvidedServicesSubTab}
        stats={derivedStats}
        userPreferences={userPreferences}
        onPreferenceChange={updatePreference}
      >
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}><CircularProgress /></Box>}>
          {activeTab === 'dashboard' && (
          <DashboardView
            dashboardSubTab={dashboardSubTab}
            stats={derivedStats}
            projects={projectsHook.projects}
            clients={clientsHook.clients}
            users={usersHook.users}
            categories={categoriesHook.categories}
            services={servicesHook.services}
            reminders={remindersHook.reminders}
            invoices={invoicesHook.invoices}
            providedServices={providedServicesHook.providedServices}
            onSaveProvidedService={providedServicesHook.handleSaveProvidedService}
            onMarkSampled={projectsHook.handleMarkSampled}
            onToggleDone={projectsHook.handleToggleDone}
            onSaveReminder={remindersHook.handleSaveReminder}
            onDeleteReminder={remindersHook.handleDeleteReminder}
            onStatusChangeReminder={remindersHook.handleStatusChangeReminder}
            onViewProject={handleViewProject}
            onEditProject={handleEditProject}
            onDeleteProject={projectsHook.handleDeleteProject}
            onNavigateToProjects={() => {
              setActiveTab('dashboard');
              setDashboardSubTab('projects');
            }}
            onNavigateToInvoices={() => {
              if (isAccountant) {
                setActiveTab('dashboard');
                setDashboardSubTab('invoices');
              } else {
                setActiveTab('invoices');
              }
            }}
            onOpenNewProject={() => handleEditProject(null)}
            onSaveInvoice={invoicesHook.handleSaveInvoice}
            onDeleteInvoice={invoicesHook.handleDeleteInvoice}
            onStatusChangeInvoice={invoicesHook.handleUpdateInvoiceStatus}
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
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projectsHook.projects}
            services={servicesHook.services}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenNew={() => handleEditProject(null)}
            onToggleDone={projectsHook.handleToggleDone}
            onMarkSampled={projectsHook.handleMarkSampled}
            onView={handleViewProject}
            onEdit={handleEditProject}
            onDelete={projectsHook.handleDeleteProject}
            visibleColumns={userPreferences.cols_projects}
            onVisibleColumnsChange={(cols) => updatePreference('cols_projects', cols)}
            rowsPerPageOptions={userPreferences.rowsPerPageOptions_projects}
            onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_projects', opts)}
            rowsPerPage={userPreferences.rowsPerPage_projects}
            onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_projects', rpp)}
            sortState={userPreferences.sort_projects}
            onSortChange={(sort) => updatePreference('sort_projects', sort)}
            quickFilter={userPreferences.quick_filter_projects || 'all'}
            onQuickFilterChange={(val) => updatePreference('quick_filter_projects', val)}
            onRefresh={fetchers.fetchProjects}
          />
        )}

        {isProjectViewModalOpen && currentViewingProject && (
          <Suspense fallback={null}>
            <ProjectViewModal
              isOpen={isProjectViewModalOpen}
              project={currentViewingProject}
              clients={clientsHook.clients}
              users={usersHook.users}
              services={servicesHook.services}
              reminders={remindersHook.reminders}
              invoices={invoicesHook.invoices}
              onClose={() => {
                setIsProjectViewModalOpen(false);
                setViewingProject(null);
              }}
              onEdit={handleEditProject}
              onSave={handleSaveProject}
              onToggleDone={projectsHook.handleToggleDone}
              onSaveReminder={remindersHook.handleSaveReminder}
              onDeleteReminder={remindersHook.handleDeleteReminder}
              onStatusChangeReminder={remindersHook.handleStatusChangeReminder}
              onSaveInvoice={invoicesHook.handleSaveInvoice}
              onDeleteInvoice={invoicesHook.handleDeleteInvoice}
              onStatusChangeInvoice={invoicesHook.handleUpdateInvoiceStatus}
            />
          </Suspense>
        )}

        {isProjectModalOpen && (
          <Suspense fallback={null}>
            <ProjectModal
              isOpen={isProjectModalOpen}
              projectToEdit={editingProject}
              clients={clientsHook.clients}
              users={usersHook.users}
              services={servicesHook.services}
              reminders={remindersHook.reminders}
              invoices={invoicesHook.invoices}
              onClose={() => {
                setIsProjectModalOpen(false);
                setEditingProject(null);
              }}
              onSave={handleSaveProject}
              onDelete={projectsHook.handleDeleteProject}
              onToggleDone={projectsHook.handleToggleDone}
              onSaveReminder={remindersHook.handleSaveReminder}
              onDeleteReminder={remindersHook.handleDeleteReminder}
              onStatusChangeReminder={remindersHook.handleStatusChangeReminder}
              onSaveInvoice={invoicesHook.handleSaveInvoice}
              onDeleteInvoice={invoicesHook.handleDeleteInvoice}
              onStatusChangeInvoice={invoicesHook.handleUpdateInvoiceStatus}
            />
          </Suspense>
        )}

        {activeTab === 'clients' && (
          <ClientsView
            clients={clientsHook.clients}
            onSaveClient={clientsHook.handleSaveClient}
            onDeleteClient={clientsHook.handleDeleteClient}
            visibleColumns={userPreferences.cols_clients}
            onVisibleColumnsChange={(cols) => updatePreference('cols_clients', cols)}
            rowsPerPageOptions={userPreferences.rowsPerPageOptions_clients}
            onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_clients', opts)}
            rowsPerPage={userPreferences.rowsPerPage_clients}
            onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_clients', rpp)}
            sortState={userPreferences.sort_clients}
            onSortChange={(sort) => updatePreference('sort_clients', sort)}
            onRefresh={fetchers.fetchClients}
          />
        )}

        {activeTab === 'users' && (
          <UsersView
            users={usersHook.users}
            onSaveUser={usersHook.handleSaveUser}
            onDeleteUser={usersHook.handleDeleteUser}
            onApproveUser={usersHook.handleApproveUser}
            onRejectUser={usersHook.handleRejectUser}
            onForceLogoutUser={usersHook.handleForceLogoutUser}
            visibleColumns={userPreferences.cols_users}
            onVisibleColumnsChange={(cols) => updatePreference('cols_users', cols)}
            rowsPerPageOptions={userPreferences.rowsPerPageOptions_users}
            onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_users', opts)}
            rowsPerPage={userPreferences.rowsPerPage_users}
            onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_users', rpp)}
            sortState={userPreferences.sort_users}
            onSortChange={(sort) => updatePreference('sort_users', sort)}
            initialFilterStatus={usersFilterStatus}
            quickFilter={userPreferences.quick_filter_users || 'all'}
            onQuickFilterChange={(val) => updatePreference('quick_filter_users', val)}
            onRefresh={fetchers.fetchUsers}
          />
        )}

        {activeTab === 'services' && (
          <ServicesView
            services={servicesHook.services}
            categories={categoriesHook.categories}
            onSaveService={servicesHook.handleSaveService}
            onDeleteService={servicesHook.handleDeleteService}
            visibleColumns={userPreferences.cols_services}
            onVisibleColumnsChange={(cols) => updatePreference('cols_services', cols)}
            rowsPerPageOptions={userPreferences.rowsPerPageOptions_services}
            onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_services', opts)}
            rowsPerPage={userPreferences.rowsPerPage_services}
            onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_services', rpp)}
            sortState={userPreferences.sort_services}
            onSortChange={(sort) => updatePreference('sort_services', sort)}
            onRefresh={fetchers.fetchServices}
          />
        )}

        {activeTab === 'providedServices' && (
          <ProvidedServicesView
            subTab={providedServicesSubTab}
            providedServices={providedServicesHook.providedServices}
            services={servicesHook.services}
            clients={clientsHook.clients}
            projects={projectsHook.projects}
            invoices={invoicesHook.invoices}
            categories={categoriesHook.categories}
            onSaveProvidedService={providedServicesHook.handleSaveProvidedService}
            onDeleteProvidedService={providedServicesHook.handleDeleteProvidedService}
            onSaveService={servicesHook.handleSaveService}
            onSaveInvoice={invoicesHook.handleSaveInvoice}
            onDeleteInvoice={invoicesHook.handleDeleteInvoice}
            onStatusChangeInvoice={invoicesHook.handleUpdateInvoiceStatus}
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
            onRefresh={fetchers.fetchProvidedServices}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            categories={categoriesHook.categories}
            onSaveCategory={categoriesHook.handleSaveCategory}
            onDeleteCategory={categoriesHook.handleDeleteCategory}
            visibleColumns={userPreferences.cols_categories}
            onVisibleColumnsChange={(cols) => updatePreference('cols_categories', cols)}
            rowsPerPageOptions={userPreferences.rowsPerPageOptions_categories}
            onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_categories', opts)}
            rowsPerPage={userPreferences.rowsPerPage_categories}
            onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_categories', rpp)}
            sortState={userPreferences.sort_categories}
            onSortChange={(sort) => updatePreference('sort_categories', sort)}
            onRefresh={fetchers.fetchCategories}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesView
            invoices={invoicesHook.invoices}
            clients={clientsHook.clients}
            projects={projectsHook.projects}
            providedServices={providedServicesHook.providedServices}
            onSaveProvidedService={providedServicesHook.handleSaveProvidedService}
            onSaveInvoice={invoicesHook.handleSaveInvoice}
            onDeleteInvoice={invoicesHook.handleDeleteInvoice}
            onUpdateStatus={invoicesHook.handleUpdateInvoiceStatus}
            visibleColumns={userPreferences.cols_invoices}
            onVisibleColumnsChange={(cols) => updatePreference('cols_invoices', cols)}
            rowsPerPageOptions={userPreferences.rowsPerPageOptions_invoices}
            onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_invoices', opts)}
            rowsPerPage={userPreferences.rowsPerPage_invoices}
            onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_invoices', rpp)}
            sortState={userPreferences.sort_invoices}
            onSortChange={(sort) => updatePreference('sort_invoices', sort)}
            onRefresh={fetchers.fetchInvoices}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            reminders={remindersHook.reminders}
            projects={projectsHook.projects}
            clients={clientsHook.clients}
            users={usersHook.users}
            onSaveReminder={remindersHook.handleSaveReminder}
            onDeleteReminder={remindersHook.handleDeleteReminder}
            onStatusChange={remindersHook.handleStatusChangeReminder}
            visibleColumns={userPreferences.cols_reminders}
            onVisibleColumnsChange={(cols) => updatePreference('cols_reminders', cols)}
            rowsPerPageOptions={userPreferences.rowsPerPageOptions_reminders}
            onRowsPerPageOptionsChange={(opts) => updatePreference('rowsPerPageOptions_reminders', opts)}
            rowsPerPage={userPreferences.rowsPerPage_reminders}
            onRowsPerPageChange={(rpp) => updatePreference('rowsPerPage_reminders', rpp)}
            sortState={userPreferences.sort_reminders}
            onSortChange={(sort) => updatePreference('sort_reminders', sort)}
            quickFilter={userPreferences.quick_filter_reminders || 'all'}
            onQuickFilterChange={(val) => updatePreference('quick_filter_reminders', val)}
            onRefresh={fetchers.fetchReminders}
          />
        )}

        </Suspense>

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
      </AdminLayout>
    </CustomThemeProvider>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

