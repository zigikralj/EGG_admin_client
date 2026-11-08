import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectModal } from './ProjectModal';
import * as LanguageContext from '../../context/LanguageContext';
import * as AuthContext from '../../context/AuthContext';
import * as Queries from '../../queries';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../queries', () => ({
  useProjectsMutations: vi.fn(),
  useRemindersMutations: vi.fn(),
  useInvoicesMutations: vi.fn(),
  useProjectDetailsQuery: vi.fn(),
  useInvoiceDetailsQuery: vi.fn(),
  useProjectUpdatesDiffQuery: vi.fn(),
}));

vi.mock('../common/tiptap/TipTapEditor', () => ({
  TipTapEditor: ({ value, onChange, editable = true }: any) => (
    <div data-testid="tiptap-editor" data-editable={String(editable)}>
      <textarea
        data-testid="tiptap-textarea"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!editable}
      />
    </div>
  ),
}));

vi.mock('../common/autocomplete', () => ({
  ClientAutocomplete: ({ value, onChange }: any) => (
    <input
      data-testid="client-autocomplete"
      value={value || ''}
      onChange={(e) => onChange(e.target.value, { id: e.target.value, name: 'Client ' + e.target.value })}
    />
  ),
  UserAutocomplete: ({ value, onChange }: any) => (
    <input
      data-testid="user-autocomplete"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  ServiceAutocomplete: ({ value, onChange }: any) => (
    <input
      data-testid="service-autocomplete"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('./ProjectInvoiceSection', () => ({
  ProjectInvoiceSection: ({ onViewInvoice, invoices }: any) => (
    <div data-testid="project-invoice-section">
      Invoice Section
      {invoices?.map((inv: any) => (
        <button key={inv.id} data-testid={`view-invoice-${inv.id}`} onClick={() => onViewInvoice?.(inv)}>
          {inv.invoiceNumber}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./ProjectReminderSection', () => ({
  ProjectReminderSection: ({ onViewReminder, reminders }: any) => (
    <div data-testid="project-reminder-section">
      Reminder Section
      {reminders?.map((rem: any) => (
        <button key={rem.id} data-testid={`view-reminder-${rem.id}`} onClick={() => onViewReminder?.(rem)}>
          {rem.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../invoice/InvoiceModal', () => ({
  InvoiceModal: ({ open, editingInvoice }: any) =>
    open ? <div data-testid="invoice-details-modal">Invoice Details: {editingInvoice?.invoiceNumber}</div> : null,
  default: ({ open, editingInvoice }: any) =>
    open ? <div data-testid="invoice-details-modal">Invoice Details: {editingInvoice?.invoiceNumber}</div> : null,
}));

vi.mock('../reminder/ReminderModal', () => ({
  ReminderModal: ({ open, editingReminder }: any) =>
    open ? <div data-testid="reminder-details-modal">Reminder Details: {editingReminder?.title}</div> : null,
  default: ({ open, editingReminder }: any) =>
    open ? <div data-testid="reminder-details-modal">Reminder Details: {editingReminder?.title}</div> : null,
}));

vi.mock('../history', () => ({
  HistoryTimelineModal: ({ open }: any) => (open ? <div data-testid="history-modal">History Modal</div> : null),
}));

describe('ProjectModal (Unified View/Edit/Create)', () => {
  const mockOnClose = vi.fn();
  const mockOnEdit = vi.fn();
  const mockHandleSave = vi.fn().mockResolvedValue({ success: true, id: 'proj-1' });
  const mockHandleDelete = vi.fn();
  const mockToggleDone = vi.fn();

  const mockProject: any = {
    id: 'proj-1',
    name: 'Ekos Cleanup Project',
    clientId: 'client-1',
    clientName: 'Green Enterprise',
    responsible: 'Marko',
    type: 'waste_disposal',
    start: '2026-01-01',
    deadline: '2026-06-01',
    progress: 45,
    done: false,
    notes: '<p>Initial project notes</p>',
    reminders: [],
    invoices: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
      getServiceLabel: (code: string) => code,
      getResponsibleLabel: (name: string) => name,
      getErrorMessage: (msg: string) => msg,
    });

    (AuthContext.useAuth as any).mockReturnValue({
      currentUser: { id: 'u1', name: 'Marko' },
      canEditProject: () => true,
      canDeleteProject: () => true,
      canManageInvoices: true,
      hasPermission: vi.fn().mockReturnValue(true),
    });

    (Queries.useProjectsMutations as any).mockReturnValue({
      handleSave: mockHandleSave,
      handleDelete: mockHandleDelete,
      handleSaveNote: vi.fn().mockResolvedValue({ success: true }),
      toggleDoneMutation: { mutate: mockToggleDone, mutateAsync: mockToggleDone },
    });

    (Queries.useRemindersMutations as any).mockReturnValue({
      handleSave: vi.fn(),
      handleDelete: vi.fn(),
      handleStatusChangeReminder: vi.fn(),
    });

    (Queries.useInvoicesMutations as any).mockReturnValue({
      handleSave: vi.fn(),
      handleDelete: vi.fn(),
      handleUpdateInvoiceStatus: vi.fn(),
    });

    (Queries.useProjectDetailsQuery as any).mockReturnValue({
      data: mockProject,
    });

    (Queries.useInvoiceDetailsQuery as any).mockReturnValue({
      data: null,
    });

    (Queries.useProjectUpdatesDiffQuery as any).mockReturnValue({
      data: null,
      isFetching: false,
    });
  });

  it('renders in view mode by default when existing project is passed', () => {
    render(
      <ProjectModal
        isOpen={true}
        project={mockProject}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('modalViewProject')).toBeInTheDocument();
    expect(screen.getByText('Ekos Cleanup Project')).toBeInTheDocument();
    expect(screen.getByText('Green Enterprise')).toBeInTheDocument();
    expect(screen.getByText('modalEditProject')).toBeInTheDocument();
    expect(screen.getByText('btnClose')).toBeInTheDocument();
  });

  it('switches to edit mode in-place when Edit button is clicked', async () => {
    render(
      <ProjectModal
        isOpen={true}
        project={mockProject}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    // Currently in view mode
    expect(screen.getByText('modalViewProject')).toBeInTheDocument();

    const editBtn = screen.getByText('modalEditProject');
    fireEvent.click(editBtn);

    // Now in edit mode
    expect(screen.getByText('modalEditProject')).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
    expect(screen.getByText('btnCancel')).toBeInTheDocument();
    expect(mockOnEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'proj-1' }));
  });

  it('reverts back to view mode when Cancel is clicked in edit mode', () => {
    render(
      <ProjectModal
        isOpen={true}
        project={mockProject}
        initialMode="edit"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('modalEditProject')).toBeInTheDocument();
    const cancelBtn = screen.getByText('btnCancel');
    fireEvent.click(cancelBtn);

    // Reverted to view mode
    expect(screen.getByText('modalViewProject')).toBeInTheDocument();
  });

  it('renders in create mode when project is null or initialMode="create"', async () => {
    render(
      <ProjectModal
        isOpen={true}
        project={null}
        initialMode="create"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('modalNewProject')).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
    expect(screen.getByText('btnCancel')).toBeInTheDocument();

    const cancelBtn = screen.getByText('btnCancel');
    fireEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('submits form and saves project', async () => {
    render(
      <ProjectModal
        isOpen={true}
        project={mockProject}
        initialMode="edit"
        onClose={mockOnClose}
      />
    );

    const saveBtn = screen.getByText('btnSave');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockHandleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'proj-1',
          name: 'Ekos Cleanup Project',
        }),
        { silent: true }
      );
    });
  });

  it('switches tabs between notes, invoices, and reminders', () => {
    render(
      <ProjectModal
        isOpen={true}
        project={mockProject}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument();

    const invoicesTab = screen.getByText('tabInvoices');
    fireEvent.click(invoicesTab);
    expect(screen.getByTestId('project-invoice-section')).toBeInTheDocument();

    const remindersTab = screen.getByText('tabReminders');
    fireEvent.click(remindersTab);
    expect(screen.getByTestId('project-reminder-section')).toBeInTheDocument();
  });

  it('opens InvoiceModal in details mode when clicking an invoice in the invoices tab', async () => {
    const projectWithInvoice = {
      ...mockProject,
      invoices: [{ id: 'inv-1', invoiceNumber: '2026/094', totalAmount: 1000 }],
    };

    (Queries.useProjectDetailsQuery as any).mockReturnValue({
      data: projectWithInvoice,
    });

    render(
      <ProjectModal
        isOpen={true}
        project={projectWithInvoice}
        onClose={mockOnClose}
      />
    );

    const invoicesTab = screen.getByText('tabInvoices');
    fireEvent.click(invoicesTab);

    const invBtn = screen.getByTestId('view-invoice-inv-1');
    fireEvent.click(invBtn);

    await waitFor(() => {
      expect(screen.getByTestId('invoice-details-modal')).toBeInTheDocument();
      expect(screen.getByText('Invoice Details: 2026/094')).toBeInTheDocument();
    });
  });

  it('opens ReminderModal in details mode when clicking a reminder in the reminders tab', async () => {
    const projectWithReminder = {
      ...mockProject,
      reminders: [{ id: 'rem-1', title: 'Prepare documentation' }],
    };

    (Queries.useProjectDetailsQuery as any).mockReturnValue({
      data: projectWithReminder,
    });

    render(
      <ProjectModal
        isOpen={true}
        project={projectWithReminder}
        onClose={mockOnClose}
      />
    );

    const remindersTab = screen.getByText('tabReminders');
    fireEvent.click(remindersTab);

    const remBtn = screen.getByTestId('view-reminder-rem-1');
    fireEvent.click(remBtn);

    await waitFor(() => {
      expect(screen.getByTestId('reminder-details-modal')).toBeInTheDocument();
      expect(screen.getByText('Reminder Details: Prepare documentation')).toBeInTheDocument();
    });
  });
});
