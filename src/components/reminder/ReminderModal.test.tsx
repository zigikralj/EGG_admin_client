import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReminderModal } from './ReminderModal';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../common/autocomplete', () => ({
  ProjectAutocomplete: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="project-autocomplete"
      placeholder={placeholder}
      value={typeof value === 'object' ? value?.name || '' : value || ''}
      onChange={(e) => onChange(e.target.value, { id: 'p-' + e.target.value, name: e.target.value })}
    />
  ),
  ClientAutocomplete: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="client-autocomplete"
      placeholder={placeholder}
      value={typeof value === 'object' ? value?.name || '' : value || ''}
      onChange={(e) => onChange(e.target.value, { id: 'c-' + e.target.value, name: e.target.value })}
    />
  ),
  PermitAutocomplete: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="permit-autocomplete"
      placeholder={placeholder}
      value={typeof value === 'object' ? value?.permitNumber || '' : value || ''}
      onChange={(e) => onChange(e.target.value, { id: 'pm-' + e.target.value, permitNumber: e.target.value })}
    />
  ),
  UserAutocomplete: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="user-autocomplete"
      placeholder={placeholder}
      value={typeof value === 'object' ? value?.name || '' : value || ''}
      onChange={(e) => onChange(e.target.value, { id: 'u-' + e.target.value, name: e.target.value })}
    />
  ),
}));

describe('ReminderModal (Unified View/Edit/Create)', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn().mockResolvedValue(true);
  const mockOnDelete = vi.fn();

  const mockReminder = {
    id: 'rem-1',
    title: 'Renew Environmental License',
    projectId: 'p1',
    projectName: 'Factory Cleanliness',
    clientId: 'c1',
    clientName: 'Green Enterprise',
    permitId: 'pm1',
    permitNumber: 'PERMIT-2026-X',
    responsibleId: 'u1',
    responsible: 'John Doe',
    status: 'Pending',
    dueDate: '2026-05-15',
    notes: 'Important renewal reminder for the facility',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders in create mode when editingReminder is null', () => {
    render(
      <ReminderModal
        open={true}
        onClose={mockOnClose}
        editingReminder={null}
        onSave={mockOnSave}
      />
    );

    // Header has create title
    expect(screen.getByText('modalNewReminder')).toBeInTheDocument();
    // Inputs are rendered
    expect(screen.getByPlaceholderText('phReminderTitle')).toBeInTheDocument();
    expect(screen.getByTestId('project-autocomplete')).toBeInTheDocument();
    expect(screen.getByTestId('client-autocomplete')).toBeInTheDocument();
    // Action buttons
    expect(screen.getByText('btnSave')).toBeInTheDocument();
    expect(screen.getByText('btnCancel')).toBeInTheDocument();
  });

  it('renders in view mode when editingReminder is provided', () => {
    render(
      <ReminderModal
        open={true}
        onClose={mockOnClose}
        editingReminder={mockReminder}
        onSave={mockOnSave}
        canEdit={true}
      />
    );

    // Displays values in view fields
    expect(screen.getAllByText('Renew Environmental License').length).toBeGreaterThan(0);
    expect(screen.getByText('Factory Cleanliness')).toBeInTheDocument();
    expect(screen.getByText('Green Enterprise')).toBeInTheDocument();
    expect(screen.getByText('PERMIT-2026-X')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Important renewal reminder for the facility')).toBeInTheDocument();

    // Has Edit button and Close button in footer
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.getByText('btnClose')).toBeInTheDocument();
  });

  it('switches between view and edit mode in-place without unmounting', async () => {
    render(
      <ReminderModal
        open={true}
        onClose={mockOnClose}
        editingReminder={mockReminder}
        onSave={mockOnSave}
        canEdit={true}
      />
    );

    // Initially in view mode
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('phReminderTitle')).not.toBeInTheDocument();

    // Click Edit button
    fireEvent.click(screen.getByText('btnEdit'));

    // Now in edit mode
    expect(screen.getByText('modalEditReminder')).toBeInTheDocument();
    const titleInput = screen.getByPlaceholderText('phReminderTitle') as HTMLInputElement;
    expect(titleInput).toBeInTheDocument();
    expect(titleInput.value).toBe('Renew Environmental License');

    // Click Cancel button -> should switch back to view mode
    fireEvent.click(screen.getByText('btnCancel'));
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('phReminderTitle')).not.toBeInTheDocument();
  });

  it('submits updated reminder data on save in edit mode', async () => {
    render(
      <ReminderModal
        open={true}
        onClose={mockOnClose}
        editingReminder={mockReminder}
        onSave={mockOnSave}
        initialMode="edit"
        canEdit={true}
      />
    );

    const titleInput = screen.getByPlaceholderText('phReminderTitle');
    fireEvent.change(titleInput, { target: { value: 'Updated License Title' } });

    fireEvent.click(screen.getByText('btnSave'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'rem-1',
          title: 'Updated License Title',
          projectName: 'Factory Cleanliness',
        })
      );
    });
  });

  it('shows Delete button in view mode when canDelete is true and invokes onDelete', () => {
    render(
      <ReminderModal
        open={true}
        onClose={mockOnClose}
        editingReminder={mockReminder}
        onSave={mockOnSave}
        canDelete={true}
        onDelete={mockOnDelete}
      />
    );

    const deleteBtn = screen.getByText('btnDelete');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(mockOnDelete).toHaveBeenCalledWith('rem-1');
  });

  it('calls onClose when close button is clicked in view mode', () => {
    render(
      <ReminderModal
        open={true}
        onClose={mockOnClose}
        editingReminder={mockReminder}
        onSave={mockOnSave}
      />
    );

    fireEvent.click(screen.getByText('btnClose'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
