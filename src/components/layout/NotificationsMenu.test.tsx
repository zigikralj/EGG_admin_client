import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsMenu } from './NotificationsMenu';
import * as AuthContext from '../../context/AuthContext';
import * as LanguageContext from '../../context/LanguageContext';
import * as NotificationContext from '../../context/NotificationContext';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotificationsMenu', () => {
  const mockOnClose = vi.fn();
  const mockOnOpenProject = vi.fn();
  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();
  const mockClearAllNotifications = vi.fn();
  const mockDeleteNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });

    (AuthContext.useAuth as any).mockReturnValue({
      pendingUsersCount: 0,
      hasPermission: vi.fn().mockReturnValue(true),
    });

    (NotificationContext.useNotifications as any).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
      clearAllNotifications: mockClearAllNotifications,
    });
  });

  const renderComponent = () => {
    // Create a dummy element to act as anchorEl
    const anchor = document.createElement('button');
    return render(
      <MemoryRouter>
        <NotificationsMenu
          anchorEl={anchor}
          isOpen={true}
          onClose={mockOnClose}
          onOpenProject={mockOnOpenProject}
        />
      </MemoryRouter>
    );
  };

  it('renders empty state when no notifications', () => {
    renderComponent();
    expect(screen.getByText('noNotifications')).toBeInTheDocument();
  });

  it('renders pending users notification if present', () => {
    (AuthContext.useAuth as any).mockReturnValue({
      pendingUsersCount: 2,
      hasPermission: vi.fn().mockReturnValue(true),
    });
    
    renderComponent();
    
    expect(screen.getByText('menuPendingUsers')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    
    // Click on pending users
    fireEvent.click(screen.getByText('menuPendingUsers'));
    
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/data-management/users');
  });

  it('renders notifications and handles click', async () => {
    (NotificationContext.useNotifications as any).mockReturnValue({
      notifications: [
        {
          id: 'notif-1',
          read: false,
          authorName: 'Test User',
          createdAt: new Date().toISOString(),
          message: 'Test message',
          projectId: 'proj-1',
          project: { name: 'Test Project' },
        },
      ],
      unreadCount: 1,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
      clearAllNotifications: mockClearAllNotifications,
    });

    renderComponent();
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    
    // Click notification
    fireEvent.click(screen.getByText('Test message'));
    
    // The click handler is async, wait for it
    await vi.waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnOpenProject).toHaveBeenCalledWith('proj-1');
    });
  });
});
