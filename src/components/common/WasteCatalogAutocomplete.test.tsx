import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WasteCatalogAutocomplete } from './WasteCatalogAutocomplete';
import * as LanguageContext from '../../context/LanguageContext';
import * as api from '../../api';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

// Mock icons
vi.mock('../icons', () => ({
  StarIcon: () => <div data-testid="star-icon" />,
  StarBorderIcon: () => <div data-testid="star-border-icon" />,
}));

describe('WasteCatalogAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
