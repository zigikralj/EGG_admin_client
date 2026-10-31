import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProvidedServiceModal } from './ProvidedServiceModal';
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

vi.mock('./ProvidedServiceInvoiceSection', () => ({
  ProvidedServiceInvoiceSection: () => <div data-testid="invoice-section" />,
}));

describe('ProvidedServiceModal (Unified View/Edit/Create)', () => {
  const mockOnClose = vi.fn();
  const mockOnSaveProvidedService = vi.fn().mockResolvedValue({ success: true });
  const mockOnSaveInvoice = vi.fn().mockResolvedValue({ success: true });
  const mockOnDeleteInvoice = vi.fn().mockResolvedValue(undefined);
  const mockOnStatusChangeInvoice = vi.fn().mockResolvedValue(undefined);
  const mockOnDeleteProvidedService = vi.fn();
  const mockGetCustomModel = vi.fn().mockReturnValue([]);

  const mockServices = [
    { id: 'srv-1', name: 'Soil Quality Testing', code: 'soil-test', group: 'Testing', frequency: 1 },
  ];

  const mockClients = [
    { id: 'c-1', name: 'Agro Delta' },
  ];

  const mockItem = {
    id: 'ps-100',
    serviceId: 'srv-1',
    service: mockServices[0],
    clientId: 'c-1',
    client: mockClients[0],
    clientName: 'Agro Delta',
    projectId: 'p-1',
    project: { id: 'p-1', name: 'Field 42' } as any,
    status: 'Planned',
    location: 'Plot B',
    scheduledDate: '2026-07-01T00:00:00Z',
    completionDate: '',
    notes: 'Sample collection protocol Alpha',
    customData: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in create mode when editingItem is null', () => {
    renderWithProviders(
      <ProvidedServiceModal
        open={true}
        onClose={mockOnClose}
        editingItem={null}
        services={mockServices as any}
        clients={mockClients as any}
        onSaveProvidedService={mockOnSaveProvidedService}
        onSaveInvoice={mockOnSaveInvoice}
        onDeleteInvoice={mockOnDeleteInvoice}
        onStatusChangeInvoice={mockOnStatusChangeInvoice}
        getCustomModelForService={mockGetCustomModel}
      />
    );

    expect(screen.getByText('modalNewProvidedService')).toBeInTheDocument();
    expect(screen.getByTestId('service-autocomplete')).toBeInTheDocument();
    expect(screen.getByTestId('client-autocomplete')).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
    expect(screen.getByText('btnCancel')).toBeInTheDocument();
  });

  it('renders in view mode when editingItem is provided', () => {
    renderWithProviders(
      <ProvidedServiceModal
        open={true}
        onClose={mockOnClose}
        editingItem={mockItem as any}
        services={mockServices as any}
        clients={mockClients as any}
        canEdit={true}
        onSaveProvidedService={mockOnSaveProvidedService}
        onSaveInvoice={mockOnSaveInvoice}
        onDeleteInvoice={mockOnDeleteInvoice}
        onStatusChangeInvoice={mockOnStatusChangeInvoice}
        getCustomModelForService={mockGetCustomModel}
      />
    );

    // Displays service name as title
    expect(screen.getByText('Soil Quality Testing')).toBeInTheDocument();
    // Has Edit button and Close button
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.getByText('btnClose')).toBeInTheDocument();

    // Inputs are disabled in view mode
    expect(screen.getByTestId('service-autocomplete')).toBeDisabled();
    expect(screen.getByTestId('client-autocomplete')).toBeDisabled();
  });

  it('toggles in-place between view and edit mode', async () => {
    renderWithProviders(
      <ProvidedServiceModal
        open={true}
        onClose={mockOnClose}
        editingItem={mockItem as any}
        services={mockServices as any}
        clients={mockClients as any}
        canEdit={true}
        onSaveProvidedService={mockOnSaveProvidedService}
        onSaveInvoice={mockOnSaveInvoice}
        onDeleteInvoice={mockOnDeleteInvoice}
        onStatusChangeInvoice={mockOnStatusChangeInvoice}
        getCustomModelForService={mockGetCustomModel}
      />
    );

    expect(screen.getByText('btnEdit')).toBeInTheDocument();

    // Click Edit button
    fireEvent.click(screen.getByText('btnEdit'));

    // Mode switched to edit: title changes to modalEditProvidedService, buttons are Cancel and Save
    expect(screen.getByText('modalEditProvidedService')).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
    expect(screen.getByText('btnCancel')).toBeInTheDocument();
    expect(screen.getByTestId('service-autocomplete')).not.toBeDisabled();

    // Click Cancel -> returns to view mode
    fireEvent.click(screen.getByText('btnCancel'));
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.getByTestId('service-autocomplete')).toBeDisabled();
  });

  it('submits updated data on save in edit mode', async () => {
    renderWithProviders(
      <ProvidedServiceModal
        open={true}
        onClose={mockOnClose}
        editingItem={mockItem as any}
        initialMode="edit"
        services={mockServices as any}
        clients={mockClients as any}
        canEdit={true}
        onSaveProvidedService={mockOnSaveProvidedService}
        onSaveInvoice={mockOnSaveInvoice}
        onDeleteInvoice={mockOnDeleteInvoice}
        onStatusChangeInvoice={mockOnStatusChangeInvoice}
        getCustomModelForService={mockGetCustomModel}
      />
    );

    fireEvent.click(screen.getByText('btnSave'));

    await waitFor(() => {
      expect(mockOnSaveProvidedService).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ps-100',
          serviceId: 'srv-1',
          clientId: 'c-1',
        })
      );
    });
  });

  it('renders Delete button in view mode when canDelete is true', () => {
    renderWithProviders(
      <ProvidedServiceModal
        open={true}
        onClose={mockOnClose}
        editingItem={mockItem as any}
        services={mockServices as any}
        clients={mockClients as any}
        canDelete={true}
        onDeleteProvidedService={mockOnDeleteProvidedService}
        onSaveProvidedService={mockOnSaveProvidedService}
        onSaveInvoice={mockOnSaveInvoice}
        onDeleteInvoice={mockOnDeleteInvoice}
        onStatusChangeInvoice={mockOnStatusChangeInvoice}
        getCustomModelForService={mockGetCustomModel}
      />
    );

    const deleteBtn = screen.getByText('btnDelete');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(mockOnDeleteProvidedService).toHaveBeenCalledWith('ps-100');
    expect(mockOnClose).toHaveBeenCalled();
  });
});
