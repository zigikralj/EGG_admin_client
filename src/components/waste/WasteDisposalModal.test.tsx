import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WasteDisposalModal } from './WasteDisposalModal';
import { renderWithProviders } from '../../tests/test-utils';

vi.mock('../common/autocomplete', () => ({
  ServiceAutocomplete: ({ value, onChange, label, disabled }: any) => (
    <input
      data-testid="service-autocomplete"
      aria-label={label}
      value={value || ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  ClientAutocomplete: ({ value, onChange, label, disabled }: any) => (
    <input
      data-testid="client-autocomplete"
      aria-label={label}
      value={value || ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value, { id: e.target.value, name: 'Client ' + e.target.value })}
    />
  ),
  ProjectAutocomplete: ({ value, onChange, label, disabled }: any) => (
    <input
      data-testid="project-autocomplete"
      aria-label={label}
      value={value || ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value, { id: e.target.value, name: 'Project ' + e.target.value })}
    />
  ),
}));

vi.mock('../providedService/ProvidedServiceInvoiceSection', () => ({
  ProvidedServiceInvoiceSection: () => <div data-testid="invoice-section" />,
}));

describe('WasteDisposalModal (Unified View/Edit/Create)', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn().mockResolvedValue(true);
  const mockOnDelete = vi.fn();
  const mockSetError = vi.fn();

  const mockServices = [
    { id: 'srv-w1', name: 'Hazardous Waste Processing', code: 'waste-haz', group: 'Waste', frequency: 1 },
  ];

  const mockClients = [
    { id: 'c-10', name: 'PetroChem Industries' },
  ];

  const mockItem = {
    id: 'wd-50',
    serviceId: 'srv-w1',
    service: mockServices[0],
    clientId: 'c-10',
    client: mockClients[0],
    clientName: 'PetroChem Industries',
    projectId: 'p-10',
    project: { id: 'p-10', name: 'Refinery South' } as any,
    status: 'Planned',
    location: 'Sector 4',
    scheduledDate: '2026-08-10T00:00:00Z',
    completionDate: '',
    notes: 'Drum containment pickup',
    customData: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in create mode when editingItem is null', () => {
    renderWithProviders(
      <WasteDisposalModal
        open={true}
        onClose={mockOnClose}
        editingItem={null}
        targetWasteService={mockServices[0] as any}
        services={mockServices as any}
        clients={mockClients as any}
        projects={[]}
        invoices={[]}
        onSave={mockOnSave}
        isSaving={false}
        setErrorDialogState={mockSetError}
      />
    );

    expect(screen.getByText('modalNewWasteDisposal')).toBeInTheDocument();
    expect(screen.getByTestId('service-autocomplete')).toBeInTheDocument();
    expect(screen.getByTestId('client-autocomplete')).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
    expect(screen.getByText('btnCancel')).toBeInTheDocument();
  });

  it('renders in view mode when editingItem is provided and isViewMode is true', () => {
    renderWithProviders(
      <WasteDisposalModal
        open={true}
        onClose={mockOnClose}
        editingItem={mockItem as any}
        isViewMode={true}
        canEdit={true}
        targetWasteService={mockServices[0] as any}
        services={mockServices as any}
        clients={mockClients as any}
        projects={[]}
        invoices={[]}
        onSave={mockOnSave}
        isSaving={false}
        setErrorDialogState={mockSetError}
      />
    );

    // Header has view title
    expect(screen.getByText('subTabWasteDisposal')).toBeInTheDocument();

    // Footer actions
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.getByText('btnClose')).toBeInTheDocument();

    // Inputs are disabled
    expect(screen.getByTestId('client-autocomplete')).toBeDisabled();
  });

  it('toggles in-place from view to edit mode and cancels back', () => {
    renderWithProviders(
      <WasteDisposalModal
        open={true}
        onClose={mockOnClose}
        editingItem={mockItem as any}
        initialMode="view"
        canEdit={true}
        targetWasteService={mockServices[0] as any}
        services={mockServices as any}
        clients={mockClients as any}
        projects={[]}
        invoices={[]}
        onSave={mockOnSave}
        isSaving={false}
        setErrorDialogState={mockSetError}
      />
    );

    expect(screen.getByText('btnEdit')).toBeInTheDocument();

    // Click Edit
    fireEvent.click(screen.getByText('btnEdit'));

    expect(screen.getByText('modalEditWasteDisposal')).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
    expect(screen.getByText('btnCancel')).toBeInTheDocument();
    expect(screen.getByTestId('client-autocomplete')).not.toBeDisabled();

    // Click Cancel
    fireEvent.click(screen.getByText('btnCancel'));

    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.getByTestId('client-autocomplete')).toBeDisabled();
  });

  it('submits updated payload when saved', async () => {
    renderWithProviders(
      <WasteDisposalModal
        open={true}
        onClose={mockOnClose}
        editingItem={mockItem as any}
        initialMode="edit"
        canEdit={true}
        targetWasteService={mockServices[0] as any}
        services={mockServices as any}
        clients={mockClients as any}
        projects={[]}
        invoices={[]}
        onSave={mockOnSave}
        isSaving={false}
        setErrorDialogState={mockSetError}
      />
    );

    fireEvent.click(screen.getByText('btnSave'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'wd-50',
          serviceId: 'srv-w1',
          clientId: 'c-10',
        })
      );
    });
  });

  it('renders Delete button in view mode when canDelete is true', () => {
    renderWithProviders(
      <WasteDisposalModal
        open={true}
        onClose={mockOnClose}
        editingItem={mockItem as any}
        initialMode="view"
        canDelete={true}
        onDelete={mockOnDelete}
        targetWasteService={mockServices[0] as any}
        services={mockServices as any}
        clients={mockClients as any}
        projects={[]}
        invoices={[]}
        onSave={mockOnSave}
        isSaving={false}
        setErrorDialogState={mockSetError}
      />
    );

    const deleteBtn = screen.getByText('btnDelete');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(mockOnDelete).toHaveBeenCalledWith('wd-50');
  });
});
