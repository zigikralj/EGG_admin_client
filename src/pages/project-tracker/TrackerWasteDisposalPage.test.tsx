import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrackerWasteDisposalPage from './TrackerWasteDisposalPage';
import { renderWithProviders } from '../../tests/test-utils';
import { PAGE_ROUTES } from '../../constants';
import * as api from '../../api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('TrackerWasteDisposalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, count chip, and uses joined waste_disposal_service without requesting /api/services', async () => {
    const fetchSpy = vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/system-settings')) {
        return {
          ok: true,
          json: async () => ({
            waste_disposal_service_id: 'srv-joined-789',
            waste_disposal_service: {
              id: 'srv-joined-789',
              name: 'Joined Waste Service',
              code: 'waste-disposal',
            },
          }),
        } as any;
      }
      if (urlStr.includes('/api/provided-services')) {
        return {
          ok: true,
          json: async () => ({ items: [], total: 0, hasMore: false }),
        } as any;
      }
      return {
        ok: true,
        json: async () => [],
      } as any;
    });

    renderWithProviders(<TrackerWasteDisposalPage />);

    await waitFor(() => {
      expect(screen.getByText('subTabWasteDisposal')).toBeInTheDocument();
      const newBtn = screen.getByRole('button', { name: /btnNewWasteDisposal/i });
      expect(newBtn).toBeEnabled();
    });

    expect(screen.queryByText('wasteServiceUnconfiguredHint')).not.toBeInTheDocument();
    const serviceCalls = fetchSpy.mock.calls.filter(([url]) => String(url).includes('/api/services'));
    expect(serviceCalls.length).toBe(0);
  });

  it('shows unconfigured hint alert and System Settings navigation button for users with systemSettings.edit', async () => {
    vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/system-settings')) {
        return { ok: true, json: async () => ({}) } as any;
      }
      if (urlStr.includes('/api/provided-services')) {
        return { ok: true, json: async () => ({ items: [], total: 0, hasMore: false }) } as any;
      }
      return { ok: true, json: async () => [] } as any;
    });

    renderWithProviders(<TrackerWasteDisposalPage />, {
      authValue: {
        currentUser: { id: 'ops-1', name: 'Ops User', role: 'Ops', roleLevel: 40, permissions: {} },
        role: 'Ops',
        actualRole: 'Ops',
        roleLevel: 40,
        hasMinRoleLevel: vi.fn().mockReturnValue(false),
        isRealAdmin: false,
        hasPermission: vi.fn((res: string, act: string) => res === 'systemSettings' && act === 'edit'),
        canEditProject: vi.fn().mockReturnValue(true),
        canDeleteProject: vi.fn().mockReturnValue(false),
        isRestrictedToOwn: vi.fn().mockReturnValue(false),
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn(),
        status: 'authenticated' as const,
      },
    });

    expect(await screen.findByText('wasteServiceUnconfiguredHint')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /btnNewWasteDisposal/i })).toBeDisabled();

    const settingsBtn = screen.getByRole('button', { name: 'goToSystemSettings' });
    fireEvent.click(settingsBtn);
    expect(mockNavigate).toHaveBeenCalledWith(PAGE_ROUTES.SYSTEM_SETTINGS);
  });

  it('hides System Settings button in unconfigured alert when user lacks systemSettings.edit', async () => {
    vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/system-settings')) {
        return { ok: true, json: async () => ({}) } as any;
      }
      if (urlStr.includes('/api/provided-services')) {
        return { ok: true, json: async () => ({ items: [], total: 0, hasMore: false }) } as any;
      }
      return { ok: true, json: async () => [] } as any;
    });

    renderWithProviders(<TrackerWasteDisposalPage />, {
      authValue: {
        currentUser: { id: 'user-1', name: 'Regular User', role: 'User', roleLevel: 10, permissions: {} },
        role: 'User',
        actualRole: 'User',
        roleLevel: 10,
        hasMinRoleLevel: vi.fn().mockReturnValue(false),
        isRealAdmin: false,
        hasPermission: vi.fn((res: string) => res !== 'systemSettings'),
        canEditProject: vi.fn().mockReturnValue(false),
        canDeleteProject: vi.fn().mockReturnValue(false),
        isRestrictedToOwn: vi.fn().mockReturnValue(false),
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn(),
        status: 'authenticated' as const,
      },
    });

    expect(await screen.findByText('wasteServiceUnconfiguredHint')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'goToSystemSettings' })).not.toBeInTheDocument();
  });
});
