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
          t: (key: string) => (key === 'tracker_updates' || key === 'subTabUpdates' ? 'Project Updates' : key),
          getServiceLabel: (type: string) => type,
          getErrorMessage: (err: string) => err,
          getResponsibleLabel: (key: string) => key,
          getPermitTypeLabel: (key: string) => key,
        },
      }
    );
  };

  it('renders role modal with catalog-driven Project Tracker permissions', async () => {
    renderModal();

    expect(screen.getByText('Create Role')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();

    // Catalog loads asynchronously via GET /api/permissions/catalog
    expect(await screen.findByText('Project Updates')).toBeInTheDocument();
    expect(screen.getAllByText('project-tracker').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('data-management')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('allows configuring permissions for tracker_updates and saves expected apps + permissions', async () => {
    const onSave = vi.fn();
    renderModal({ onSave });

    const updatesCell = await screen.findByText('Project Updates');

    // Fill in name & level
    fireEvent.change(screen.getByLabelText(/Role Name/i), { target: { value: 'Custom Manager' } });
    fireEvent.change(screen.getByLabelText(/Role Level/i), { target: { value: '50' } });

    // Project Updates only supports 'view' + supportsOnlyOwn -> [View, Only Own]
    const updatesRow = updatesCell.closest('tr');
    expect(updatesRow).toBeInTheDocument();

    const checkboxes = updatesRow!.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(2);

    fireEvent.click(checkboxes[0]); // View
    fireEvent.click(checkboxes[1]); // Only Own

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    expect(onSave).toHaveBeenCalledWith(
      'Custom Manager',
      expect.objectContaining({
        name: 'Custom Manager',
        level: 50,
        permissions: expect.objectContaining({
          apps: expect.arrayContaining(['project-tracker']),
          tracker_updates: ['view'],
          tracker_updates_onlyOwn: true,
        }),
      })
    );
  });

  it('switches to System app and shows configure action without Only Own column', async () => {
    renderModal();

    const systemAppButton = await screen.findByText('system');
    fireEvent.click(systemAppButton);

    expect(await screen.findByText('roles')).toBeInTheDocument();
    expect(screen.getByText('activityLogs')).toBeInTheDocument();
    expect(screen.getByText('activityAnalytics')).toBeInTheDocument();
    expect(screen.getByText('systemSettings')).toBeInTheDocument();
    expect(screen.getByText('configure')).toBeInTheDocument();
    expect(screen.queryByText('permOnlyOwn')).not.toBeInTheDocument();
  });

  it('renders in view mode by default when role is provided', async () => {
    const existingRole = {
      name: 'Auditor',
      description: 'Audit only role',
      level: 30,
      isSystemAdmin: false,
      permissions: {
        apps: ['project-tracker'],
        tracker_projects: ['view'],
      },
    };

    renderModal({ role: existingRole });

    expect(await screen.findByText('Project Updates')).toBeInTheDocument();
    expect(screen.getAllByText('Auditor').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Audit only role').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /^Edit$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Role Name/i)).not.toBeInTheDocument();
  });

  it('switches between view and edit mode in-place', async () => {
    const existingRole = {
      name: 'Auditor',
      description: 'Audit only role',
      level: 30,
      isSystemAdmin: false,
      permissions: {
        apps: ['project-tracker'],
        tracker_projects: ['view'],
      },
    };

    renderModal({ role: existingRole });
    await screen.findByText('Project Updates');

    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }));

    expect(screen.getByLabelText(/Role Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expect(screen.queryByLabelText(/Role Name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Edit$/i })).toBeInTheDocument();
  });
});
