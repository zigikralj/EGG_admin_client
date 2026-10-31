import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseModal } from './BaseModal';
import * as LanguageContext from '../../../context/LanguageContext';

vi.mock('../../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

describe('BaseModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn((e) => e.preventDefault());

  beforeEach(() => {
    vi.clearAllMocks();
    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <BaseModal
        open={true}
        onClose={mockOnClose}
        title="Base Modal Title"
        {...props}
      >
        <div>Modal Content Body</div>
      </BaseModal>
    );
  };

  it('renders title, content, and close button by default', () => {
    renderComponent();

    expect(screen.getByText('Base Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Content Body')).toBeInTheDocument();
    const closeBtn = screen.getByLabelText('btnClose');
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders subtitle, header adornment, and header actions', () => {
    renderComponent({
      subtitle: 'Modal Subtitle',
      headerAdornment: <span data-testid="adornment">Chip</span>,
      headerActions: <button data-testid="header-btn">Custom Header Action</button>,
    });

    expect(screen.getByText('Modal Subtitle')).toBeInTheDocument();
    expect(screen.getByTestId('adornment')).toBeInTheDocument();
    expect(screen.getByTestId('header-btn')).toBeInTheDocument();
  });

  it('renders actions footer when provided', () => {
    renderComponent({
      actions: <button data-testid="footer-btn">Submit Action</button>,
    });

    expect(screen.getByTestId('footer-btn')).toBeInTheDocument();
  });

  it('hides close button when hideCloseButton is true', () => {
    renderComponent({ hideCloseButton: true });

    expect(screen.queryByLabelText('btnClose')).not.toBeInTheDocument();
  });

  it('renders loading bar when isLoading is true', () => {
    renderComponent({ isLoading: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('wraps dialog paper in a form and triggers onSubmit when onSubmit is passed', () => {
    renderComponent({
      onSubmit: mockOnSubmit,
      actions: <button type="submit">Submit Form</button>,
    });

    const submitBtn = screen.getByText('Submit Form');
    fireEvent.click(submitBtn);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('fits content by default (height: auto) and expands to maxHeight when fullHeight is true', () => {
    const { unmount } = renderComponent();
    const defaultDialog = screen.getByRole('dialog');
    expect(defaultDialog).toHaveStyle({ height: 'auto' });
    unmount();

    renderComponent({ fullHeight: true, maxHeight: '720px' });
    const fullHeightDialog = screen.getByRole('dialog');
    expect(fullHeightDialog).toHaveStyle({ height: '720px', maxHeight: '720px' });
  });

  it('applies custom width, maxWidth, height, and maxHeight parameters', () => {
    renderComponent({
      width: '540px',
      maxWidth: '680px',
      height: '450px',
      maxHeight: '80vh',
    });

    const dialogPaper = screen.getByRole('dialog');
    expect(dialogPaper).toHaveStyle({
      width: '540px',
      maxWidth: '680px',
      height: '450px',
      maxHeight: '80vh',
    });
  });

  it('respects fullWidth prop when passed as false or true', () => {
    const { unmount } = renderComponent({ fullWidth: false });
    const dialogPaper = screen.getByRole('dialog');
    expect(dialogPaper).not.toHaveClass('MuiDialog-paperFullWidth');
    unmount();

    renderComponent({ fullWidth: true });
    const fullWidthDialog = screen.getByRole('dialog');
    expect(fullWidthDialog).toHaveClass('MuiDialog-paperFullWidth');
  });
});
