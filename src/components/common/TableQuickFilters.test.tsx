import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TableQuickFilters, type QuickFilterItem } from './TableQuickFilters';

describe('TableQuickFilters', () => {
  const options: QuickFilterItem[] = [
    { key: 'opt1', label: 'Option 1' },
    { key: 'opt2', label: 'Option 2', color: 'secondary' },
    { key: 'opt3', label: 'Option 3', hidden: true },
  ];

  it('renders visible options as checkboxes', () => {
    render(
      <TableQuickFilters options={options} selectedKeys={[]} onChange={vi.fn()} />
    );

    // Option 1 and 2 should be visible
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
    
    // Option 3 is hidden
    expect(screen.queryByLabelText('Option 3')).not.toBeInTheDocument();
  });

  it('checks the correct options based on selectedKeys', () => {
    render(
      <TableQuickFilters options={options} selectedKeys={['opt2']} onChange={vi.fn()} />
    );

    const checkbox1 = screen.getByLabelText('Option 1') as HTMLInputElement;
    const checkbox2 = screen.getByLabelText('Option 2') as HTMLInputElement;

    expect(checkbox1.checked).toBe(false);
    expect(checkbox2.checked).toBe(true);
  });

  it('calls onChange with correct keys when a checkbox is toggled', () => {
    const mockOnChange = vi.fn();
    render(
      <TableQuickFilters options={options} selectedKeys={['opt1']} onChange={mockOnChange} />
    );

    const checkbox2 = screen.getByLabelText('Option 2');
    
    // Check opt2
    fireEvent.click(checkbox2);
    expect(mockOnChange).toHaveBeenCalledWith(['opt1', 'opt2']);
    
    const checkbox1 = screen.getByLabelText('Option 1');
    
    // Uncheck opt1
    fireEvent.click(checkbox1);
    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('renders null if all options are hidden', () => {
    const hiddenOptions: QuickFilterItem[] = [
      { key: '1', label: '1', hidden: true },
      { key: '2', label: '2', hidden: true },
    ];
    const { container } = render(
      <TableQuickFilters options={hiddenOptions} selectedKeys={[]} onChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});
