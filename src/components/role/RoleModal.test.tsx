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

  it('renders in view mode by default when role is provided', () => {
    const existingRole = {
      id: 'role-1',
      name: 'Auditor',
      description: 'Audit only role',
      isSystemAdmin: false,
      permissions: {
        tracker_projects: ['view'],
      },
    };

    renderModal({ role: existingRole });

    expect(screen.getAllByText('Auditor').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Audit only role').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /^Edit$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Role Name/i)).not.toBeInTheDocument();
  });

  it('switches between view and edit mode in-place', () => {
    const existingRole = {
      id: 'role-1',
      name: 'Auditor',
      description: 'Audit only role',
      isSystemAdmin: false,
      permissions: {
        tracker_projects: ['view'],
      },
    };

    renderModal({ role: existingRole });

    // Click edit
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }));

    expect(screen.getByLabelText(/Role Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();

    // Click cancel reverts to view
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expect(screen.queryByLabelText(/Role Name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Edit$/i })).toBeInTheDocument();
  });
});
