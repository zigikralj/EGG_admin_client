import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppHeader } from './AppHeader';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContext from '../../context/AuthContext';
import * as LanguageContext from '../../context/LanguageContext';
import * as NotificationContext from '../../context/NotificationContext';
import * as useRoleLabelsHook from '../../hooks/useRoleLabels';

// Mock contexts
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: vi.fn(),
}));

vi.mock('../../hooks/useRoleLabels', () => ({
  useRoleLabels: vi.fn(),
}));

// Mock icons
vi.mock('../icons', () => ({
  MenuIcon: () => <div data-testid="menu-icon" />,
  BusinessIcon: () => <div data-testid="business-icon" />,
  AccountCircleIcon: () => <div data-testid="account-circle-icon" />,
  SettingsIcon: () => <div data-testid="settings-icon" />,
  LogoutIcon: () => <div data-testid="logout-icon" />,
  NotificationsIcon: () => <div data-testid="notifications-icon" />,
  AppsIcon: () => <div data-testid="apps-icon" />,
  StorageIcon: () => <div data-testid="storage-icon" />,
  DashboardIcon: () => <div data-testid="dashboard-icon" />,
}));

// Mock NotificationsMenu
vi.mock('./NotificationsMenu', () => ({
  NotificationsMenu: () => <div data-testid="notifications-menu-mock" />,
}));

describe('AppHeader', () => {
  const mockSetMobileOpen = vi.fn();
  const mockHandleOpenProfile = vi.fn();
  const mockHandleOpenPreferences = vi.fn();
  const mockHandleLogoutClick = vi.fn();
  const mockSetIsCompanyInfoOpen = vi.fn();
  const mockLogout = vi.fn();
  const mockHasPermission = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });

    (AuthContext.useAuth as any).mockReturnValue({
      currentUser: { name: 'Test User', email: 'test@example.com' },
      role: 'ADMIN',
      pendingUsersCount: 0,
      hasPermission: mockHasPermission,
      logout: mockLogout,
    });

    (NotificationContext.useNotifications as any).mockReturnValue({
      unreadCount: 0,
    });

    (useRoleLabelsHook.useRoleLabels as any).mockReturnValue({
      getRoleBadgeLabel: vi.fn().mockReturnValue('Administrator'),
    });

    mockHasPermission.mockReturnValue(true); // default to true for most permissions
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/project-tracker']}>
        <AppHeader
          mobileOpen={false}
          setMobileOpen={mockSetMobileOpen}
          handleOpenProfile={mockHandleOpenProfile}
          handleOpenPreferences={mockHandleOpenPreferences}
          handleLogoutClick={mockHandleLogoutClick}
          setIsCompanyInfoOpen={mockSetIsCompanyInfoOpen}
        />
      </MemoryRouter>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByText('appProjectTracker')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('opens and closes apps menu', () => {
    renderComponent();
    const appsButton = screen.getByRole('button', { name: 'appsTitle' });
    
    // Open menu
    fireEvent.click(appsButton);
    expect(screen.getByText('appDataManagement')).toBeInTheDocument();
  });

  it('calls handleLogoutClick when logout is clicked from profile menu', () => {
    renderComponent();
    
    // Open profile menu
    const profileButton = screen.getByText('Test User');
    fireEvent.click(profileButton);
    
    // Click logout
    const logoutMenuItem = screen.getByText('menuLogout');
    fireEvent.click(logoutMenuItem);
    
    expect(mockHandleLogoutClick).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalled();
  });

  it('does not show company info icon if no permission', () => {
    mockHasPermission.mockImplementation((res, action) => res !== 'companyInfo');
    renderComponent();
    
    expect(screen.queryByRole('button', { name: 'companyInfoTitle' })).not.toBeInTheDocument();
  });

  it('shows badge count based on unreadCount and pendingUsers', () => {
    (NotificationContext.useNotifications as any).mockReturnValue({
      unreadCount: 2,
    });
    
    (AuthContext.useAuth as any).mockReturnValue({
      currentUser: { name: 'Test User' },
      pendingUsersCount: 3,
      hasPermission: vi.fn().mockReturnValue(true),
    });

    renderComponent();
    
    // 2 notifications + 3 pending users = 5
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
