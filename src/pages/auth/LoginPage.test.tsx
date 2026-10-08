import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('LoginPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => {
    return renderWithProviders(
      <LoginPage />,
      {
        authValue: {
          currentUser: { id: 'user1', name: 'Test User', role: 'ADMIN', permissions: {} },
          login: vi.fn().mockResolvedValue({ success: true }),
          register: vi.fn().mockResolvedValue({ success: true }),
          logout: vi.fn(),
          hasPermission: vi.fn().mockReturnValue(true),
          canEditProject: vi.fn().mockReturnValue(true),
          canDeleteProject: vi.fn().mockReturnValue(true),
          isRestrictedToOwn: vi.fn().mockReturnValue(false),
          checkAuth: vi.fn(),
          status: 'authenticated' as const,
        } as any
      }
    );
  };

  it('renders login tab by default', () => {
    renderPage();
    expect(screen.getByText('tabLogin')).toBeInTheDocument();
  });

  it('can switch to register tab', () => {
    renderPage();
    const registerTab = screen.getByText('tabRegister');
    fireEvent.click(registerTab);
    expect(screen.getByText('btnRegister')).toBeInTheDocument();
  });

  it('handles login form submission', async () => {
    renderPage();
    
    // Fill form
    const identifierInput = screen.getByPlaceholderText('phEmailOrUsername');
    const passwordInput = screen.getByPlaceholderText('phPassword');

    fireEvent.change(identifierInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit
    const loginButton = screen.getByText('btnLogin');
    fireEvent.click(loginButton);

    // Wait for the mock API response and loading overlay to close or UI update
    await waitFor(() => {
      // It shouldn't crash
      expect(loginButton).not.toBeDisabled();
    });
  });
});
