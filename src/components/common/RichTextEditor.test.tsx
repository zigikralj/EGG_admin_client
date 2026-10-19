import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RichTextEditor, formatHtml } from './RichTextEditor';
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
    'FormatClearIcon', 'FormatColorTextIcon', 'UndoIcon', 'RedoIcon', 'ArrowDropDownIcon', 'AlternateEmailIcon',
    'CheckCircleIcon', 'ErrorIcon', 'CodeIcon', 'TextFieldsIcon', 'EditNoteIcon', 'AutoFixHighIcon'
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

  it('switches to plain text view and displays plain text', () => {
    render(<RichTextEditor value="<p>Hello <b>World</b></p><p>Line 2</p>" onChange={mockOnChange} placeholder="phProjectNotes" />);

    // Click plain text mode toggle
    const plainButton = screen.getByRole('button', { name: 'editorModePlain' });
    fireEvent.click(plainButton);

    // Textarea for plain text should appear with stripped HTML
    const textarea = screen.getByPlaceholderText('phProjectNotes') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe('Hello World\nLine 2');

    // Editing plain text calls onChange with converted HTML
    fireEvent.change(textarea, { target: { value: 'New text\nSecond line' } });
    expect(mockOnChange).toHaveBeenCalledWith('<p>New text<br>Second line</p>');
  });

  it('switches to HTML source view and allows editing raw markup', () => {
    render(<RichTextEditor value="<p>Hello</p>" onChange={mockOnChange} />);

    // Click HTML mode toggle
    const htmlButton = screen.getByRole('button', { name: 'editorModeHtml' });
    fireEvent.click(htmlButton);

    const textarea = screen.getByPlaceholderText('editorHtmlPlaceholder') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe('<p>Hello</p>');

    fireEvent.change(textarea, { target: { value: '<p>Hello <em>World</em></p>' } });
    expect(mockOnChange).toHaveBeenCalledWith('<p>Hello <em>World</em></p>');
  });

  it('preserves rich text markup when switching to plain text and back without edits', () => {
    const originalHtml = '<p>Hello <span style="color: red;">Red</span></p>';
    render(<RichTextEditor value={originalHtml} onChange={mockOnChange} />);

    // Switch to plain text
    fireEvent.click(screen.getByRole('button', { name: 'editorModePlain' }));
    // Switch back to rich text without editing
    fireEvent.click(screen.getByRole('button', { name: 'editorModeRich' }));

    // Rich text container should still retain original HTML
    const boldButton = screen.getByRole('button', { name: 'editorBold' });
    expect(boldButton).toBeInTheDocument();
  });

  it('displays auto-save toast when autoSave completes or fails', async () => {
    const mockOnSave = vi.fn().mockResolvedValue({ success: true });
    render(
      <RichTextEditor
        value="<p>Initial</p>"
        onChange={mockOnChange}
        autoSave={{
          enabled: true,
          delay: 100,
          onSave: mockOnSave,
        }}
      />
    );

    // Switch to plain mode and edit text to trigger change
    fireEvent.click(screen.getByRole('button', { name: 'editorModePlain' }));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Updated note' } });

    // Wait for auto-save debounce
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('<p>Updated note</p>');
    });

    // Expect the saved toast to appear with 'notesSaved' ("Saved")
    expect(await screen.findByText('notesSaved')).toBeInTheDocument();
  });

  it('formats HTML with indentation and nesting via formatHtml', () => {
    const raw = '<p>Hello <b>World</b></p><ul><li>Item 1</li><li>Item 2</li></ul>';
    const formatted = formatHtml(raw);
    expect(formatted).toBe('<p>Hello <b>World</b></p>\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>');
  });

  it('switches to HTML source view with formatted HTML and supports reformatting', () => {
    render(
      <RichTextEditor
        value="<p>Line 1</p><p>Line 2</p><ul><li>Alpha</li></ul>"
        onChange={mockOnChange}
      />
    );

    // Click HTML mode toggle
    const htmlButton = screen.getByRole('button', { name: 'editorModeHtml' });
    fireEvent.click(htmlButton);

    const textarea = screen.getByPlaceholderText('editorHtmlPlaceholder') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    // Should be formatted on multiple lines
    expect(textarea.value).toBe('<p>Line 1</p>\n<p>Line 2</p>\n<ul>\n  <li>Alpha</li>\n</ul>');

    // Type unformatted HTML
    fireEvent.change(textarea, { target: { value: '<div><p>Unformatted</p></div>' } });

    // Click format HTML button
    const formatBtn = screen.getByRole('button', { name: 'editorFormatHtml' });
    fireEvent.click(formatBtn);

    expect(textarea.value).toBe('<div>\n  <p>Unformatted</p>\n</div>');
  });

  it('does not discard edits made while autoSave is in flight and chains the next save', async () => {
    let resolveFirstSave: (val: any) => void;
    const firstSavePromise = new Promise((resolve) => {
      resolveFirstSave = resolve;
    });

    const mockOnSave = vi.fn().mockImplementation((val: string) => {
      if (val === '<p>First edit</p>') {
        return firstSavePromise;
      }
      return Promise.resolve({ success: true });
    });

    const { rerender } = render(
      <RichTextEditor
        value="<p>Initial</p>"
        onChange={mockOnChange}
        autoSave={{
          enabled: true,
          delay: 50,
          onSave: mockOnSave,
        }}
      />
    );

    // Switch to plain text mode
    fireEvent.click(screen.getByRole('button', { name: 'editorModePlain' }));
    const textarea = screen.getByPlaceholderText('editorPlainPlaceholder') as HTMLTextAreaElement;

    // First change: user types "First edit"
    fireEvent.change(textarea, { target: { value: 'First edit' } });

    // Wait for the first auto-save to trigger
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('<p>First edit</p>');
    });

    // While first save is still in flight (firstSavePromise not resolved yet),
    // user types "First edit with second edit"
    fireEvent.change(textarea, { target: { value: 'First edit with second edit' } });

    // Simulate parent echoing back the first save value ("<p>First edit</p>") via props
    rerender(
      <RichTextEditor
        value="<p>First edit</p>"
        onChange={mockOnChange}
        autoSave={{
          enabled: true,
          delay: 50,
          onSave: mockOnSave,
        }}
      />
    );

    // Textarea must NOT be overwritten with the stale "<p>First edit</p>"
    expect(textarea.value).toBe('First edit with second edit');

    // Now let the first save resolve
    resolveFirstSave!({ success: true });

    // The second save should automatically chain and save the latest edits
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('<p>First edit with second edit</p>');
    });
  });
});

