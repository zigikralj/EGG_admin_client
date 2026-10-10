import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ColumnSelector, type ColumnDef } from './ColumnSelector';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

// Mock icons
vi.mock('../icons', () => ({
  SettingsIcon: () => <div data-testid="settings-icon" />,
  EditIcon: () => <div data-testid="edit-icon" />,
  CheckIcon: () => <div data-testid="check-icon" />,
  CloseIcon: () => <div data-testid="close-icon" />,
  UndoIcon: () => <div data-testid="undo-icon" />,
}));

describe('ColumnSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });
  });

  const mockColumns: ColumnDef[] = [
    { id: 'col1', label: 'Column 1' },
    { id: 'col2', label: 'Column 2' },
  ];

  it('renders settings icon button', () => {
    render(<ColumnSelector />);
    expect(screen.getByRole('button', { name: /btnTableOptions/i })).toBeInTheDocument();
  });

  it('opens popover and shows columns and rows per page', async () => {
    render(<ColumnSelector columns={mockColumns} visibleColumns={['col1']} />);
    
    fireEvent.click(screen.getByRole('button', { name: /btnTableOptions/i }));

    await waitFor(() => {
      // Rows per page chips
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      
      // Column checkboxes
      expect(screen.getByText('Column 1')).toBeInTheDocument();
      expect(screen.getByText('Column 2')).toBeInTheDocument();
    });
  });

  it('toggles column visibility', async () => {
    const mockOnChange = vi.fn();
    const mockOnVisibleColumnsChange = vi.fn();

    render(
      <ColumnSelector 
        columns={mockColumns} 
        visibleColumns={['col1']} 
        onChange={mockOnChange}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /btnTableOptions/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Column 2')).toBeInTheDocument();
    });

    const checkbox2 = screen.getByLabelText('Column 2');
    fireEvent.click(checkbox2);

    expect(mockOnChange).toHaveBeenCalledWith(['col1', 'col2']);
    expect(mockOnVisibleColumnsChange).toHaveBeenCalledWith(['col1', 'col2']);
  });

  it('changes rows per page when chip is clicked', async () => {
    const mockOnRowsPerPageChange = vi.fn();
    
    render(
      <ColumnSelector 
        rowsPerPage={15} 
        onRowsPerPageChange={mockOnRowsPerPageChange}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /btnTableOptions/i }));
    
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('25'));
    expect(mockOnRowsPerPageChange).toHaveBeenCalledWith(25);
  });
});
