import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityLogsDialogs } from './ActivityLogsDialogs';
import type { DeleteDialogState } from './types';

describe('ActivityLogsDialogs component', () => {
  const mockT = (key: string) => key;

  const defaultProps = {
    deleteDialog: { isOpen: false, type: 'all' } as DeleteDialogState,
    onCloseDeleteDialog: vi.fn(),
    onConfirmDelete: vi.fn(),
    confirmDeactivateOpen: false,
    onCloseDeactivateDialog: vi.fn(),
    onConfirmDeactivate: vi.fn(),
    customRetentionOpen: false,
    onCloseCustomRetentionDialog: vi.fn(),
    onSubmitCustomRetention: vi.fn(),
    customDaysInput: '90',
    onCustomDaysInputChange: vi.fn(),
    isCustomRetentionPending: false,
    language: 'en',
    t: mockT
  };

  it('renders Clear All Delete Confirmation Dialog and handles confirm', () => {
    const handleConfirmDelete = vi.fn();
    const handleClose = vi.fn();

    render(
      <ActivityLogsDialogs
        {...defaultProps}
        deleteDialog={{ isOpen: true, type: 'all' }}
        onConfirmDelete={handleConfirmDelete}
        onCloseDeleteDialog={handleClose}
      />
    );

    expect(screen.getByText('Clear All Activity Logs')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete ALL activity logs/i)).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteBtn);
    expect(handleConfirmDelete).toHaveBeenCalled();
  });

  it('renders Session Delete Confirmation Dialog', () => {
    render(
      <ActivityLogsDialogs
        {...defaultProps}
        deleteDialog={{ isOpen: true, type: 'session', label: 'Session #1 (Alice)' }}
      />
    );

    expect(screen.getByText('Delete Session')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete all activity logs for Session #1 \(Alice\)/i)).toBeInTheDocument();
  });

  it('renders Deactivate Confirmation Dialog', () => {
    const handleConfirmDeactivate = vi.fn();

    render(
      <ActivityLogsDialogs
        {...defaultProps}
        confirmDeactivateOpen={true}
        onConfirmDeactivate={handleConfirmDeactivate}
      />
    );

    expect(screen.getByText('activityLogsDeactivateTitle')).toBeInTheDocument();
    expect(screen.getByText('activityLogsDeactivateMessage')).toBeInTheDocument();

    const deactivateBtn = screen.getByRole('button', { name: 'Deactivate' });
    fireEvent.click(deactivateBtn);
    expect(handleConfirmDeactivate).toHaveBeenCalled();
  });

  it('renders Custom Retention Dialog and allows saving when valid', () => {
    const handleSubmitCustomRetention = vi.fn();
    const handleDaysChange = vi.fn();

    render(
      <ActivityLogsDialogs
        {...defaultProps}
        customRetentionOpen={true}
        customDaysInput="120"
        onCustomDaysInputChange={handleDaysChange}
        onSubmitCustomRetention={handleSubmitCustomRetention}
      />
    );

    expect(screen.getByText('retentionCustomTitle')).toBeInTheDocument();
    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);
    expect(handleSubmitCustomRetention).toHaveBeenCalled();
  });

  it('disables Save button on invalid retention days', () => {
    render(
      <ActivityLogsDialogs
        {...defaultProps}
        customRetentionOpen={true}
        customDaysInput="0"
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();
  });
});
