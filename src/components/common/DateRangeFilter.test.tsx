import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DateRangeFilter, getThisMonthRange } from './DateRangeFilter';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../icons', () => ({
  CalendarTodayIcon: () => <div data-testid="calendar-icon" />,
  CloseIcon: () => <div data-testid="close-icon" />,
}));

describe('DateRangeFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders date inputs and This Month button', () => {
    render(
      <DateRangeFilter startDate="" endDate="" onDateChange={vi.fn()} />
    );

    // Date inputs
    expect(screen.getByLabelText('lblFromDate')).toBeInTheDocument();
    expect(screen.getByLabelText('lblToDate')).toBeInTheDocument();
    
    // This Month button
    expect(screen.getByRole('button', { name: 'lblThisMonth' })).toBeInTheDocument();
  });

  it('calls onDateChange when This Month is clicked', () => {
    const mockOnDateChange = vi.fn();
    render(
      <DateRangeFilter startDate="" endDate="" onDateChange={mockOnDateChange} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'lblThisMonth' }));
    
    const { startDate, endDate } = getThisMonthRange();
    expect(mockOnDateChange).toHaveBeenCalledWith({ startDate, endDate });
  });

  it('shows Clear button when dates are set and calls onDateChange with empty strings when clicked', () => {
    const mockOnDateChange = vi.fn();
    render(
      <DateRangeFilter startDate="2023-01-01" endDate="2023-01-31" onDateChange={mockOnDateChange} />
    );

    const clearButton = screen.getByRole('button', { name: 'btnClearDate' });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(mockOnDateChange).toHaveBeenCalledWith({ startDate: '', endDate: '' });
  });

  it('renders date field selector if options are provided', () => {
    const mockOnDateFieldChange = vi.fn();
    render(
      <DateRangeFilter 
        startDate="" 
        endDate="" 
        onDateChange={vi.fn()} 
        dateField="createdAt"
        dateFieldOptions={[
          { value: 'createdAt', label: 'Created At' },
          { value: 'updatedAt', label: 'Updated At' },
        ]}
        onDateFieldChange={mockOnDateFieldChange}
      />
    );

    // MUI Select visually hides the actual select and shows a div. 
    // We can check if "Created At" text is present.
    expect(screen.getByText('Created At')).toBeInTheDocument();
  });

  describe('getThisMonthRange', () => {
    it('returns valid start and end dates for the current month', () => {
      const range = getThisMonthRange();
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      expect(range.startDate).toBe(`${year}-${month}-01`);
      
      // End date should end with the last day of the month
      expect(range.endDate).toMatch(new RegExp(`^${year}-${month}-\\d{2}$`));
      
      const lastDay = parseInt(range.endDate.split('-')[2]);
      expect(lastDay).toBeGreaterThanOrEqual(28);
      expect(lastDay).toBeLessThanOrEqual(31);
    });
  });
});
