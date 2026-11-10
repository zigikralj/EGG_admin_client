import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContractModal } from './ContractModal';
import type { Contract } from '../../types';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 'admin-1', name: 'Admin', role: 'Administrator' },
    hasPermission: () => true,
    isRestrictedToOwn: () => false,
  }),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (k: string, params?: Record<string, any>) => {
      if (params) {
        let str = k;
        for (const [pKey, pVal] of Object.entries(params)) {
          str = str.replace(`{${pKey}}`, String(pVal));
        }
        return str;
      }
      return k;
    },
    getResponsibleLabel: () => 'Responsible Person',
  }),
}));

vi.mock('../../queries', () => ({
  useCompanyInfoQuery: () => ({
    data: {
      legalName: 'EKOS GREEN GROUP DOO Kraljevo',
      taxId: '113207057',
      registrationNumber: '21823759',
      city: 'Kraljevo',
    },
  }),
  useContractTemplatesSummaryQuery: () => ({
    data: [
      {
        id: 'tpl-1',
        name: 'Confidentiality Clause',
        category: 'NDA',
        description: 'Standard NDA clause',
        content: '<p>NDA Content</p>',
      },
    ],
  }),
}));

vi.mock('../common/autocomplete', () => ({
  ClientAutocomplete: ({ value, onChange, label }: any) => (
    <input
      data-testid="mock-client-autocomplete"
      placeholder={label}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  ProjectAutocomplete: ({ value, onChange, label }: any) => (
    <input
      data-testid="mock-project-autocomplete"
      placeholder={label}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  UserAutocomplete: ({ value, onChange, label }: any) => (
    <input
      data-testid="mock-user-autocomplete"
      placeholder={label}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('../common/tiptap/TipTapEditor', () => ({
  TipTapEditor: ({ value, onChange, extraToolbarActions }: any) => (
    <div data-testid="mock-tiptap-editor">
      <div data-testid="mock-toolbar-actions">{extraToolbarActions}</div>
      <textarea
        data-testid="mock-editor-textarea"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  ),
}));

const mockContract: Contract = {
  id: 'c-101',
  contractNumber: 'UGOV-2026-999',
  title: 'Hazardous Waste Management Agreement',
  clientId: 'client-1',
  clientName: 'Eco Partner DOO',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  status: 'Active',
  content: '<p>This is the full text of the agreement between the parties.</p>',
  notes: 'Priority client contract notes',
  reminders: [
    {
      id: 'rem-auto-1',
      title: 'Auto 45d Expiration Reminder',
      dueDate: '2026-11-16',
      status: 'Pending',
      isAutoContractReminder: true,
    },
  ],
};

describe('ContractModal', () => {
  it('renders Details workspace by default with 2-column layout and document summary card', () => {
    render(
      <ContractModal
        open={true}
        onClose={vi.fn()}
        editingContract={mockContract}
        canEdit={true}
        canCreate={true}
        onSave={vi.fn()}
      />
    );

    // Header Workspace Switcher
    expect(screen.getByText('contractTabDetails')).toBeInTheDocument();
    expect(screen.getByText('contractTabDocument')).toBeInTheDocument();

    // Contracting Parties Card
    expect(screen.getByText('contractPartiesTitle')).toBeInTheDocument();
    expect(screen.getByText('EKOS GREEN GROUP DOO Kraljevo')).toBeInTheDocument();
    expect(screen.getByText('Eco Partner DOO')).toBeInTheDocument();

    // Core Metadata
    expect(screen.getByText('contractCoreMetadata')).toBeInTheDocument();
    expect(screen.getAllByText('UGOV-2026-999').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Hazardous Waste Management Agreement').length).toBeGreaterThanOrEqual(1);

    // Internal Notes Card
    expect(screen.getByText('Priority client contract notes')).toBeInTheDocument();

    // Document Summary Card
    expect(screen.getByText('contractDocSummaryTitle')).toBeInTheDocument();
    expect(screen.getByText('btnPreviewDocument')).toBeInTheDocument();
    expect(screen.getByText('btnEditDocument')).toBeInTheDocument();
    expect(screen.getByText('btnPrintPdfA4')).toBeInTheDocument();

    // Reminders
    expect(screen.getByText('contractRemindersTitle')).toBeInTheDocument();
    expect(screen.getByText('contractAutoReminder45dTitle')).toBeInTheDocument();
  });

  it('switches between Details workspace and Editor Studio via header pill and buttons', () => {
    render(
      <ContractModal
        open={true}
        onClose={vi.fn()}
        editingContract={mockContract}
        canEdit={true}
        canCreate={true}
        onSave={vi.fn()}
      />
    );

    // Initial state: details workspace is rendered, editor is not rendered
    expect(screen.queryByTestId('mock-tiptap-editor')).not.toBeInTheDocument();

    // Click "Preview Document" button in Document Summary Card
    const previewBtn = screen.getByText('btnPreviewDocument');
    fireEvent.click(previewBtn);

    // Now in Editor Studio - TipTap and permanent side panel are rendered
    expect(screen.getByTestId('mock-tiptap-editor')).toBeInTheDocument();
    expect(screen.getByText(/sidebarDynamicVariables/i)).toBeInTheDocument();

    // Click "contractTabDetails" header pill to switch back
    const detailsPill = screen.getByText('contractTabDetails');
    fireEvent.click(detailsPill);

    // Returned to Details workspace
    expect(screen.getByText('contractPartiesTitle')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-tiptap-editor')).not.toBeInTheDocument();

    // Click "contractTabDocument" header pill
    const docPill = screen.getByText('contractTabDocument');
    fireEvent.click(docPill);

    // Again in Editor Studio
    expect(screen.getByTestId('mock-tiptap-editor')).toBeInTheDocument();
  });
});
