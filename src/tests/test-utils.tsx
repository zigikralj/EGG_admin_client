import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageContext } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { LoadingContext } from '../context/LoadingContext';
import { NotificationContext } from '../context/NotificationContext';
import { vi } from 'vitest';

export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Turn off retries for testing
    },
  },
});

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    queryClient = createTestQueryClient(),
    authValue = {
      currentUser: { id: 'user1', name: 'Test User', role: 'ADMIN', permissions: {} },
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn().mockReturnValue(true),
      canEditProject: vi.fn().mockReturnValue(true),
      canDeleteProject: vi.fn().mockReturnValue(true),
      isRestrictedToOwn: vi.fn().mockReturnValue(false),
      checkAuth: vi.fn(),
      status: 'authenticated' as const,
    },
    languageValue = {
      language: 'sr',
      setLanguage: vi.fn(),
      t: (key: string) => key,
      getServiceLabel: (type: string) => type,
      getErrorMessage: (err: string) => err,
      getResponsibleLabel: (key: string) => key,
      getPermitTypeLabel: (key: string) => key,
    },
    loadingValue = {
      isLoading: false,
      loadingMessage: '',
      isServerWakingUp: false,
      elapsedSeconds: 0,
      showLoading: vi.fn(),
      hideLoading: vi.fn(),
      withLoading: vi.fn().mockImplementation((fn) => fn()),
    },
    notificationValue = {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      fetchNotifications: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteNotification: vi.fn(),
      clearAllNotifications: vi.fn(),
    },
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LanguageContext.Provider value={languageValue as any}>
        <AuthContext.Provider value={authValue as any}>
          <LoadingContext.Provider value={loadingValue as any}>
            <NotificationContext.Provider value={notificationValue as any}>
              {children}
            </NotificationContext.Provider>
          </LoadingContext.Provider>
        </AuthContext.Provider>
      </LanguageContext.Provider>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
};
