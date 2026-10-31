import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceModal } from './InvoiceModal';
import * as LanguageContext from '../../context/LanguageContext';
import * as AuthContext from '../../context/AuthContext';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../common/autocomplete', () => ({
  ClientAutocomplete: ({ value, onChange }: any) => (
    <input
      data-testid="client-autocomplete"
      value={value || ''}
      onChange={(e) => onChange(e.target.value, { id: e.target.value, name: 'Client ' + e.target.value })}
    />
  ),
  ProjectAutocomplete: ({ value, onChange }: any) => (
    <input
      data-testid="project-autocomplete"
      value={value || ''}
      onChange={(e) => onChange(e.target.value, { id: e.target.value, name: 'Project ' + e.target.value })}
    />
  ),
  InvoiceAutocomplete: ({ value, onChange }: any) => (
    <input
      data-testid="invoice-autocomplete"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  ProvidedServiceAutocomplete: ({ value, onChange }: any) => (
    <input
      data-testid="ps-autocomplete"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('InvoiceModal (Unified View/Edit/Create)', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn().mockResolvedValue(true);
  const mockOnToggleEditMode = vi.fn();

  const mockInvoice: any = {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    invoiceType: 'Standard',
    status: 'Sent',
    currency: 'RSD',
    dateCreated: '2026-01-10',
    dueDate: '2026-02-10',
    paymentDate: '',
    clientId: 'c1',
    clientName: 'Eco Client',
    projectId: 'p1',
    projectName: 'Eco Project',
    notes: 'Test invoice notes',
    items: [
      { description: 'Service Item 1', quantity: 2, unitPrice: 1000, currency: 'RSD' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });

    (AuthContext.useAuth as any).mockReturnValue({
      currentUser: { id: 'u1', name: 'Marko' },
      hasPermission: () => true,
    });
  });

  it('renders in view mode by default when editingInvoice is passed', () => {
    render(
      <InvoiceModal
        open={true}
        onClose={mockOnClose}
        editingInvoice={mockInvoice}
        onSave={mockOnSave}
      />
    );

    expect(screen.getAllByText('INV-2026-001')[0]).toBeInTheDocument();
    expect(screen.getByText('Eco Client')).toBeInTheDocument();
    expect(screen.getByText('Eco Project')).toBeInTheDocument();
    expect(screen.getByText('Service Item 1')).toBeInTheDocument();
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.getByText('btnClose')).toBeInTheDocument();
  });

  it('switches to edit mode in-place when Edit button is clicked', () => {
    render(
      <InvoiceModal
        open={true}
        onClose={mockOnClose}
        editingInvoice={mockInvoice}
        onSave={mockOnSave}
        onToggleEditMode={mockOnToggleEditMode}
      />
    );

    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    fireEvent.click(screen.getByText('btnEdit'));

    expect(mockOnToggleEditMode).toHaveBeenCalled();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
    expect(screen.getByText('btnCancel')).toBeInTheDocument();
  });

  it('reverts back to view mode when Cancel is clicked in edit mode', () => {
    render(
      <InvoiceModal
        open={true}
        onClose={mockOnClose}
        editingInvoice={mockInvoice}
        initialMode="edit"
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('btnSave')).toBeInTheDocument();
    const cancelBtn = screen.getByText('btnCancel');
    fireEvent.click(cancelBtn);

    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.getByText('btnClose')).toBeInTheDocument();
  });

  it('renders in create mode when editingInvoice is null and closes on Cancel', () => {
    render(
      <InvoiceModal
        open={true}
        onClose={mockOnClose}
        editingInvoice={null}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('modalNewInvoice')).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();

    const cancelBtn = screen.getByText('btnCancel');
    fireEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('submits form via onSave when Save is clicked', async () => {
    render(
      <InvoiceModal
        open={true}
        onClose={mockOnClose}
        editingInvoice={mockInvoice}
        initialMode="edit"
        onSave={mockOnSave}
      />
    );

    const saveBtn = screen.getByText('btnSave');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'inv-1',
          invoiceNumber: 'INV-2026-001',
        }),
        expect.anything(),
        expect.anything()
      );
    });
  });
});
