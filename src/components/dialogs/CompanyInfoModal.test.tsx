import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyInfoModal } from './CompanyInfoModal';
import * as LanguageContext from '../../context/LanguageContext';
import * as AuthContext from '../../context/AuthContext';
import { apiFetch } from '../../api';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../api', () => ({
  apiFetch: vi.fn(),
}));

describe('CompanyInfoModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });

    (AuthContext.useAuth as any).mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(true),
    });

    (apiFetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        name: 'Test Company',
        legalName: 'Test Company LLC',
        registrationNumber: '12345678',
        taxId: '87654321',
        municipality: 'Test Mun',
        city: 'Test City',
        streetAddress: 'Test Street 1',
        postalCode: '11000',
        postOffice: 'Test PO',
        email: 'test@example.com',
        activityCode: '6201',
        bankAccounts: ['123-456789-01'],
      }),
    });
  });

  const renderComponent = () => {
    return render(
      <CompanyInfoModal
        open={true}
        onClose={mockOnClose}
      />
    );
  };

  it('renders company info after fetching', async () => {
    renderComponent();
    
    expect(screen.getByText('companyInfoTitle')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
      expect(screen.getByText('Test Company LLC')).toBeInTheDocument();
      expect(screen.getByText('12345678')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('allows editing company info', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });
    
    const editButton = screen.getByText('btnEditCompanyInfo');
    fireEvent.click(editButton);
    
    const nameInput = await screen.findByDisplayValue('Test Company');
    fireEvent.change(nameInput, { target: { value: 'Updated Company' } });
    
    const saveButton = await screen.findByRole('button', { name: /btnSave/i });
    
    (apiFetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ name: 'Updated Company', bankAccounts: [] }),
    });
    
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/company-info', expect.objectContaining({
        method: 'PUT',
      }));
    });
  });
});
