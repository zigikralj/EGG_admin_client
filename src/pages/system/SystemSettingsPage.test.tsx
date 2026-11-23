import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SystemSettingsPage from './SystemSettingsPage';
import { renderWithProviders } from '../../tests/test-utils';
import * as api from '../../api';

const makeAuth = (permFn: (res: string, act: string) => boolean, isRealAdmin = false) => ({
  currentUser: {
    id: isRealAdmin ? 'admin-1' : 'user-1',
    name: isRealAdmin ? 'Admin User' : 'Scoped User',
    role: isRealAdmin ? 'Administrator' : 'Operator',
    roleLevel: isRealAdmin ? 100 : 40,
    permissions: {},
  },
  role: isRealAdmin ? 'Administrator' : 'Operator',
  actualRole: isRealAdmin ? 'Administrator' : 'Operator',
  roleLevel: isRealAdmin ? 100 : 40,
  hasMinRoleLevel: vi.fn().mockReturnValue(isRealAdmin),
  isRealAdmin,
  hasPermission: vi.fn(permFn),
  canEditProject: vi.fn().mockReturnValue(isRealAdmin),
  canDeleteProject: vi.fn().mockReturnValue(isRealAdmin),
  isRestrictedToOwn: vi.fn().mockReturnValue(false),
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  status: 'authenticated' as const,
});

describe('SystemSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays joined waste_disposal_service without requesting /api/services and updates via PUT when edited', async () => {
    const fetchSpy = vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any, options?: any) => {
      const urlStr = String(url);
      const method = options?.method || 'GET';

      if (urlStr.includes('/api/system-settings/waste_disposal_service_id') && method === 'PUT') {
        return {
          ok: true,
          json: async () => ({ key: 'waste_disposal_service_id', value: 'srv-new-2' }),
        } as any;
      }
      if (urlStr.includes('/api/system-settings')) {
        return {
          ok: true,
          json: async () => ({
            waste_disposal_service_id: 'srv-joined-1',
            waste_disposal_service: {
              id: 'srv-joined-1',
              name: 'Joined Waste Disposal',
              code: 'waste-disposal',
            },
          }),
        } as any;
      }
      if (urlStr.includes('/api/activity-logs/status')) {
        return {
          ok: true,
          json: async () => ({ enabled: true, retentionDays: 30 }),
        } as any;
      }
      if (urlStr.includes('/api/services')) {
        return {
          ok: true,
          json: async () => ({
            items: [
              { id: 'srv-joined-1', name: 'Joined Waste Disposal', code: 'waste-disposal' },
              { id: 'srv-new-2', name: 'Hazardous Recovery', code: 'haz-rec' },
            ],
            total: 2,
            hasMore: false,
          }),
        } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    renderWithProviders(<SystemSettingsPage />, {
      authValue: makeAuth((res, act) => res === 'systemSettings' && (act === 'view' || act === 'edit')),
    });

    const serviceInput = (await screen.findByLabelText(/lblSelectedWasteService/i)) as HTMLInputElement;
    await waitFor(() => {
      expect(serviceInput.value).toBe('Joined Waste Disposal');
    });
    expect(serviceInput).not.toBeDisabled();

    // Joined service must not trigger initial /api/services GET
    expect(fetchSpy.mock.calls.filter(([u]) => String(u).includes('/api/services'))).toHaveLength(0);

    // Open dropdown to select another service
    fireEvent.mouseDown(serviceInput);
    const option = await screen.findByText('Hazardous Recovery');
    fireEvent.click(option);

    await waitFor(() => {
      const putCall = fetchSpy.mock.calls.find(
        ([u, opts]) =>
          String(u).includes('/api/system-settings/waste_disposal_service_id') &&
          (opts as any)?.method === 'PUT'
      );
      expect(putCall).toBeDefined();
      expect((putCall![1] as any).body).toBe(JSON.stringify({ value: 'srv-new-2' }));
    });
  });

  it('disables Waste selector and Activity controls when user only has systemSettings.view', async () => {
    vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/system-settings')) {
        return {
          ok: true,
          json: async () => ({
            waste_disposal_service_id: 'srv-joined-1',
            waste_disposal_service: {
              id: 'srv-joined-1',
              name: 'Joined Waste Disposal',
              code: 'waste-disposal',
            },
          }),
        } as any;
      }
      if (urlStr.includes('/api/activity-logs/status')) {
        return { ok: true, json: async () => ({ enabled: true, retentionDays: 60 }) } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    renderWithProviders(<SystemSettingsPage />, {
      authValue: makeAuth((res, act) => res === 'systemSettings' && act === 'view'),
    });

    const serviceInput = (await screen.findByLabelText(/lblSelectedWasteService/i)) as HTMLInputElement;
    expect(serviceInput).toBeDisabled();

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeDisabled();

    const retentionCombobox = screen.getByLabelText('activityLogsRetention');
    expect(retentionCombobox).toHaveAttribute('aria-disabled', 'true');
  });

  it('opens deactivation confirm dialog on activity logging switch off and patches status + retention with activityLogs.configure', async () => {
    const fetchSpy = vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any, options?: any) => {
      const urlStr = String(url);
      const method = options?.method || 'GET';
      if (urlStr.includes('/api/activity-logs/status') && method === 'PATCH') {
        return {
          ok: true,
          json: async () => ({ enabled: false, retentionDays: 90 }),
        } as any;
      }
      if (urlStr.includes('/api/activity-logs/status')) {
        return {
          ok: true,
          json: async () => ({ enabled: true, retentionDays: 30 }),
        } as any;
      }
      if (urlStr.includes('/api/system-settings')) {
        return { ok: true, json: async () => ({}) } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    renderWithProviders(<SystemSettingsPage />, {
      authValue: makeAuth((res, act) => res === 'activityLogs' && act === 'configure'),
    });

    // Wait until status finishes loading so controls are enabled
    const switchEl = await screen.findByRole('switch');
    await waitFor(() => {
      expect(switchEl).not.toBeDisabled();
    });

    // Waste section is hidden without systemSettings.view/edit
    expect(screen.queryByLabelText(/lblSelectedWasteService/i)).not.toBeInTheDocument();

    // Switching off opens deactivation confirmation dialog
    fireEvent.click(switchEl);
    expect(await screen.findByText('activityLogsDeactivateTitle')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'btnDeactivate' }));
    await waitFor(() => {
      const patchCall = fetchSpy.mock.calls.find(
        ([u, opts]) =>
          String(u).includes('/api/activity-logs/status') && (opts as any)?.method === 'PATCH'
      );
      expect(patchCall).toBeDefined();
      expect((patchCall![1] as any).body).toBe(JSON.stringify({ enabled: false }));
    });

    // Update retention period
    const retentionCombobox = screen.getByLabelText('activityLogsRetention');
    expect(retentionCombobox).not.toHaveAttribute('aria-disabled', 'true');
    fireEvent.mouseDown(retentionCombobox);
    const ninetyDaysOption = await screen.findByText('retention90Days');
    fireEvent.click(ninetyDaysOption);

    await waitFor(() => {
      const retentionPatch = fetchSpy.mock.calls.find(
        ([u, opts]) =>
          String(u).includes('/api/activity-logs/status') &&
          (opts as any)?.method === 'PATCH' &&
          (opts as any)?.body === JSON.stringify({ retentionDays: 90 })
      );
      expect(retentionPatch).toBeDefined();
    });
  });

  it('renders access-denied alert when user lacks both systemSettings and activityLogs.configure', () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue({ ok: true, json: async () => ({}) } as any);

    renderWithProviders(<SystemSettingsPage />, {
      authValue: makeAuth(() => false),
    });

    expect(screen.getByRole('alert')).toHaveTextContent('activityLogsAdminOnly');
  });
});
