import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReminderPanel } from './ReminderPanel';
import { renderWithProviders } from '../../tests/test-utils';

describe('ReminderPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockReminders = [
    {
      id: 'rem-1',
      title: 'Audit Preparation',
      projectName: 'Main Facility',
      clientName: 'Eco Client',
      dueDate: '2026-06-01',
      status: 'Pending',
      responsible: 'Alice',
    },
  ];

  it('renders reminder list and opens ReminderModal in view mode when clicking a reminder', async () => {
    renderWithProviders(
      <ReminderPanel
        reminders={mockReminders as any}
        clients={[]}
        projects={[]}
        users={[]}
      />
    );

    expect(screen.getByText('Audit Preparation')).toBeInTheDocument();

    // Click on reminder item
    fireEvent.click(screen.getByText('Audit Preparation'));

    // Unified ReminderModal should open in view mode
    await waitFor(() => {
      expect(screen.getByText('btnEdit')).toBeInTheDocument();
      expect(screen.getByText('btnClose')).toBeInTheDocument();
    });
  });

  it('opens ReminderModal in create mode when openNewReminderTrigger is fired', async () => {
    const handleHandled = vi.fn();
    const { rerender } = renderWithProviders(
      <ReminderPanel
        reminders={[]}
        clients={[]}
        projects={[]}
        users={[]}
        openNewReminderTrigger={0}
        onNewReminderTriggerHandled={handleHandled}
      />
    );

    rerender(
      <ReminderPanel
        reminders={[]}
        clients={[]}
        projects={[]}
        users={[]}
        openNewReminderTrigger={1}
        onNewReminderTriggerHandled={handleHandled}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('modalNewReminder')).toBeInTheDocument();
      expect(screen.getByText('btnSave')).toBeInTheDocument();
      expect(handleHandled).toHaveBeenCalled();
    });
  });
});
