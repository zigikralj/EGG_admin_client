import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomDataModelModal } from './CustomDataModelModal';
import * as LanguageContext from '../../context/LanguageContext';
import * as Queries from '../../queries';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../queries', () => ({
  useClientsQuery: vi.fn(),
  usePermitsQuery: vi.fn(),
}));

describe('CustomDataModelModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockService = { id: 's1', name: 'Test Service' } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
      getServiceLabel: (key: string) => key,
      getPermitTypeLabel: (key: string) => key,
    });

    (Queries.useClientsQuery as any).mockReturnValue({ data: [] });
    (Queries.usePermitsQuery as any).mockReturnValue({ data: [] });
  });

  const renderComponent = (initialFields: any[] = []) => {
    return render(
      <CustomDataModelModal
        isOpen={true}
        onClose={mockOnClose}
        service={mockService}
        initialFields={initialFields}
        onSave={mockOnSave}
      />
    );
  };

  it('renders empty state when no fields', () => {
    renderComponent([]);
    
    expect(screen.getByText('modalCustomDataModelTitle')).toBeInTheDocument();
    expect(screen.getByText('noCustomFieldsDefined')).toBeInTheDocument();
  });

  it('adds a new field when Add Field is clicked', () => {
    renderComponent([]);
    
    const addButton = screen.getByText('btnAddField');
    fireEvent.click(addButton);
    
    expect(screen.getByPlaceholderText('phFieldName')).toBeInTheDocument();
  });

  it('renders initial fields', () => {
    const fields = [
      { id: 'f1', name: 'Field 1', type: 'text' },
    ];
    renderComponent(fields);
    
    expect(screen.getByDisplayValue('Field 1')).toBeInTheDocument();
  });

  it('calls onSave with updated fields', async () => {
    const fields = [
      { id: 'f1', name: 'Field 1', type: 'text' },
    ];
    renderComponent(fields);
    
    const input = screen.getByDisplayValue('Field 1');
    fireEvent.change(input, { target: { value: 'Updated Field' } });
    
    const saveButton = screen.getByText('btnSave');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('s1', expect.arrayContaining([
        expect.objectContaining({ name: 'Updated Field' })
      ]));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error if field name is empty', async () => {
    const fields = [
      { id: 'f1', name: '', type: 'text' },
    ];
    renderComponent(fields);
    
    const form = screen.getByRole('dialog').querySelector('form');
    fireEvent.submit(form!);
    
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(await screen.findByText('alertServiceRequired')).toBeInTheDocument();
  });
});
