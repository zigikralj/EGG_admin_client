import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermitModal } from './PermitModal';
import { renderWithProviders } from '../../tests/test-utils';

const mockClients = [
  { id: 'c1', name: 'Client 1', city: 'Belgrade' },
  { id: 'c2', name: 'Client 2', city: 'Novi Sad' },
];

const mockReminders = [
  { id: 'r1', title: 'Reminder 1', dueDate: '2026-11-01', status: 'Pending', permitId: null },
];

describe('PermitModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    editingPermit: null,
    clients: mockClients as any,
    reminders: mockReminders as any,
    canEdit: true,
    canCreate: true,
    canDelete: true,
    canCreateReminder: true,
    canEditReminder: true,
    canDeleteReminder: true,
    onSave: vi.fn().mockResolvedValue(true),
    onDelete: vi.fn(),
  };

  const renderModal = (props = {}) => {
    return renderWithProviders(<PermitModal {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input for permit number and updates value smoothly in create mode', () => {
    renderModal();

    const permitInput = screen.getByLabelText(/lblPermitNumber/i);
    expect(permitInput).toBeInTheDocument();

    fireEvent.change(permitInput, { target: { value: 'DOZ-2026-001' } });
    expect((permitInput as HTMLInputElement).value).toBe('DOZ-2026-001');
  });

  it('populates fields when editing an existing permit in edit mode', () => {
    const existingPermit = {
      id: 'p1',
      permitNumber: 'PERMIT-999',
      permitTypes: ['Transport'],
      clientId: 'c1',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      notes: 'Test notes',
      wasteCatalogIds: ['w1'],
      wasteCatalogs: [{ id: 'w1', code: '01 01 01', description: 'Waste desc' }],
    };

    renderModal({ editingPermit: existingPermit as any, initialMode: 'edit' });

    const permitInput = screen.getByLabelText(/lblPermitNumber/i);
    expect((permitInput as HTMLInputElement).value).toBe('PERMIT-999');
  });

  it('renders in view mode by default when editingPermit is provided', () => {
    const existingPermit = {
      id: 'p1',
      permitNumber: 'PERMIT-999',
      permitTypes: ['Transport'],
      clientId: 'c1',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      notes: 'Test notes',
      wasteCatalogIds: ['w1'],
      wasteCatalogs: [{ id: 'w1', code: '01 01 01', description: 'Waste desc' }],
    };

    renderModal({ editingPermit: existingPermit as any });

    expect(screen.getAllByText('PERMIT-999').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
  });

  it('switches between view and edit mode in-place', () => {
    const existingPermit = {
      id: 'p1',
      permitNumber: 'PERMIT-999',
      permitTypes: ['Transport'],
      clientId: 'c1',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      notes: 'Test notes',
      wasteCatalogIds: ['w1'],
      wasteCatalogs: [{ id: 'w1', code: '01 01 01', description: 'Waste desc' }],
    };

    renderModal({ editingPermit: existingPermit as any });

    // Click edit
    fireEvent.click(screen.getByText('btnEdit'));

    // Should now show input field
    const permitInput = screen.getByLabelText(/lblPermitNumber/i);
    expect(permitInput).toBeInTheDocument();

    // Click cancel to revert back to view
    fireEvent.click(screen.getByText('btnCancel'));
    expect(screen.queryByLabelText(/lblPermitNumber/i)).not.toBeInTheDocument();
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
  });
});
