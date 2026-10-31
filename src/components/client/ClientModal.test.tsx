import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientModal } from './ClientModal';
import { renderWithProviders } from '../../tests/test-utils';

vi.mock('../common/autocomplete', () => ({
  PermitAutocomplete: ({ value, onChange, label }: any) => (
    <input
      data-testid="permit-autocomplete"
      aria-label={label}
      value={(value || []).join(',')}
      onChange={(e) => onChange(e.target.value ? e.target.value.split(',') : [])}
    />
  ),
}));

describe('ClientModal (Unified View/Edit/Create)', () => {
  const mockOnClose = vi.fn();
  const mockOnSaveClient = vi.fn().mockResolvedValue({ success: true });
  const mockOnDeleteClient = vi.fn();
  const mockOnError = vi.fn();

  const mockClient = {
    id: 'c-1',
    name: 'Ekos Eco Solutions',
    city: 'Belgrade',
    contactPerson: 'Milica Jovanovic',
    email: 'milica@ekos.rs',
    phone: '+381641234567',
    permits: [
      { id: 'p-1', permitNumber: 'PERMIT-2026-001' } as any,
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in create mode when editingClient is null', () => {
    renderWithProviders(
      <ClientModal
        open={true}
        onClose={mockOnClose}
        editingClient={null}
        onSaveClient={mockOnSaveClient}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('modalNewClient')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('phClientCompany')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('phCity')).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
    expect(screen.getByText('btnCancel')).toBeInTheDocument();
  });

  it('renders in view mode when editingClient is provided', () => {
    renderWithProviders(
      <ClientModal
        open={true}
        onClose={mockOnClose}
        editingClient={mockClient as any}
        canEdit={true}
        onSaveClient={mockOnSaveClient}
        onError={mockOnError}
      />
    );

    // Displays client name in title and field
    expect(screen.getAllByText('Ekos Eco Solutions').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Belgrade').length).toBeGreaterThan(0);
    expect(screen.getByText('Milica Jovanovic')).toBeInTheDocument();
    expect(screen.getByText('milica@ekos.rs')).toBeInTheDocument();
    expect(screen.getByText('+381641234567')).toBeInTheDocument();
    expect(screen.getByText('PERMIT-2026-001')).toBeInTheDocument();

    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.getByText('btnClose')).toBeInTheDocument();
  });

  it('toggles in-place between view and edit mode', () => {
    renderWithProviders(
      <ClientModal
        open={true}
        onClose={mockOnClose}
        editingClient={mockClient as any}
        canEdit={true}
        onSaveClient={mockOnSaveClient}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('phClientCompany')).not.toBeInTheDocument();

    // Click Edit
    fireEvent.click(screen.getByText('btnEdit'));

    expect(screen.getByText('modalEditClient')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('phClientCompany')).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
    expect(screen.getByText('btnCancel')).toBeInTheDocument();

    // Click Cancel -> reverts to view mode
    fireEvent.click(screen.getByText('btnCancel'));
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('phClientCompany')).not.toBeInTheDocument();
  });

  it('submits updated client data on save', async () => {
    renderWithProviders(
      <ClientModal
        open={true}
        onClose={mockOnClose}
        editingClient={mockClient as any}
        initialMode="edit"
        canEdit={true}
        onSaveClient={mockOnSaveClient}
        onError={mockOnError}
      />
    );

    const nameInput = screen.getByPlaceholderText('phClientCompany');
    fireEvent.change(nameInput, { target: { value: 'Ekos Advanced Solutions' } });

    fireEvent.click(screen.getByText('btnSave'));

    await waitFor(() => {
      expect(mockOnSaveClient).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'c-1',
          name: 'Ekos Advanced Solutions',
          city: 'Belgrade',
        })
      );
    });
  });

  it('renders Delete button in view mode when canDelete is true', () => {
    renderWithProviders(
      <ClientModal
        open={true}
        onClose={mockOnClose}
        editingClient={mockClient as any}
        canDelete={true}
        onDeleteClient={mockOnDeleteClient}
        onSaveClient={mockOnSaveClient}
        onError={mockOnError}
      />
    );

    const deleteBtn = screen.getByText('btnDelete');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(mockOnDeleteClient).toHaveBeenCalledWith('c-1');
  });
});
