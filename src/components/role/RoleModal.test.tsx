import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoleModal } from './RoleModal';
import { renderWithProviders } from '../../tests/test-utils';

describe('RoleModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    role: null,
    canAssignSystemAdmin: true,
  };

  const renderModal = (props = {}) => {
    return renderWithProviders(
      <RoleModal {...defaultProps} {...props} />,
      {
        languageValue: {
          language: 'en',
          setLanguage: vi.fn(),
          t: (key: string) => (key === 'subTabUpdates' ? 'Project Updates' : key),
          getServiceLabel: (type: string) => type,
          getErrorMessage: (err: string) => err,
          getResponsibleLabel: (key: string) => key,
          getPermitTypeLabel: (key: string) => key,
        },
      }
    );
  };

  it('renders role modal with Project Updates in permissions table under Project Tracker', () => {
    renderModal();

    expect(screen.getByText('Create Role')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();

    // Verify Project Updates is rendered in the resource list
    expect(screen.getByText('Project Updates')).toBeInTheDocument();
  });

  it('allows configuring permissions for tracker_updates and saves correctly', () => {
    const onSave = vi.fn();
    renderModal({ onSave });

    // Fill in name
    const nameInput = screen.getByLabelText(/Role Name/i);
    fireEvent.change(nameInput, { target: { value: 'Custom Manager' } });

    // Find row for Project Updates
    const updatesRow = screen.getByText('Project Updates').closest('tr');
    expect(updatesRow).toBeInTheDocument();

    // Toggle View checkbox in Project Updates row
    const checkboxes = updatesRow!.querySelectorAll('input[type="checkbox"]');
    // Checkboxes in row: [View, Create, Edit, Delete, Only Own]
    expect(checkboxes.length).toBe(5);

    // Click View
    fireEvent.click(checkboxes[0]);
    // Click Only Own
    fireEvent.click(checkboxes[4]);

    // Save
    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith('Custom Manager', expect.objectContaining({
      name: 'Custom Manager',
      permissions: expect.objectContaining({
        tracker_updates: ['view'],
        tracker_updates_onlyOwn: true,
      }),
    }));
  });
});
