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

  it('calls onDeleteService when delete button is clicked in view mode', () => {
    const onDeleteService = vi.fn();
    renderModal({ editingService: mockService, onDeleteService });

    fireEvent.click(screen.getByText('btnDelete'));
    expect(onDeleteService).toHaveBeenCalledWith('srv-1');
  });
});
