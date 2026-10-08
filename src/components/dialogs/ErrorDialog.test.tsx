import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorDialog } from './ErrorDialog';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

describe('ErrorDialog', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
      getErrorMessage: (msg: string) => msg,
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <ErrorDialog
        open={true}
        message="An error occurred"
        onClose={mockOnClose}
        {...props}
      />
    );
  };

  it('renders correctly with default props', () => {
    renderComponent();
    
    expect(screen.getByText('errorDialogTitle')).toBeInTheDocument();
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    expect(screen.getByText('btnContinueEditing')).toBeInTheDocument();
  });

  it('renders custom title and button label', () => {
    renderComponent({ title: 'Custom Error', buttonLabel: 'OK' });
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('calls onClose when button is clicked', () => {
    renderComponent();
    
    const closeButton = screen.getByText('btnContinueEditing');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});
