import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViewEditModalBase } from './ViewEditModalBase';
import * as LanguageContext from '../../../context/LanguageContext';

vi.mock('../../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

describe('ViewEditModalBase', () => {
  const mockOnClose = vi.fn();
  const mockOnModeChange = vi.fn();
  const mockOnSave = vi.fn((e) => e.preventDefault());
  const mockOnDelete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <ViewEditModalBase
        open={true}
        onClose={mockOnClose}
        mode="view"
        title={(mode) => `Title for ${mode}`}
        onModeChange={mockOnModeChange}
        onSave={mockOnSave}
        {...props}
      >
        <div>Modal Children Content</div>
      </ViewEditModalBase>
    );
  };

  describe('View Mode', () => {
    it('renders title function with current mode and children', () => {
      renderComponent({ mode: 'view' });

      expect(screen.getByText('Title for view')).toBeInTheDocument();
      expect(screen.getByText('Modal Children Content')).toBeInTheDocument();
    });

    it('renders Edit button in footer when canEdit is true and calls onModeChange("edit")', () => {
      renderComponent({ mode: 'view', canEdit: true });

      const editBtn = screen.getByText('btnEdit');
      expect(editBtn).toBeInTheDocument();

      fireEvent.click(editBtn);
      expect(mockOnModeChange).toHaveBeenCalledWith('edit');
    });

    it('does not render Edit button when canEdit is false', () => {
      renderComponent({ mode: 'view', canEdit: false });

      expect(screen.queryByText('btnEdit')).not.toBeInTheDocument();
    });

    it('renders Close button and calls onClose when clicked', () => {
      renderComponent({ mode: 'view' });

      const closeBtn = screen.getByText('btnClose');
      fireEvent.click(closeBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders Delete button in header when canDelete is true and onDelete provided', () => {
      renderComponent({ mode: 'view', canDelete: true, onDelete: mockOnDelete });

      const deleteBtn = screen.getByText('btnDelete');
      expect(deleteBtn).toBeInTheDocument();

      fireEvent.click(deleteBtn);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('renders Complete and History header actions when provided', () => {
      const mockOnComplete = vi.fn();
      const mockOnHistory = vi.fn();
      renderComponent({
        mode: 'view',
        onComplete: mockOnComplete,
        onHistory: mockOnHistory,
        completeLabel: 'Complete Item',
        historyLabel: 'View History',
      });

      const completeBtn = screen.getByText('Complete Item');
      const historyBtn = screen.getByText('View History');
      expect(completeBtn).toBeInTheDocument();
      expect(historyBtn).toBeInTheDocument();

      fireEvent.click(completeBtn);
      expect(mockOnComplete).toHaveBeenCalledTimes(1);

      fireEvent.click(historyBtn);
      expect(mockOnHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit Mode', () => {
    it('renders Save and Cancel buttons in edit mode', () => {
      renderComponent({ mode: 'edit' });

      expect(screen.getByText('btnSave')).toBeInTheDocument();
      expect(screen.getByText('btnCancel')).toBeInTheDocument();
      expect(screen.queryByText('btnClose')).not.toBeInTheDocument();
    });

    it('submits form via onSave when Save is clicked', () => {
      renderComponent({ mode: 'edit' });

      const saveBtn = screen.getByText('btnSave');
      fireEvent.click(saveBtn);

      expect(mockOnSave).toHaveBeenCalled();
    });

    it('calls onModeChange("view") on Cancel when editing without custom onCancel', () => {
      renderComponent({ mode: 'edit' });

      const cancelBtn = screen.getByText('btnCancel');
      fireEvent.click(cancelBtn);

      expect(mockOnModeChange).toHaveBeenCalledWith('view');
    });

    it('calls custom onCancel if provided', () => {
      renderComponent({ mode: 'edit', onCancel: mockOnCancel });

      const cancelBtn = screen.getByText('btnCancel');
      fireEvent.click(cancelBtn);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnModeChange).not.toHaveBeenCalled();
    });

    it('shows loading state on Save button when isSaving is true', () => {
      renderComponent({ mode: 'edit', isSaving: true });

      const saveBtn = screen.getByRole('button', { name: /btnSave/i });
      expect(saveBtn).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Create Mode', () => {
    it('renders Save and Cancel buttons, and Cancel calls onClose by default', () => {
      renderComponent({ mode: 'create' });

      expect(screen.getByText('btnSave')).toBeInTheDocument();
      const cancelBtn = screen.getByText('btnCancel');
      fireEvent.click(cancelBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
