import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsDialog } from './SettingsDialog';
import * as AuthContext from '../../context/AuthContext';
import * as ThemeContext from '../../context/ThemeContext';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/ThemeContext', () => ({
  useThemeContext: vi.fn(),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

describe('SettingsDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnPreferenceChange = vi.fn();
  const mockSetThemeMode = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });

    (ThemeContext.useThemeContext as any).mockReturnValue({
      themeMode: 'light',
      setThemeMode: mockSetThemeMode,
    });

    (AuthContext.useAuth as any).mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(true),
    });
  });

  const renderComponent = () => {
    return render(
      <SettingsDialog
        isOpen={true}
        onClose={mockOnClose}
        onPreferenceChange={mockOnPreferenceChange}
      />
    );
  };

  it('renders settings dialog correctly', () => {
    renderComponent();
    expect(screen.getByText('userPreferencesTitle')).toBeInTheDocument();
    expect(screen.getByText('lblTheme')).toBeInTheDocument();
    expect(screen.getByText('lblLanguage')).toBeInTheDocument();
    expect(screen.getByText('lblTableColumns')).toBeInTheDocument();
  });

  it('handles theme change', () => {
    renderComponent();
    
    const darkThemeButton = screen.getByText('themeDark');
    fireEvent.click(darkThemeButton);
    
    expect(mockSetThemeMode).toHaveBeenCalledWith('dark');
    expect(mockOnPreferenceChange).toHaveBeenCalledWith('theme', 'dark');
  });

  it('calls onClose when close button is clicked', () => {
    renderComponent();
    
    const closeButtons = screen.getAllByRole('button');
    const closeIconButton = closeButtons[0]; // Assuming it's the first button (icon button in header)
    
    fireEvent.click(closeIconButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});
