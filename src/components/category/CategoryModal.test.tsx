import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryModal } from './CategoryModal';
import { renderWithProviders } from '../../tests/test-utils';
import type { Category } from '../../types';

const mockCategory: Category = {
  id: 'cat-1',
  code: 'grp-legal',
  name: 'Legal Services',
  description: 'Permits and compliance documents',
};

describe('CategoryModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    editingCategory: null,
    canDelete: true,
    canEdit: true,
    canCreate: true,
    onDeleteCategory: vi.fn(),
    onSaveCategory: vi.fn().mockResolvedValue({ success: true }),
    onError: vi.fn(),
  };

  const renderModal = (props = {}) => {
    return renderWithProviders(<CategoryModal {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in create mode with empty editable fields', () => {
    renderModal({ editingCategory: null });

    expect(screen.getByText('modalNewCategory')).toBeInTheDocument();
    expect(screen.getByLabelText(/lblCategoryCode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lblCategoryName/i)).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
  });

  it('renders in view mode by default when editingCategory is provided', () => {
    renderModal({ editingCategory: mockCategory });

    expect(screen.getAllByText('grp-legal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Legal Services').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.queryByLabelText(/lblCategoryName/i)).not.toBeInTheDocument();
  });

  it('switches between view and edit mode in-place', () => {
    renderModal({ editingCategory: mockCategory });

    // Click edit
    fireEvent.click(screen.getByText('btnEdit'));

    expect(screen.getByText('modalEditCategory')).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/lblCategoryName/i);
    expect(nameInput).toBeInTheDocument();
    expect((nameInput as HTMLInputElement).value).toBe('Legal Services');

    // Click cancel reverts to view
    fireEvent.click(screen.getByText('btnCancel'));
    expect(screen.getAllByText('Legal Services').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByLabelText(/lblCategoryName/i)).not.toBeInTheDocument();
  });

  it('calls onSaveCategory when form is submitted in edit mode', async () => {
    const onSaveCategory = vi.fn().mockResolvedValue({ success: true });
    renderModal({ editingCategory: mockCategory, initialMode: 'edit', onSaveCategory });

    const nameInput = screen.getByLabelText(/lblCategoryName/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Category Name' } });

    fireEvent.click(screen.getByText('btnSave'));

    await waitFor(() => {
      expect(onSaveCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cat-1',
          code: 'grp-legal',
          name: 'Updated Category Name',
        })
      );
    });
  });

  it('calls onDeleteCategory when delete button is clicked in view mode', () => {
    const onDeleteCategory = vi.fn();
    renderModal({ editingCategory: mockCategory, onDeleteCategory });

    fireEvent.click(screen.getByText('btnDelete'));
    expect(onDeleteCategory).toHaveBeenCalledWith('cat-1');
  });
});
