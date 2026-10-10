import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RichTextEditor } from './RichTextEditor';
import * as LanguageContext from '../../context/LanguageContext';
import * as AuthContext from '../../context/AuthContext';

// Mock contexts
vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock icons
vi.mock('../icons', () => {
  return [
    'FormatBoldIcon', 'FormatItalicIcon', 'FormatUnderlinedIcon', 'StrikethroughSIcon',
    'FormatListBulletedIcon', 'FormatListNumberedIcon', 'FormatQuoteIcon', 'TitleIcon',
    'FormatClearIcon', 'UndoIcon', 'RedoIcon', 'ArrowDropDownIcon', 'AlternateEmailIcon'
  ].reduce((acc, name) => {
    acc[name] = () => <div data-testid={name} />;
    return acc;
  }, {} as Record<string, any>);
});

describe('RichTextEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });
    (AuthContext.useAuth as any).mockReturnValue({
      users: [],
    });
    
    // Mock document.execCommand
    document.execCommand = vi.fn();
    document.queryCommandState = vi.fn().mockReturnValue(false);
  });

  it('renders correctly with placeholder', () => {
    render(<RichTextEditor value="" onChange={mockOnChange} placeholder="Type something..." />);
    
    // Check if toolbar buttons render
    expect(screen.getByTestId('FormatBoldIcon')).toBeInTheDocument();
    
    // Check placeholder
    expect(screen.getByText('Type something...')).toBeInTheDocument();
  });

  it('does not render toolbar when readOnly is true', () => {
    render(<RichTextEditor value="<p>Test</p>" onChange={mockOnChange} readOnly />);
    
    expect(screen.queryByTestId('FormatBoldIcon')).not.toBeInTheDocument();
  });

  it('calls execCommand when formatting buttons are clicked', () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />);
    
    const boldButton = screen.getByRole('button', { name: 'editorBold' });
    fireEvent.click(boldButton);
    
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
  });
});
