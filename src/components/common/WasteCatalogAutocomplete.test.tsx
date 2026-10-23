import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WasteCatalogAutocomplete } from './WasteCatalogAutocomplete';
import * as LanguageContext from '../../context/LanguageContext';
import * as api from '../../api';
import { clearCatalogDB } from '../../utils/wasteCatalogStorage';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

// Mock icons
vi.mock('../icons', () => ({
  StarIcon: () => <div data-testid="star-icon" />,
  StarBorderIcon: () => <div data-testid="star-border-icon" />,
}));

describe('WasteCatalogAutocomplete', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await clearCatalogDB();
    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });

    // Mock API Fetch
    vi.spyOn(api, 'apiFetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { id: '1', code: '15 01 01', description: 'Paper', isHazardous: false },
          { id: '2', code: '15 01 10*', description: 'Packaging containing residues', isHazardous: true },
        ],
        page: 1,
        hasMore: false,
      }),
    } as any);
  });

  it('renders Autocomplete with placeholder', () => {
    render(<WasteCatalogAutocomplete value={[]} onChange={vi.fn()} placeholder="Search waste" />);
    
    expect(screen.getByPlaceholderText('Search waste')).toBeInTheDocument();
  });

  it('loads options from API when typing', async () => {
    render(<WasteCatalogAutocomplete value={[]} onChange={vi.fn()} placeholder="Search waste" />);
    
    const input = screen.getByPlaceholderText('Search waste');
    
    // Simulate user focusing and typing
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '15 01' } });
    
    // API is debounced by 250ms
    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('renders single value correctly in multiple=false mode', () => {
    render(
      <WasteCatalogAutocomplete 
        multiple={false} 
        value={{ id: '3', code: '02 01 03', description: 'Plant tissue', isHazardous: false }} 
        onChange={vi.fn()} 
      />
    );
    
    // Since it's single mode, the TextField input itself should hold the code value
    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('02 01 03');
  });

  it('triggers lazy loading when all options in the batch are selected', async () => {
    (api.apiFetch as any).mockImplementation((url: string) => {
      if (url.includes('page=2')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [
              { id: '3', code: '15 01 03', description: 'Wood', isHazardous: false },
            ],
            page: 2,
            hasMore: false,
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          items: [
            { id: '1', code: '15 01 01', description: 'Paper', isHazardous: false },
            { id: '2', code: '15 01 10*', description: 'Packaging', isHazardous: true },
          ],
          page: 1,
          hasMore: true,
        }),
      });
    });

    render(
      <WasteCatalogAutocomplete
        multiple={true}
        value={[
          { id: '1', code: '15 01 01', description: 'Paper', isHazardous: false },
          { id: '2', code: '15 01 10*', description: 'Packaging', isHazardous: true },
        ]}
        onChange={vi.fn()}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.mouseDown(input);

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    }, { timeout: 2000 });
  });

  it('uses locally cached catalog without network calls when typing', async () => {
    const { saveCatalogToDB } = await import('../../utils/wasteCatalogStorage');
    const cachedItems = Array.from({ length: 60 }, (_, i) => ({
      id: `item-${i}`,
      code: `15 01 ${i < 10 ? '0' + i : i}`,
      description: `Test item ${i}`,
      isHazardous: false,
    }));
    await saveCatalogToDB(cachedItems, new Date().toISOString());

    const apiSpy = vi.spyOn(api, 'apiFetch');
    apiSpy.mockClear();

    render(<WasteCatalogAutocomplete value={[]} onChange={vi.fn()} placeholder="Search waste" />);

    const input = screen.getByPlaceholderText('Search waste');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '15 01 05' } });

    // In local mode, no debounced /api/waste-catalog fetch is dispatched on typing
    await new Promise((r) => setTimeout(r, 350));
    const paginatedCalls = apiSpy.mock.calls.filter(
      ([url]) => typeof url === 'string' && url.includes('/api/waste-catalog?page=')
    );
    expect(paginatedCalls.length).toBe(0);
  });
});
