import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableSearchInput } from './TableSearchInput';
import * as LanguageContext from '../../context/LanguageContext';

// Mock contexts
vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

// Mock icons
vi.mock('../icons', () => ({
  SearchIcon: () => <div data-testid="search-icon" />,
  CloseIcon: () => <div data-testid="close-icon" />,
}));

describe('TableSearchInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key, // mock translation returns the key
    });
  });

  it('renders collapsed by default when value is empty', () => {
    render(<TableSearchInput value="" onChange={vi.fn()} />);
    
    // Should render the search icon button instead of the text field
    const iconButton = screen.getByRole('button', { name: /searchPlaceholder/i });
    expect(iconButton).toBeInTheDocument();
    
    // The text field should not be present
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders expanded when initialized with a value', () => {
    render(<TableSearchInput value="test" onChange={vi.fn()} />);
    
    // The text field should be present
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('test');
    
    // The collapsed icon button should not be present
    expect(screen.queryByRole('button', { name: /searchPlaceholder/i })).not.toBeInTheDocument();
  });

  it('expands when the search button is clicked', async () => {
    render(<TableSearchInput value="" onChange={vi.fn()} />);
    
    const iconButton = screen.getByRole('button', { name: /searchPlaceholder/i });
    fireEvent.click(iconButton);
    
    // After clicking, the input should appear
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  it('calls onChange when typing in the input', async () => {
    const mockOnChange = vi.fn();
    render(<TableSearchInput value="" onChange={mockOnChange} />);
    
    // Expand it first
    fireEvent.click(screen.getByRole('button', { name: /searchPlaceholder/i }));
    
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'hello' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('hello');
  });

  it('clears and collapses when the clear button is clicked', async () => {
    const mockOnChange = vi.fn();
    render(<TableSearchInput value="search term" onChange={mockOnChange} />);
    
    const clearButton = screen.getByRole('button', { name: /clear and collapse search/i });
    fireEvent.click(clearButton);
    
    // Should call onChange with empty string
    expect(mockOnChange).toHaveBeenCalledWith('');
  });
});
