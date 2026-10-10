import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

describe('ConfirmDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <ConfirmDialog
        open={true}
        title="Test Title"
        message="Test Message"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        {...props}
      />
    );
  };

  it('renders correctly with default props', () => {
    renderComponent();
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByText('btnCancel')).toBeInTheDocument();
    expect(screen.getByText('btnConfirm')).toBeInTheDocument();
  });

  it('renders custom confirm label', () => {
    renderComponent({ confirmLabel: 'Custom Confirm' });
    
    expect(screen.getByText('Custom Confirm')).toBeInTheDocument();
  });

  it('calls onConfirm and onClose when confirm button is clicked', () => {
    renderComponent();
    
    const confirmButton = screen.getByText('btnConfirm');
    fireEvent.click(confirmButton);
    
    expect(mockOnConfirm).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    renderComponent();
    
    const cancelButton = screen.getByText('btnCancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});
