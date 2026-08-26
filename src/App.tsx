import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Project,
  Client,
  User,
  Service,
  Category,
  Reminder,
  Invoice,
  ProjectStats,
  ActiveTab,
  DashboardSubTab,
  SaveResult,
} from './types';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomThemeProvider } from './context/ThemeContext';
import { AdminLayout } from './components/AdminLayout';
import { DashboardView } from './components/views/DashboardView';
import { ProjectsView } from './components/views/ProjectsView';
import { ClientsView } from './components/views/ClientsView';
import { UsersView } from './components/views/UsersView';
import { ServicesView } from './components/views/ServicesView';
import { CategoriesView } from './components/views/CategoriesView';
import { RemindersView } from './components/views/RemindersView';
import { InvoicesView } from './components/views/InvoicesView';
import { ProjectModal } from './components/ProjectModal';
import { ProjectViewModal } from './components/ProjectViewModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ConfirmDeleteDialog } from './components/ConfirmDeleteDialog';
import { LoginView } from './components/auth/LoginView';
import { apiFetch } from './api';
import './index.css';

function MainApp() {
  const { t } = useLanguage();
  const { currentUser, setUsersList, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState<DashboardSubTab>('default');
  const [usersFilterStatus, setUsersFilterStatus] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    active: 0,
    done: 0,
    stale: 0,
    monitor: 0,
    clientsCount: 0,
    usersCount: 0,
    servicesCount: 0,
  });

  const [userPreferences, setUserPreferences] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectViewModalOpen, setIsProjectViewModalOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const currentViewingProject = useMemo(() => {
    if (!viewingProject) return null;
    return projects.find((p) => p.id === viewingProject.id) || viewingProject;
  }, [projects, viewingProject]);

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

  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    message: '',
    onConfirm: () => {},
  });

  const [completeConfirmState, setCompleteConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    message: '',
    onConfirm: () => {},
  });

  const askDeleteConfirm = (message: string, onConfirm: () => void) => {
    setDeleteConfirmState({
      open: true,
      message,
      onConfirm,
    });
  };

  const authHeaders = useCallback(() => {
    const headers: Record<string, string> = {};
    if (currentUser?.id) {
      headers['X-User-Id'] = currentUser.id;
    }
    return headers;
  }, [currentUser?.id]);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await apiFetch('/api/preferences', { headers: authHeaders() });
      if (res.ok) {
        setUserPreferences(await res.json());
      }
    } catch (e) {
      console.error('Error fetching user preferences:', e);
    }
  }, [authHeaders]);

  const updatePreference = async (key: string, value: any) => {
    setUserPreferences((prev) => ({ ...prev, [key]: value }));
    try {
      await apiFetch(`/api/preferences/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ value }),
      });
    } catch (e) {
      console.error('Error updating user preference:', e);
    }
  };

  const fetchAllData = useCallback(async () => {
    try {
      const q = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const headers = authHeaders();

      const [pRes, cRes, uRes, sRes, catRes, remRes, invRes, stRes] = await Promise.all([
        apiFetch(`/api/projects${q}`, { headers }),
        apiFetch('/api/clients', { headers }),
        apiFetch('/api/users', { headers }),
        apiFetch('/api/services', { headers }),
        apiFetch('/api/categories', { headers }),
        apiFetch('/api/reminders', { headers }),
        apiFetch('/api/invoices', { headers }),
        apiFetch('/api/projects/stats', { headers }),
      ]);

      let fetchedProjects: Project[] = [];
      if (pRes.ok) {
        fetchedProjects = await pRes.json();
        setProjects(fetchedProjects);
      }
      if (cRes.ok) setClients(await cRes.json());
      if (uRes.ok) {
        const fetchedUsers: User[] = await uRes.json();
        setUsers(fetchedUsers);
        setUsersList(fetchedUsers);

        if (currentUser) {
          const currentInList = fetchedUsers.find((u) => u.id === currentUser.id);
          if (currentInList && (currentInList.status === 'BLOCKED' || (currentInList.isApproved === false && currentInList.status !== 'PENDING'))) {
            logout();
            return;
          }
        }
      }
      if (sRes.ok) setServices(await sRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      let fetchedReminders: Reminder[] = [];
      if (remRes.ok) {
        fetchedReminders = await remRes.json();
        setReminders(fetchedReminders);
      }
      if (invRes.ok) {
        setInvoices(await invRes.json());
      }
      if (stRes.ok) {
        const fetchedStats: ProjectStats = await stRes.json();
        const today = new Date(new Date().toDateString());
        const approachingCount = fetchedReminders.filter((r) => {
          const s = (r.status || '').toLowerCase();
          if (s === 'completed' || s === 'završeno' || s === 'завршено') return false;
          if (!r.dueDate) return false;
          const due = new Date(r.dueDate.split('T')[0]);
          const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= 10;
        }).length;
        fetchedStats.monitor = approachingCount;
        fetchedStats.overdue = fetchedProjects.filter((p) => !p.done && p.deadline && new Date(p.deadline) < today).length;
        setStats(fetchedStats);
      }
    } catch (error) {
      console.error('Error fetching data from API:', error);
    }
  }, [searchQuery, authHeaders, setUsersList, currentUser, logout]);

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
      fetchPreferences();
    }
  }, [currentUser, fetchAllData, fetchPreferences]);

  // PROJECT ACTIONS
  const handleToggleDone = (id: string) => {
    const targetProj = projects.find((p) => p.id === id);
    const isCompleting = targetProj ? !targetProj.done : true;

    const executeToggle = async () => {
      try {
        const res = await apiFetch(`/api/projects/${id}/toggle-done`, {
          method: 'PATCH',
          headers: authHeaders(),
        });
        if (res.ok) {
          fetchAllData();
        } else {
          const err = await res.json();
          alert(err.error || t('permissionDeniedOnlyOwnProjects'));
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (isCompleting) {
      setCompleteConfirmState({
        open: true,
        message: t('confirmCompleteProject'),
        onConfirm: executeToggle,
      });
    } else {
      executeToggle();
    }
  };

  const handleMarkSampled = async (id: string) => {
    try {
      const res = await apiFetch(`/api/projects/${id}/sample`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (res.ok) {
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || t('permissionDeniedOnlyOwnProjects'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = (id: string) => {
    askDeleteConfirm(t('confirmDeleteProject'), async () => {
      try {
        const res = await apiFetch(`/api/projects/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (res.ok) {
          fetchAllData();
        } else {
          const err = await res.json();
          alert(err.error || t('permissionDeniedOnlyOwnProjects'));
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleSaveProject = async (data: Partial<Project>): Promise<SaveResult> => {
    try {
      let res;
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };

      if (data.id) {
        res = await apiFetch(`/api/projects/${data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
      } else {
        res = await apiFetch('/api/projects', {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        if (isProjectModalOpen) {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }
        fetchAllData();
        return { success: true };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || err.message || t('errorSavingProject') };
      }
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e?.message || t('errorSavingProject') };
    }
  };

  // CLIENT ACTIONS
  const handleSaveClient = async (data: Partial<Client>): Promise<SaveResult> => {
    try {
      let res;
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };

      if (data.id) {
        res = await apiFetch(`/api/clients/${data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
      } else {
        res = await apiFetch('/api/clients', {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        fetchAllData();
        return { success: true };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || err.message || t('errorSavingClient') };
      }
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e?.message || t('errorSavingClient') };
    }
  };

  const handleDeleteClient = (id: string) => {
    askDeleteConfirm(t('confirmDeleteClient'), async () => {
      try {
        const res = await apiFetch(`/api/clients/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (res.ok) {
          fetchAllData();
        } else {
          const err = await res.json();
          alert(err.error || t('permissionDeniedClients'));
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  // USER ACTIONS
  const handleSaveUser = async (data: Partial<User>): Promise<SaveResult> => {
    try {
      let res;
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };

      if (data.id) {
        res = await apiFetch(`/api/users/${data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
      } else {
        res = await apiFetch('/api/users', {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        fetchAllData();
        return { success: true };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || err.message || t('errorSavingUser') };
      }
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e?.message || t('errorSavingUser') };
    }
  };

  const handleDeleteUser = (id: string) => {
    askDeleteConfirm(t('confirmDeleteUser'), async () => {
      try {
        const res = await apiFetch(`/api/users/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (res.ok) {
          fetchAllData();
        } else {
          const err = await res.json();
          alert(err.error || t('permissionDeniedUsers'));
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleApproveUser = async (userId: string, role: string) => {
    try {
      const res = await apiFetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to approve user.');
      }
    } catch (e) {
      console.error('Error approving user:', e);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const res = await apiFetch(`/api/users/${userId}/reject`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reject user.');
      }
    } catch (e) {
      console.error('Error rejecting user:', e);
    }
  };

  const handleForceLogoutUser = async (userId: string) => {
    try {
      const res = await apiFetch(`/api/users/${userId}/force-logout`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        fetchAllData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || err.message || 'Failed to force log out user');
      }
    } catch (e) {
      console.error('Error force logging out user:', e);
    }
  };

  // SERVICE ACTIONS
  const handleSaveService = async (data: Partial<Service>): Promise<SaveResult> => {
    try {
      let res;
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };

      if (data.id) {
        res = await apiFetch(`/api/services/${data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
      } else {
        res = await apiFetch('/api/services', {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        fetchAllData();
        return { success: true };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || err.message || t('errorSavingService') };
      }
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e?.message || t('errorSavingService') };
    }
  };

  const handleDeleteService = (id: string) => {
    askDeleteConfirm(t('confirmDeleteService'), async () => {
      try {
        const res = await apiFetch(`/api/services/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (res.ok) {
          fetchAllData();
        } else {
          const err = await res.json();
          alert(err.error || t('permissionDeniedServices'));
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  // CATEGORY ACTIONS
  const handleSaveCategory = async (data: Partial<Category>): Promise<SaveResult> => {
    try {
      let res;
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };

      if (data.id) {
        res = await apiFetch(`/api/categories/${data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
      } else {
        res = await apiFetch('/api/categories', {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        fetchAllData();
        return { success: true };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || err.message || t('errorSavingCategory') };
      }
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e?.message || t('errorSavingCategory') };
    }
  };

  const handleDeleteCategory = (id: string) => {
    askDeleteConfirm(t('confirmDeleteCategory'), async () => {
      try {
        const res = await apiFetch(`/api/categories/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (res.ok) {
          fetchAllData();
        } else {
          const err = await res.json();
          alert(err.error || t('permissionDeniedCategories'));
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  // REMINDER ACTIONS
  const handleSaveReminder = async (data: Partial<Reminder>): Promise<SaveResult> => {
    try {
      let res;
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };

      if (data.id) {
        res = await apiFetch(`/api/reminders/${data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
      } else {
        res = await apiFetch('/api/reminders', {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        fetchAllData();
        return { success: true };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || err.message || t('errorSavingReminder') };
      }
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e?.message || t('errorSavingReminder') };
    }
  };

  const handleDeleteReminder = (id: string) => {
    askDeleteConfirm(t('confirmDeleteReminder'), async () => {
      try {
        const res = await apiFetch(`/api/reminders/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (res.ok) {
          fetchAllData();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to delete reminder');
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleStatusChangeReminder = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/api/reminders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update reminder status');
      }
    } catch (e) {
      console.error(e);
    }
  };


  // INVOICE ACTIONS
  const handleSaveInvoice = async (data: Partial<Invoice>): Promise<SaveResult> => {
    try {
      let res;
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };

      if (data.id) {
        res = await apiFetch(`/api/invoices/${data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
      } else {
        res = await apiFetch('/api/invoices', {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        fetchAllData();
        return { success: true };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || err.message || 'Error saving invoice' };
      }
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e?.message || 'Error saving invoice' };
    }
  };

  const handleDeleteInvoice = (id: string) => {
    askDeleteConfirm(t('confirmDeleteInvoice'), async () => {
      try {
        const res = await apiFetch(`/api/invoices/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (res.ok) {
          fetchAllData();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to delete invoice');
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleUpdateInvoiceStatus = async (id: string, status: string, paymentDate?: string) => {
    try {
      const res = await apiFetch(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ status, paymentDate }),
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error('Error updating invoice status:', e);
    }
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
          if (tab === 'users') {
            setUsersFilterStatus('all');
          }
        }}
        onNavigateToPendingUsers={() => {
          setActiveTab('users');
          setUsersFilterStatus('pending');
        }}
        dashboardSubTab={dashboardSubTab}
        onDashboardSubTabChange={setDashboardSubTab}
        stats={stats}
        userPreferences={userPreferences}
        onPreferenceChange={updatePreference}
      >
        {activeTab === 'dashboard' && (
          <DashboardView
            dashboardSubTab={dashboardSubTab}
            stats={stats}
            projects={projects}
            clients={clients}
            users={users}
            categories={categories}
            services={services}
            reminders={reminders}
            invoices={invoices}
            onMarkSampled={handleMarkSampled}
            onToggleDone={handleToggleDone}
            onSaveReminder={handleSaveReminder}
            onDeleteReminder={handleDeleteReminder}
            onStatusChangeReminder={handleStatusChangeReminder}
            onViewProject={handleViewProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onNavigateToProjects={() => {
              setActiveTab('dashboard');
              setDashboardSubTab('projects');
            }}
            onOpenNewProject={() => {
              handleEditProject(null);
            }}
            quickFilters={userPreferences.quick_filter_dashboard_projects}
            onQuickFiltersChange={(filters) => updatePreference('quick_filter_dashboard_projects', filters)}
            quickFilterDashboardReminders={userPreferences.quick_filter_dashboard_reminders}
            onQuickFilterDashboardRemindersChange={(val) => updatePreference('quick_filter_dashboard_reminders', val)}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            services={services}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenNew={() => {
              handleEditProject(null);
            }}
            onToggleDone={handleToggleDone}
            onMarkSampled={handleMarkSampled}
            onView={handleViewProject}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            visibleColumns={userPreferences.cols_projects}
            onVisibleColumnsChange={(cols) => updatePreference('cols_projects', cols)}
            sortState={userPreferences.sort_projects}
            onSortChange={(sort) => updatePreference('sort_projects', sort)}
            quickFilter={userPreferences.quick_filter_projects || 'all'}
            onQuickFilterChange={(val) => updatePreference('quick_filter_projects', val)}
          />
        )}

        {isProjectViewModalOpen && currentViewingProject && (
          <ProjectViewModal
            isOpen={isProjectViewModalOpen}
            project={currentViewingProject}
            clients={clients}
            users={users}
            services={services}
            reminders={reminders}
            invoices={invoices}
            onClose={() => {
              setIsProjectViewModalOpen(false);
              setViewingProject(null);
            }}
            onEdit={handleEditProject}
            onSave={handleSaveProject}
            onToggleDone={handleToggleDone}
            onSaveReminder={handleSaveReminder}
            onDeleteReminder={handleDeleteReminder}
            onStatusChangeReminder={handleStatusChangeReminder}
            onSaveInvoice={handleSaveInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onStatusChangeInvoice={handleUpdateInvoiceStatus}
          />
        )}

        {isProjectModalOpen && (
          <ProjectModal
            isOpen={isProjectModalOpen}
            projectToEdit={editingProject}
            clients={clients}
            users={users}
            services={services}
            reminders={reminders}
            invoices={invoices}
            onClose={() => {
              setIsProjectModalOpen(false);
              setEditingProject(null);
            }}
            onSave={handleSaveProject}
            onDelete={handleDeleteProject}
            onToggleDone={handleToggleDone}
            onSaveReminder={handleSaveReminder}
            onDeleteReminder={handleDeleteReminder}
            onStatusChangeReminder={handleStatusChangeReminder}
            onSaveInvoice={handleSaveInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onStatusChangeInvoice={handleUpdateInvoiceStatus}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            clients={clients}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
            visibleColumns={userPreferences.cols_clients}
            onVisibleColumnsChange={(cols) => updatePreference('cols_clients', cols)}
            sortState={userPreferences.sort_clients}
            onSortChange={(sort) => updatePreference('sort_clients', sort)}
          />
        )}

        {activeTab === 'users' && (
          <UsersView
            users={users}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onApproveUser={handleApproveUser}
            onRejectUser={handleRejectUser}
            onForceLogoutUser={handleForceLogoutUser}
            visibleColumns={userPreferences.cols_users}
            onVisibleColumnsChange={(cols) => updatePreference('cols_users', cols)}
            sortState={userPreferences.sort_users}
            onSortChange={(sort) => updatePreference('sort_users', sort)}
            initialFilterStatus={usersFilterStatus}
            quickFilter={userPreferences.quick_filter_users || 'all'}
            onQuickFilterChange={(val) => updatePreference('quick_filter_users', val)}
          />
        )}

        {activeTab === 'services' && (
          <ServicesView
            services={services}
            categories={categories}
            onSaveService={handleSaveService}
            onDeleteService={handleDeleteService}
            visibleColumns={userPreferences.cols_services}
            onVisibleColumnsChange={(cols) => updatePreference('cols_services', cols)}
            sortState={userPreferences.sort_services}
            onSortChange={(sort) => updatePreference('sort_services', sort)}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            categories={categories}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            visibleColumns={userPreferences.cols_categories}
            onVisibleColumnsChange={(cols) => updatePreference('cols_categories', cols)}
            sortState={userPreferences.sort_categories}
            onSortChange={(sort) => updatePreference('sort_categories', sort)}
          />
        )}


        {activeTab === 'invoices' && (
          <InvoicesView
            invoices={invoices}
            clients={clients}
            projects={projects}
            onSaveInvoice={handleSaveInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onUpdateStatus={handleUpdateInvoiceStatus}
            visibleColumns={userPreferences.cols_invoices}
            onVisibleColumnsChange={(cols) => updatePreference('cols_invoices', cols)}
            sortState={userPreferences.sort_invoices}
            onSortChange={(sort) => updatePreference('sort_invoices', sort)}
          />
        )}
        {activeTab === 'reminders' && (
          <RemindersView
            reminders={reminders}
            projects={projects}
            clients={clients}
            users={users}
            onSaveReminder={handleSaveReminder}
            onDeleteReminder={handleDeleteReminder}
            onStatusChange={handleStatusChangeReminder}
            visibleColumns={userPreferences.cols_reminders}
            onVisibleColumnsChange={(cols) => updatePreference('cols_reminders', cols)}
            sortState={userPreferences.sort_reminders}
            onSortChange={(sort) => updatePreference('sort_reminders', sort)}
            quickFilter={userPreferences.quick_filter_reminders || 'all'}
            onQuickFilterChange={(val) => updatePreference('quick_filter_reminders', val)}
          />
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

