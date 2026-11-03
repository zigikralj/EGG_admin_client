import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceFormFields } from './InvoiceFormFields';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

describe('InvoiceFormFields', () => {
  const mockTranslations: Record<string, string> = {
    lblInvoiceNumber: 'Invoice Number',
    phInvoiceNumber: 'e.g. 2024-001',
    lblInvoiceType: 'Invoice Type',
    typeStandard: 'Standard',
    typeAdvance: 'Advance',
    typeFinal: 'Final',
    typePartial: 'Partial',
    lblInvoiceStatus: 'Invoice Status',
    statusDraft: 'Draft',
    statusSent: 'Sent',
    statusPaid: 'Paid',
    statusOverdue: 'Overdue',
    statusCancelled: 'Cancelled',
    lblParentInvoice: 'Parent Invoice',
    phSelectParentInvoice: 'Select...',
    lblCurrency: 'Currency',
    lblDateCreated: 'Date Created',
    lblDueDate: 'Due Date',
  };

  beforeEach(() => {
    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => mockTranslations[key] || key,
      language: 'en',
      setLanguage: vi.fn(),
    });
  });

  it('renders without MUI out-of-range warnings for standard type and draft status', () => {
    const errorSpy = vi.spyOn(console, 'error');
    const warnSpy = vi.spyOn(console, 'warn');

    render(
      <InvoiceFormFields
        invoiceNumber="INV-001"
        onInvoiceNumberChange={vi.fn()}
        invoiceType="standard"
        onInvoiceTypeChange={vi.fn()}
        invoiceStatus="draft"
        onInvoiceStatusChange={vi.fn()}
        parentInvoiceOptions={[]}
        parentInvoiceGroupBy={vi.fn()}
        parentInvoiceGetOptionLabel={vi.fn()}
        parentInvoiceId=""
        onParentInvoiceIdChange={vi.fn()}
        currency="RSD"
        onCurrencyChange={vi.fn()}
        dateCreated="2026-11-04"
        onDateCreatedChange={vi.fn()}
        dueDate="2026-11-18"
        onDueDateChange={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('INV-001')).toBeInTheDocument();

    // Verify MUI did not log out-of-range warnings
    const outOfRangeLogs = [...errorSpy.mock.calls, ...warnSpy.mock.calls].filter((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('out-of-range value'))
    );
    expect(outOfRangeLogs).toHaveLength(0);

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
