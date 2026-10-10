import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LanguageSelector } from './LanguageSelector';
import * as LanguageContext from '../../context/LanguageContext';

// Mock the context hook
vi.mock('../../context/LanguageContext', async () => {
  const actual = await vi.importActual('../../context/LanguageContext');
  return {
    ...actual as any,
    useLanguage: vi.fn(),
  };
});

// Mock the icon to simplify rendering
vi.mock('../icons', () => ({
  LanguageIcon: () => <div data-testid="language-icon" />,
}));

describe('LanguageSelector', () => {
  const mockSetLanguage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (LanguageContext.useLanguage as any).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
    });
  });

  it('renders correctly with default language', () => {
    render(<LanguageSelector />);
    
    // MUI Select uses a hidden input and a visible div. The visible div contains the text.
    // It should display '🇬🇧 EN' when language is 'en'
    expect(screen.getByText('🇬🇧 EN')).toBeInTheDocument();
    expect(screen.getByTestId('language-icon')).toBeInTheDocument();
  });

  it('calls setLanguage when a new language is selected', () => {
    render(<LanguageSelector />);
    
    // Open the select dropdown
    const selectButton = screen.getByRole('combobox');
    fireEvent.mouseDown(selectButton);
    
    // Click on the Serbian (Latin) option
    const srLatnOption = screen.getByText('🇷🇸 SR');
    fireEvent.click(srLatnOption);
    
    expect(mockSetLanguage).toHaveBeenCalledWith('sr-Latn');
    expect(mockSetLanguage).toHaveBeenCalledTimes(1);
  });
});
