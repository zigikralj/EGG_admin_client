import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserProfileDialog } from './UserProfileDialog';
import * as AuthContext from '../../context/AuthContext';
import * as LanguageContext from '../../context/LanguageContext';
import { apiFetch } from '../../api';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../api', () => ({
  apiFetch: vi.fn(),
}));

// Mock URL.createObjectURL since it's used by FileReader sometimes, or file rendering
window.URL.createObjectURL = vi.fn();

describe('UserProfileDialog', () => {
  const mockOnClose = vi.fn();
  const mockSetCurrentUser = vi.fn();
  
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: '123456789',
    gender: 'Male',
    role: 'ADMIN',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });

    (AuthContext.useAuth as any).mockReturnValue({
      currentUser: mockUser,
      role: 'ADMIN',
      setCurrentUser: mockSetCurrentUser,
    });
  });

  const renderComponent = (isOpen = true) => {
    return render(<UserProfileDialog isOpen={isOpen} onClose={mockOnClose} />);
  };

  it('renders user details correctly', () => {
    renderComponent();
    
    expect(screen.getByText('userProfileTitle')).toBeInTheDocument();
    
    const nameInput = screen.getByDisplayValue('Test User');
    expect(nameInput).toBeInTheDocument();
    
    const emailInput = screen.getByDisplayValue('test@example.com');
    expect(emailInput).toBeInTheDocument();
  });

  it('updates profile and calls apiFetch on save', async () => {
    (apiFetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockUser, name: 'Updated Name' }),
    });
    
    renderComponent();
    
    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    
    const saveButton = screen.getByText('btnSave');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(`/api/users/1`, expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('Updated Name'),
      }));
      expect(mockSetCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows change password fields when button is clicked', () => {
    renderComponent();
    
    const changePasswordBtn = screen.getByText('lblChangePassword');
    fireEvent.click(changePasswordBtn);
    
    expect(screen.getByPlaceholderText('phCurrentPassword')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('phNewPassword')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('phConfirmNewPassword')).toBeInTheDocument();
  });

  it('validates passwords before saving', async () => {
    renderComponent();
    
    const changePasswordBtn = screen.getByText('lblChangePassword');
    fireEvent.click(changePasswordBtn);
    
    const newPasswordInput = screen.getByPlaceholderText('phNewPassword');
    const confirmPasswordInput = screen.getByPlaceholderText('phConfirmNewPassword');
    
    fireEvent.change(newPasswordInput, { target: { value: 'short' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
    
    const saveButton = screen.getByText('btnSave');
    fireEvent.click(saveButton);
    
    // API shouldn't be called if validation fails (e.g., current password is empty)
    expect(apiFetch).not.toHaveBeenCalled();
    expect(screen.getByText('currentPasswordIncorrectError')).toBeInTheDocument();
  });
});
