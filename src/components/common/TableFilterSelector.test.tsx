import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableFilterSelector } from './TableFilterSelector';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../icons', () => ({
  FilterListIcon: () => <div data-testid="filter-icon" />,
  FilterListOffIcon: () => <div data-testid="filter-off-icon" />,
}));

describe('TableFilterSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders the filter button with badge count', () => {
    render(<TableFilterSelector activeCount={3} onClear={vi.fn()} />);
    
    // MUI Badge renders the content in a span
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
  });

  it('opens the popover on click and shows provided sections', async () => {
    render(
      <TableFilterSelector
        activeCount={0}
        onClear={vi.fn()}
        sortingContent={<div>Sort Me</div>}
        dateRangeContent={<div>Date Range Here</div>}
        filteringContent={<div>Filter Options Here</div>}
      >
        <div>Extra Children</div>
      </TableFilterSelector>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      // The popover contents should be visible
      expect(screen.getByText('Sort Me')).toBeInTheDocument();
      expect(screen.getByText('Date Range Here')).toBeInTheDocument();
      expect(screen.getByText('Filter Options Here')).toBeInTheDocument();
      expect(screen.getByText('Extra Children')).toBeInTheDocument();
      
      // Check section labels (mocked translations)
      expect(screen.getByText('lblSortingOptions')).toBeInTheDocument();
      expect(screen.getByText('lblDateRange')).toBeInTheDocument();
      expect(screen.getByText('lblFilteringOptions')).toBeInTheDocument();
    });
  });

  it('shows clear filters button only when activeCount > 0 and calls onClear', async () => {
    const mockOnClear = vi.fn();
    render(
      <TableFilterSelector
        activeCount={2}
        onClear={mockOnClear}
        filteringContent={<div>Filters</div>}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('btnClearFilters')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('btnClearFilters'));
    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });
});
