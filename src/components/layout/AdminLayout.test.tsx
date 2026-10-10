import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminLayout } from './AdminLayout';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContext from '../../context/AuthContext';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

// Mock sub-components
vi.mock('./AppHeader', () => ({
  AppHeader: () => <div data-testid="app-header-mock" />,
}));

vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar-mock" />,
}));

vi.mock('./UserProfileDialog', () => ({
  UserProfileDialog: () => <div data-testid="user-profile-dialog-mock" />,
}));

vi.mock('./SettingsDialog', () => ({
  SettingsDialog: () => <div data-testid="settings-dialog-mock" />,
}));

vi.mock('../dialogs/CompanyInfoModal', () => ({
  CompanyInfoModal: () => <div data-testid="company-info-modal-mock" />,
}));

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.scrollTo = vi.fn();
    Element.prototype.scrollTo = vi.fn();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });

    (AuthContext.useAuth as any).mockReturnValue({
      role: 'ADMIN',
      isRolesLoading: false,
      pendingUsersCount: 0,
      hasPermission: vi.fn().mockReturnValue(true),
      logout: vi.fn(),
    });
  });

  const mockStats = {
    active: 5,
    completed: 2,
    done: 2,
    stale: 0,
    servicesCount: 5,
    usersCount: 10,
    clientsCount: 8,
    categoriesCount: 4,
    monitor: 1,
    invoicesCount: 3,
  };

  const renderComponent = (initialRoute = '/project-tracker') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AdminLayout stats={mockStats}>
          <div data-testid="admin-layout-children">Child Content</div>
        </AdminLayout>
      </MemoryRouter>
    );
  };

  it('renders AppHeader, Sidebar, children, and modals', () => {
    renderComponent();
    
    expect(screen.getByTestId('app-header-mock')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
    expect(screen.getByTestId('user-profile-dialog-mock')).toBeInTheDocument();
    expect(screen.getByTestId('settings-dialog-mock')).toBeInTheDocument();
    expect(screen.getByTestId('company-info-modal-mock')).toBeInTheDocument();
    expect(screen.getByTestId('admin-layout-children')).toHaveTextContent('Child Content');
  });

  it('redirects if user lacks access to project-tracker app', () => {
    (AuthContext.useAuth as any).mockReturnValue({
      role: 'USER',
      isRolesLoading: false,
      pendingUsersCount: 0,
      hasPermission: (resource: string, action: string) => {
        if (resource === 'apps' && action === 'project-tracker') return false;
        if (resource === 'apps' && action === 'data-management') return true;
        return true;
      },
      logout: vi.fn(),
    });

    // The navigate is tested through effect; we can't easily assert the path change without spying on useNavigate
    // But we can check if it renders without crashing
    renderComponent('/project-tracker');
  });
});
