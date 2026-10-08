import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

describe('ConfirmDeleteDialog', () => {
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
      <ConfirmDeleteDialog
        open={true}
        message="Are you sure you want to delete this?"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        {...props}
      />
    );
  };

  it('renders correctly with default title and custom message', () => {
    renderComponent();
    
    expect(screen.getByText('confirmDeleteTitle')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this?')).toBeInTheDocument();
    expect(screen.getByText('btnDelete')).toBeInTheDocument();
  });

  it('renders custom title if provided', () => {
    renderComponent({ title: 'Delete Item' });
    
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
  });

  it('calls onConfirm when delete button is clicked', () => {
    renderComponent();
    
    const deleteButton = screen.getByText('btnDelete');
    fireEvent.click(deleteButton);
    
    expect(mockOnConfirm).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
