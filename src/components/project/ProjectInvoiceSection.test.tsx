import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectInvoiceSection } from './ProjectInvoiceSection';
import * as LanguageContext from '../../context/LanguageContext';
import * as AuthContext from '../../context/AuthContext';
import type { Invoice } from '../../types';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProjectInvoiceSection', () => {
  const mockInvoiceState: any = {
    isAddingInvoice: false,
    setIsAddingInvoice: vi.fn(),
    addInvoiceMode: 'new',
    setAddInvoiceMode: vi.fn(),
    newInvoiceNumber: '',
    setNewInvoiceNumber: vi.fn(),
    newInvoiceType: 'Standard',
    setNewInvoiceType: vi.fn(),
    newParentInvoiceId: '',
    setNewParentInvoiceId: vi.fn(),
    newInvoiceDateCreated: '',
    setNewInvoiceDateCreated: vi.fn(),
    newInvoiceDueDate: '',
    setNewInvoiceDueDate: vi.fn(),
    newInvoiceCurrency: 'RSD',
    setNewInvoiceCurrency: vi.fn(),
    newInvoiceStatus: 'Draft',
    setNewInvoiceStatus: vi.fn(),
    newInvoiceNotes: '',
    setNewInvoiceNotes: vi.fn(),
    newInvoiceItems: [],
    setNewInvoiceItems: vi.fn(),
    selectedExistingInvoiceId: '',
    setSelectedExistingInvoiceId: vi.fn(),
    editingProjectInvoice: null,
    setEditingProjectInvoice: vi.fn(),
    editInvoiceNumber: '',
    setEditInvoiceNumber: vi.fn(),
    editInvoiceType: 'Standard',
    setEditInvoiceType: vi.fn(),
    editParentInvoiceId: '',
    setEditParentInvoiceId: vi.fn(),
    editInvoiceDateCreated: '',
    setEditInvoiceDateCreated: vi.fn(),
    editInvoiceDueDate: '',
    setEditInvoiceDueDate: vi.fn(),
    editInvoiceStatus: 'Draft',
    setEditInvoiceStatus: vi.fn(),
    editInvoiceCurrency: 'RSD',
    setEditInvoiceCurrency: vi.fn(),
    editInvoiceNotes: '',
    setEditInvoiceNotes: vi.fn(),
    setEditInvoiceItems: vi.fn(),
    projectInvoices: [],
    addStagedInvoice: vi.fn(),
    removeStagedInvoice: vi.fn(),
    updateStagedInvoice: vi.fn(),
  };

  const sampleInvoice: Invoice = {
    id: 'inv-123',
    invoiceNumber: '2026/094',
    invoiceType: 'Standard',
    status: 'Sent',
    totalAmount: 135000,
    currency: 'RSD',
    dateCreated: '2026-09-01',
    dueDate: '2026-09-18',
    notes: 'Sample notes',
    items: [{ id: 'item-1', invoiceId: 'inv-123', description: 'Item 1', quantity: 1, unitPrice: 135000, currency: 'RSD' }],
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });
    (AuthContext.useAuth as any).mockReturnValue({
      currentUser: { id: 'u1', name: 'Admin' },
      hasPermission: () => true,
    });
  });

  it('renders invoice number and calls onViewInvoice when clicking on it or its container', () => {
    const handleViewInvoice = vi.fn();
    const invoiceStateWithInvoice = {
      ...mockInvoiceState,
      projectInvoices: [sampleInvoice],
    };

    render(
      <ProjectInvoiceSection
        projectName="Test Project"
        clientId="c-1"
        clientName="Client 1"
        invoices={[sampleInvoice]}
        setErrorDialogState={vi.fn()}
        invoiceState={invoiceStateWithInvoice}
        onViewInvoice={handleViewInvoice}
      />
    );

    const invoiceNumberEl = screen.getByText('2026/094');
    expect(invoiceNumberEl).toBeInTheDocument();

    fireEvent.click(invoiceNumberEl);
    expect(handleViewInvoice).toHaveBeenCalledWith(sampleInvoice);
  });

  it('calls onViewInvoice when clicking on linked invoice chip', () => {
    const handleViewInvoice = vi.fn();
    const linkedChild: Invoice = {
      id: 'inv-child-1',
      invoiceNumber: '2026/095',
      invoiceType: 'Advance',
      status: 'Paid',
    } as any;

    const invoiceWithLinked: Invoice = {
      ...sampleInvoice,
      childInvoices: [linkedChild],
    };

    const invoiceStateWithInvoice = {
      ...mockInvoiceState,
      projectInvoices: [invoiceWithLinked],
    };

    render(
      <ProjectInvoiceSection
        projectName="Test Project"
        clientId="c-1"
        clientName="Client 1"
        invoices={[invoiceWithLinked]}
        setErrorDialogState={vi.fn()}
        invoiceState={invoiceStateWithInvoice}
        onViewInvoice={handleViewInvoice}
      />
    );

    const linkedChipText = screen.getByText(/2026\/095/);
    expect(linkedChipText).toBeInTheDocument();

    fireEvent.click(linkedChipText);
    expect(handleViewInvoice).toHaveBeenCalledWith(linkedChild);
  });
});

