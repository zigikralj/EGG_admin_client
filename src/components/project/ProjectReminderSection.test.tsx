import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectReminderSection } from './ProjectReminderSection';
import * as LanguageContext from '../../context/LanguageContext';
import * as AuthContext from '../../context/AuthContext';
import type { Reminder } from '../../types';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProjectReminderSection', () => {
  const mockReminderState: any = {
    isAddingReminder: false,
    setIsAddingReminder: vi.fn(),
    addReminderMode: 'new',
    setAddReminderMode: vi.fn(),
    newReminderTitle: '',
    setNewReminderTitle: vi.fn(),
    newReminderDate: '',
    setNewReminderDate: vi.fn(),
    newReminderResponsible: '',
    setNewReminderResponsible: vi.fn(),
    newReminderNotes: '',
    setNewReminderNotes: vi.fn(),
    selectedExistingReminderId: '',
    setSelectedExistingReminderId: vi.fn(),
    editingProjectReminder: null,
    setEditingProjectReminder: vi.fn(),
    editReminderTitle: '',
    setEditReminderTitle: vi.fn(),
    editReminderDate: '',
    setEditReminderDate: vi.fn(),
    editReminderStatus: 'Pending',
    setEditReminderStatus: vi.fn(),
    editReminderResponsible: '',
    setEditReminderResponsible: vi.fn(),
    editReminderNotes: '',
    setEditReminderNotes: vi.fn(),
    projectReminders: [],
    addStagedReminder: vi.fn(),
    removeStagedReminder: vi.fn(),
    updateStagedReminder: vi.fn(),
    toggleStagedReminderStatus: vi.fn(),
  };

  const sampleReminder: Reminder = {
    id: 'rem-123',
    title: 'Follow up with client on permit',
    dueDate: '2026-10-15',
    status: 'Pending',
    responsible: 'Marko',
    notes: 'Check all documents',
  } as any;

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

  it('renders reminder title and calls onViewReminder when clicking on it or its container', () => {
    const handleViewReminder = vi.fn();
    const reminderStateWithReminder = {
      ...mockReminderState,
      projectReminders: [sampleReminder],
    };

    render(
      <ProjectReminderSection
        projectName="Test Project"
        clientId="c-1"
        clientName="Client 1"
        responsible="Marko"
        reminders={[sampleReminder]}
        setErrorDialogState={vi.fn()}
        reminderState={reminderStateWithReminder}
        onViewReminder={handleViewReminder}
      />
    );

    const reminderTitleEl = screen.getByText('Follow up with client on permit');
    expect(reminderTitleEl).toBeInTheDocument();

    fireEvent.click(reminderTitleEl);
    expect(handleViewReminder).toHaveBeenCalledWith(sampleReminder);
  });
});

