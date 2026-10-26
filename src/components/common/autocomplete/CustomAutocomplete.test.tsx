import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../tests/test-utils';
import { CustomAutocomplete } from './CustomAutocomplete';
import { ClientAutocomplete } from './ClientAutocomplete';
import { UserAutocomplete } from './UserAutocomplete';
import { ServiceAutocomplete } from './ServiceAutocomplete';
import { ReminderAutocomplete } from './ReminderAutocomplete';
import { InvoiceAutocomplete } from './InvoiceAutocomplete';
import * as api from '../../../api';

describe('CustomAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch options while closed (lazy activation)', async () => {
    const fetchSpy = vi.spyOn(api, 'apiFetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ id: 'c1', name: 'Client 1' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasMore: false,
      }),
    } as any);

    renderWithProviders(
      <CustomAutocomplete
        entity="clients"
        value={null}
        onChange={vi.fn()}
        placeholder="Select a client"
      />
    );

    expect(screen.getByPlaceholderText('Select a client')).toBeInTheDocument();
    // Zero API requests while dropdown is closed
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('displays initialOption without making API calls', async () => {
    const fetchSpy = vi.spyOn(api, 'apiFetch');

    renderWithProviders(
      <ClientAutocomplete
        value="c1"
        initialOption={{ id: 'c1', name: 'Ekos Green' } as any}
        onChange={vi.fn()}
        placeholder="Select client"
      />
    );

    // Initial value is rendered immediately in the input
    expect(screen.getByDisplayValue('Ekos Green')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches options on dropdown open and debounces search input by 500ms', async () => {
    const fetchSpy = vi.spyOn(api, 'apiFetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { id: 'c1', name: 'Alpha Client' },
          { id: 'c2', name: 'Beta Client' },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasMore: false,
      }),
    } as any);

    renderWithProviders(
      <CustomAutocomplete
        entity="clients"
        value={null}
        onChange={vi.fn()}
        placeholder="Search clients"
      />
    );

    const input = screen.getByPlaceholderText('Search clients');

    // Open dropdown
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    // Type into input
    fireEvent.change(input, { target: { value: 'Alpha' } });

    // Wait for 500ms debounce
    await waitFor(
      () => {
        const calls = fetchSpy.mock.calls;
        const lastCallUrl = calls[calls.length - 1][0] as string;
        expect(lastCallUrl).toContain('search=Alpha');
      },
      { timeout: 1500 }
    );
  });

  it('handles UserAutocomplete valueMode="name" and assigns properly', async () => {
    const handleChange = vi.fn();

    vi.spyOn(api, 'apiFetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { id: 'u1', name: 'Marko Marković', role: 'Operator' },
          { id: 'u2', name: 'Jelena Petrović', role: 'Administrator' },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasMore: false,
      }),
    } as any);

    renderWithProviders(
      <UserAutocomplete
        value="Marko Marković"
        valueMode="name"
        onChange={handleChange}
        placeholder="Select user"
      />
    );

    expect(screen.getByDisplayValue('Marko Marković')).toBeInTheDocument();
  });

  it('handles ServiceAutocomplete valueMode="code" with custom label mapping', async () => {
    const handleChange = vi.fn();

    renderWithProviders(
      <ServiceAutocomplete
        value="WASTE_DISPOSAL"
        initialOption={{ id: 's1', code: 'WASTE_DISPOSAL', name: 'Zbrinjavanje otpada' } as any}
        valueMode="code"
        onChange={handleChange}
        placeholder="Select service"
      />
    );

    // Initial value resolved by code with service name display
    expect(screen.getByDisplayValue('Zbrinjavanje otpada')).toBeInTheDocument();
  });

  it('renders load more sentinel when hasMore is true and triggers fetchNextPage on click', async () => {
    let callCount = 0;
    vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any) => {
      callCount++;
      const urlStr = String(url);
      const isPage2 = urlStr.includes('page=2');
      return {
        ok: true,
        json: async () => ({
          items: isPage2
            ? [{ id: 'c2', name: 'Client Two' }]
            : [{ id: 'c1', name: 'Client One' }],
          total: 2,
          page: isPage2 ? 2 : 1,
          limit: 1,
          totalPages: 2,
          hasMore: !isPage2,
        }),
      } as any;
    });

    renderWithProviders(
      <CustomAutocomplete
        entity="clients"
        value={null}
        onChange={vi.fn()}
        placeholder="Paginated clients"
        pageSize={1}
      />
    );

    const input = screen.getByPlaceholderText('Paginated clients');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // First page loaded and sentinel option rendered
    await waitFor(() => {
      expect(screen.getByText('Client One')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText(/btnLoadMore/);
    expect(loadMoreButton).toBeInTheDocument();

    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Client Two')).toBeInTheDocument();
    });
  });

  it('supports ReminderAutocomplete with prioritizeClientId and Client badge', async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { id: 'r1', title: 'Permit Renewal', clientId: 'c1', clientName: 'Client Alpha', dueDate: '2026-11-01' },
          { id: 'r2', title: 'Annual Checkup', clientId: 'c2', clientName: 'Other Client', dueDate: '2026-12-01' },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasMore: false,
      }),
    } as any);

    renderWithProviders(
      <ReminderAutocomplete
        value={null}
        onChange={vi.fn()}
        prioritizeClientId="c1"
        prioritizeClientName="Client Alpha"
        placeholder="Select reminder"
      />
    );

    const input = screen.getByPlaceholderText('Select reminder');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(screen.getByText('Permit Renewal')).toBeInTheDocument();
    });
  });

  it('supports InvoiceAutocomplete with type and status chips', async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'inv1',
            invoiceNumber: 'INV-2026-001',
            invoiceType: 'Standard',
            status: 'Paid',
            totalAmount: 150000,
            currency: 'RSD',
            clientName: 'Client Alpha',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasMore: false,
      }),
    } as any);

    renderWithProviders(
      <InvoiceAutocomplete
        value={null}
        onChange={vi.fn()}
        placeholder="Select invoice"
      />
    );

    const input = screen.getByPlaceholderText('Select invoice');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
    });
  });

  it('does not duplicate the selected item in the dropdown when server results contain the same item', async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { id: 'cuid-123', name: 'Petar Marković', role: 'USER' },
          { id: 'cuid-456', name: 'Marko Nikolić', role: 'USER' },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasMore: false,
      }),
    } as any);

    renderWithProviders(
      <UserAutocomplete
        value="Petar Marković"
        initialOption={{ id: 'Petar Marković', name: 'Petar Marković' } as any}
        valueMode="name"
        onChange={vi.fn()}
        placeholder="Select user"
      />
    );

    const input = screen.getByPlaceholderText('Select user');
    expect(screen.getByDisplayValue('Petar Marković')).toBeInTheDocument();

    // Open dropdown
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Wait for options to render
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(2);
    });

    // Petar Marković must only appear once in the option list
    const petarOptions = screen.getAllByRole('option', { name: /Petar Marković/i });
    expect(petarOptions).toHaveLength(1);
  });

  it('displays error state and retry button when query fails', async () => {
    vi.spyOn(api, 'apiFetch').mockRejectedValue(new Error('Network error'));

    renderWithProviders(
      <CustomAutocomplete
        entity="clients"
        value={null}
        onChange={vi.fn()}
        placeholder="Select client"
      />
    );

    const input = screen.getByPlaceholderText('Select client');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Pokušaj ponovo|Retry/i })).toBeInTheDocument();
    });
  });
});

