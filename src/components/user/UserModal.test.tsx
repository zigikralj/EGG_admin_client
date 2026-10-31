import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserModal } from './UserModal';
import { renderWithProviders } from '../../tests/test-utils';
import type { User, Role } from '../../types';

const mockRoles: Role[] = [
  { name: 'Administrator', description: 'Admin role', isSystemAdmin: true, permissions: {} },
  { name: 'User', description: 'Standard user', isSystemAdmin: false, permissions: {} },
];

const mockUser: User = {
  id: 'u-1',
  name: 'Aleksandar Petrovic',
  email: 'aleksandar@ekosgreen.rs',
  role: 'User',
  phone: '+38164112233',
  gender: 'Male',
  status: 'APPROVED',
  isApproved: true,
};

describe('UserModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    editingUser: null,
    rolesList: mockRoles,
    canDelete: true,
    canEdit: true,
    canCreate: true,
    onDeleteUser: vi.fn(),
    onSaveUser: vi.fn().mockResolvedValue({ success: true }),
    onError: vi.fn(),
  };

  const renderModal = (props = {}) => {
    return renderWithProviders(<UserModal {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in create mode with empty editable fields and password input', () => {
    renderModal({ editingUser: null });

    expect(screen.getByText('modalNewUser')).toBeInTheDocument();
    expect(screen.getByLabelText(/colFullName/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lblPassword/i)).toBeInTheDocument();
    expect(screen.getByText('btnSave')).toBeInTheDocument();
  });

  it('renders in view mode by default when editingUser is provided', () => {
    renderModal({ editingUser: mockUser });

    expect(screen.getAllByText('Aleksandar Petrovic').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('aleksandar@ekosgreen.rs').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('+38164112233')).toBeInTheDocument();
    expect(screen.getByText('btnEdit')).toBeInTheDocument();
    expect(screen.queryByLabelText(/colFullName/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/lblPassword/i)).not.toBeInTheDocument();
  });

  it('switches between view and edit mode in-place', () => {
    renderModal({ editingUser: mockUser });

    // Click edit
    fireEvent.click(screen.getByText('btnEdit'));

    expect(screen.getByText('modalEditUser')).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/colFullName/i);
    expect(nameInput).toBeInTheDocument();
    expect((nameInput as HTMLInputElement).value).toBe('Aleksandar Petrovic');
    expect(screen.getByLabelText(/lblResetPassword/i)).toBeInTheDocument();

    // Click cancel reverts to view
    fireEvent.click(screen.getByText('btnCancel'));
    expect(screen.getAllByText('Aleksandar Petrovic').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByLabelText(/colFullName/i)).not.toBeInTheDocument();
  });

  it('calls onSaveUser when form is submitted in edit mode', async () => {
    const onSaveUser = vi.fn().mockResolvedValue({ success: true });
    renderModal({ editingUser: mockUser, initialMode: 'edit', onSaveUser });

    const nameInput = screen.getByLabelText(/colFullName/i);
    fireEvent.change(nameInput, { target: { value: 'Aleksandar Updated' } });

    fireEvent.click(screen.getByText('btnSave'));

    await waitFor(() => {
      expect(onSaveUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'u-1',
          name: 'Aleksandar Updated',
          email: 'aleksandar@ekosgreen.rs',
          role: 'User',
        })
      );
    });
  });

  it('calls onDeleteUser when delete button is clicked in view mode', () => {
    const onDeleteUser = vi.fn();
    renderModal({ editingUser: mockUser, onDeleteUser });

    fireEvent.click(screen.getByText('btnDelete'));
    expect(onDeleteUser).toHaveBeenCalledWith('u-1');
  });
});
