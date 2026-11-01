import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceModal } from './ServiceModal';
import { renderWithProviders } from '../../tests/test-utils';
import type { Service, Category } from '../../types';

const mockCategories: Category[] = [
  { id: 'cat1', code: 'grp-legal', name: 'Legal Services' },
  { id: 'cat2', code: 'grp-tech', name: 'Technical Services' },
];

const mockService: Service = {
  id: 'srv-1',
  code: 'SRV-001',
  name: 'Waste Management Consulting',
  group: 'grp-legal',
  frequency: 6,
  description: 'Bi-annual waste consulting',
};

describe('ServiceModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    editingService: null,
    categories: mockCategories,
    getServiceLabel: (code: string) => code,
    canDelete: true,
    canEdit: true,
    canCreate: true,
    onDeleteService: vi.fn(),
    onSaveService: vi.fn().mockResolvedValue({ success: true }),
    onOpenCustomModelModal: vi.fn(),
    getCustomModelForService: vi.fn().mockReturnValue([]),
    onError: vi.fn(),
  };

  const renderModal = (props = {}) => {
    return renderWithProviders(<ServiceModal {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in create mode with empty editable fields', () => {
    renderModal({ editingService: null });

    expect(screen.getByText('modalNewService')).toBeInTheDocument();
    expect(screen.getByLabelText(/lblServiceCode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lblServiceName/i)).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
  });

  it('renders in view mode by default when editingService is provided', () => {
    renderModal({ editingService: mockService });

    expect(screen.getAllByText('SRV-001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Waste Management Consulting').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.queryByLabelText(/lblServiceName/i)).not.toBeInTheDocument();
  });

  it('switches between view and edit mode in-place', () => {
    renderModal({ editingService: mockService });

    // Click edit
    fireEvent.click(screen.getByText('btnEdit'));

    expect(screen.getByText('modalEditService')).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/lblServiceName/i);
    expect(nameInput).toBeInTheDocument();
    expect((nameInput as HTMLInputElement).value).toBe('Waste Management Consulting');

    // Click cancel reverts to view
    fireEvent.click(screen.getByText('btnCancel'));
    expect(screen.getAllByText('Waste Management Consulting').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByLabelText(/lblServiceName/i)).not.toBeInTheDocument();
  });

  it('calls onSaveService when form is submitted in edit mode', async () => {
    const onSaveService = vi.fn().mockResolvedValue({ success: true });
    renderModal({ editingService: mockService, initialMode: 'edit', onSaveService });

    const nameInput = screen.getByLabelText(/lblServiceName/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Service Name' } });

    fireEvent.click(screen.getByText('btnSave'));

    await waitFor(() => {
      expect(onSaveService).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'srv-1',
          code: 'SRV-001',
          name: 'Updated Service Name',
          group: 'grp-legal',
          frequency: 6,
        })
      );
    });
  });

  it('renders code/slug field as disabled and non-editable when editing an existing service', () => {
    renderModal({ editingService: mockService, initialMode: 'edit' });

    const codeInput = screen.getByLabelText(/lblServiceCode/i) as HTMLInputElement;
    expect(codeInput).toBeInTheDocument();
    expect(codeInput).toBeDisabled();
    expect(screen.getByText('hintSlugNonEditable')).toBeInTheDocument();
  });

  it('checks if code exists on blur when creating a new service and prevents saving if duplicate', async () => {
    const checkCodeExists = vi.fn().mockResolvedValue(true);
    const onSaveService = vi.fn().mockResolvedValue({ success: true });
    const onError = vi.fn();

    renderModal({
      editingService: null,
      checkCodeExists,
      onSaveService,
      onError,
    });

    const codeInput = screen.getByLabelText(/lblServiceCode/i);
    const nameInput = screen.getByLabelText(/lblServiceName/i);
    const saveBtn = screen.getByText('btnSave').closest('button')!;

    // Type a duplicate code
    fireEvent.change(codeInput, { target: { value: 'existing-code' } });
    fireEvent.blur(codeInput);

    await waitFor(() => {
      expect(checkCodeExists).toHaveBeenCalledWith('existing-code');
      expect(screen.getByText('errServiceCodeExists')).toBeInTheDocument();
      expect(saveBtn).toBeDisabled();
    });

    // Attempting to submit via form or save button should not call onSaveService
    fireEvent.change(nameInput, { target: { value: 'Some Service' } });
    fireEvent.click(saveBtn);

    expect(onSaveService).not.toHaveBeenCalled();

    // Changing code clears error
    fireEvent.change(codeInput, { target: { value: 'new-unique-code' } });
    expect(screen.queryByText('errServiceCodeExists')).not.toBeInTheDocument();
    expect(saveBtn).not.toBeDisabled();
  });

  it('allows saving when code is unique', async () => {
    const checkCodeExists = vi.fn().mockResolvedValue(false);
    const onSaveService = vi.fn().mockResolvedValue({ success: true });

    renderModal({
      editingService: null,
      checkCodeExists,
      onSaveService,
    });

    const codeInput = screen.getByLabelText(/lblServiceCode/i);
    const nameInput = screen.getByLabelText(/lblServiceName/i);
    const saveBtn = screen.getByText('btnSave').closest('button')!;

    fireEvent.change(codeInput, { target: { value: 'unique-service-slug' } });
    fireEvent.blur(codeInput);

    await waitFor(() => {
      expect(checkCodeExists).toHaveBeenCalledWith('unique-service-slug');
      expect(screen.queryByText('errServiceCodeExists')).not.toBeInTheDocument();
      expect(saveBtn).not.toBeDisabled();
    });

    fireEvent.change(nameInput, { target: { value: 'Unique Service Name' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSaveService).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'unique-service-slug',
          name: 'Unique Service Name',
        })
      );
    });
  });

  it('validates uniqueness on submit if blurred was not triggered', async () => {
    const checkCodeExists = vi.fn().mockResolvedValue(true);
    const onSaveService = vi.fn().mockResolvedValue({ success: true });
    const onError = vi.fn();

    renderModal({
      editingService: null,
      checkCodeExists,
      onSaveService,
      onError,
    });

    const codeInput = screen.getByLabelText(/lblServiceCode/i);
    const nameInput = screen.getByLabelText(/lblServiceName/i);
    const saveBtn = screen.getByText('btnSave');

    fireEvent.change(codeInput, { target: { value: 'duplicate-slug' } });
    fireEvent.change(nameInput, { target: { value: 'Service' } });

    // Click save directly without manual blur
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(checkCodeExists).toHaveBeenCalledWith('duplicate-slug');
      expect(onError).toHaveBeenCalledWith('errServiceCodeExists');
      expect(onSaveService).not.toHaveBeenCalled();
    });
  });

  it('calls onDeleteService when delete button is clicked in view mode', () => {
    const onDeleteService = vi.fn();
    renderModal({ editingService: mockService, onDeleteService });

    fireEvent.click(screen.getByText('btnDelete'));
    expect(onDeleteService).toHaveBeenCalledWith('srv-1');
  });
});
