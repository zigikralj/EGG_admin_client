import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WasteDisposalPanel } from './WasteDisposalPanel';
import { renderWithProviders } from '../../tests/test-utils';
import type { Client, Project, Service } from '../../types';
import * as api from '../../api';

describe('WasteDisposalPanel - Client and Project / Location reactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockServices: Service[] = [
    {
      id: 'srv-waste-1',
      code: 'waste-disposal',
      name: 'Waste Disposal Service',
      group: 'Waste',
      frequency: 1,
    },
  ];

  const mockClients: Client[] = [
    {
      id: 'c-1',
      name: 'Client Alpha',
      city: 'Kraljevo',
    },
    {
      id: 'c-2',
      name: 'Client Beta',
      city: 'Beograd',
    },
    {
      id: 'c-3',
      name: 'Client Gamma',
      city: 'Novi Sad',
    },
  ];

  const mockProjects: Project[] = [
    {
      id: 'p-1',
      name: 'Alpha Project 1',
      clientId: 'c-1',
      clientName: 'Client Alpha',
      type: 'Waste',
      responsible: 'Admin',
      progress: 0,
      done: false,
      start: null,
      deadline: null,
    },
    {
      id: 'p-2',
      name: 'Beta Project 1',
      clientId: 'c-2',
      clientName: 'Client Beta',
      type: 'Waste',
      responsible: 'Admin',
      progress: 0,
      done: false,
      start: null,
      deadline: null,
    },
    {
      id: 'p-3',
      name: 'Beta Project 2',
      clientId: 'c-2',
      clientName: 'Client Beta',
      type: 'Waste',
      responsible: 'Admin',
      progress: 0,
      done: false,
      start: null,
      deadline: null,
    },
  ];

  it('updates location and projects when selecting and changing client in new dialog', async () => {
    const fetchSpy = vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/clients')) {
        const parsed = new URL(urlStr, 'http://localhost');
        const search = parsed.searchParams.get('search')?.toLowerCase() || '';
        const filtered = search
          ? mockClients.filter((c) => c.name.toLowerCase().includes(search))
          : mockClients;
        return {
          ok: true,
          json: async () => ({
            items: filtered,
            total: filtered.length,
            hasMore: false,
          }),
        } as any;
      }
      if (urlStr.includes('/api/projects')) {
        const parsed = new URL(urlStr, 'http://localhost');
        const clientId = parsed.searchParams.get('clientId');
        const search = parsed.searchParams.get('search')?.toLowerCase() || '';
        let filtered = clientId
          ? mockProjects.filter((p) => p.clientId === clientId)
          : mockProjects;
        if (search) {
          filtered = filtered.filter((p) => p.name.toLowerCase().includes(search));
        }
        return {
          ok: true,
          json: async () => ({
            items: filtered,
            total: filtered.length,
            hasMore: false,
          }),
        } as any;
      }
      return {
        ok: true,
        json: async () => ({ items: [], total: 0, hasMore: false }),
      } as any;
    });

    renderWithProviders(
      <WasteDisposalPanel
        services={mockServices}
        clients={mockClients}
        projects={mockProjects}
        openNewTrigger={1}
      />
    );

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const clientInput = screen.getByLabelText(/client/i);
    const locationInput = screen.getByLabelText(/location/i) as HTMLInputElement;
    const projectInput = screen.getByLabelText(/project/i) as HTMLInputElement;

    expect(locationInput.value).toBe('');
    expect(projectInput.value).toBe('');

    // 1. Select Client Alpha (city: Kraljevo, 1 project: Alpha Project 1)
    fireEvent.focus(clientInput);
    fireEvent.keyDown(clientInput, { key: 'ArrowDown' });
    const optionAlpha = await screen.findByText('Client Alpha');
    fireEvent.click(optionAlpha);

    // Location should update to Kraljevo, and Project should auto-select Alpha Project 1
    await waitFor(() => {
      expect(locationInput.value).toBe('Kraljevo');
      expect(projectInput.value).toBe('Alpha Project 1');
    });

    // 2. Change Client to Client Beta (city: Beograd, 2 projects: Beta Project 1, Beta Project 2)
    fireEvent.focus(clientInput);
    fireEvent.keyDown(clientInput, { key: 'ArrowDown' });
    const optionBeta = await screen.findByText('Client Beta');
    fireEvent.click(optionBeta);

    // Location should update to Beograd, and Project should reset since Beta has multiple projects
    await waitFor(() => {
      expect(locationInput.value).toBe('Beograd');
      expect(projectInput.value).toBe('');
    });

    // 3. Change Client to Client Gamma (city: Novi Sad, 0 projects)
    fireEvent.focus(clientInput);
    fireEvent.keyDown(clientInput, { key: 'ArrowDown' });
    const optionGamma = await screen.findByText('Client Gamma');
    fireEvent.click(optionGamma);

    await waitFor(() => {
      expect(locationInput.value).toBe('Novi Sad');
      expect(projectInput.value).toBe('');
    });

    fetchSpy.mockRestore();
  });

  it('renders server-side paginated items and reports totalCount', async () => {
    const onTotalCountChange = vi.fn();
    const mockPaginatedResponse = {
      items: [
        {
          id: 'ps-101',
          serviceId: 'srv-waste-1',
          service: { id: 'srv-waste-1', code: 'waste-disposal', name: 'Waste Disposal Srv' },
          clientId: 'c-1',
          client: { id: 'c-1', name: 'Client Alpha', city: 'Kraljevo' },
          projectId: 'p-1',
          project: { id: 'p-1', name: 'Alpha Project 1' },
          status: 'Planned',
          scheduledDate: '2026-11-01T00:00:00.000Z',
          location: 'Kraljevo Site',
        },
      ],
      total: 42,
      page: 1,
      limit: 10,
      totalPages: 5,
      hasMore: true,
    };

    const fetchSpy = vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/provided-services')) {
        return {
          ok: true,
          json: async () => mockPaginatedResponse,
        } as any;
      }
      return {
        ok: true,
        json: async () => [],
      } as any;
    });

    renderWithProviders(
      <WasteDisposalPanel onTotalCountChange={onTotalCountChange} />
    );

    await waitFor(() => {
      expect(screen.getByText('waste-disposal')).toBeInTheDocument();
      expect(screen.getByText('• Client Alpha')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(onTotalCountChange).toHaveBeenCalledWith(42);
    });

    fetchSpy.mockRestore();
  });

  it('when opening new dialog, fetches targeted waste disposal service, auto-selects it, and sets readOnly', async () => {
    const wasteDisposalService: Service = {
      id: 'srv-wd-auto',
      code: 'waste-disposal',
      name: 'Odlaganje otpada',
      group: 'Waste',
      frequency: 0,
    };

    const requestedUrls: string[] = [];
    const fetchSpy = vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      requestedUrls.push(urlStr);

      if (urlStr.includes('/api/services') && urlStr.includes('search=')) {
        return {
          ok: true,
          json: async () => ({
            items: [wasteDisposalService],
            total: 1,
            hasMore: false,
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

    renderWithProviders(
      <WasteDisposalPanel
        openNewTrigger={1}
      />
    );

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Targeted search should have been executed
    await waitFor(() => {
      expect(requestedUrls.some((u) => u.includes('/api/services') && u.includes('search='))).toBe(true);
    });

    // Bare /api/services (fetching all services) must NOT have been called
    expect(requestedUrls.some((u) => u === '/api/services' || u.endsWith('/api/services'))).toBe(false);

    // Autocomplete should have auto-selected the waste disposal service and be read-only
    const serviceInput = screen.getByLabelText(/service|usluga/i) as HTMLInputElement;
    await waitFor(() => {
      expect(serviceInput).toHaveAttribute('readonly');
      expect(serviceInput.value).toBe('Odlaganje otpada');
    });

    fetchSpy.mockRestore();
  });

  it('when opening new dialog and waste disposal service is not found, leaves autocomplete editable and empty', async () => {
    const requestedUrls: string[] = [];
    const fetchSpy = vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      requestedUrls.push(urlStr);

      if (urlStr.includes('/api/services') && urlStr.includes('search=')) {
        return {
          ok: true,
          json: async () => ({
            items: [],
            total: 0,
            hasMore: false,
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

    renderWithProviders(
      <WasteDisposalPanel
        openNewTrigger={1}
      />
    );

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Targeted search should have been executed
    await waitFor(() => {
      expect(requestedUrls.some((u) => u.includes('/api/services') && u.includes('search='))).toBe(true);
    });

    // Bare /api/services (fetching all services) must NOT have been called
    expect(requestedUrls.some((u) => u === '/api/services' || u.endsWith('/api/services'))).toBe(false);

    // Autocomplete should NOT be read-only and value should be empty
    const serviceInput = screen.getByLabelText(/service|usluga/i) as HTMLInputElement;
    await waitFor(() => {
      expect(serviceInput).not.toHaveAttribute('readonly');
      expect(serviceInput.value).toBe('');
    });

    fetchSpy.mockRestore();
  });
});


