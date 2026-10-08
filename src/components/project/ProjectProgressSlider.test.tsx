import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectProgressSlider } from './ProjectProgressSlider';

describe('ProjectProgressSlider', () => {
  const mockOnChangeCommitted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <ProjectProgressSlider
        value={50}
        label="Progress"
        onChangeCommitted={mockOnChangeCommitted}
        {...props}
      />
    );
  };

  it('renders correctly with given value and label', () => {
    renderComponent();
    
    expect(screen.getByText('Progress (50%)')).toBeInTheDocument();
    
    // MUI Slider exposes an input element
    const sliderInput = screen.getByRole('slider');
    expect(sliderInput).toHaveAttribute('aria-valuenow', '50');
  });

  it('updates local value and calls onChangeCommitted when changed', () => {
    renderComponent();
    
    const sliderInput = screen.getByRole('slider');
    fireEvent.change(sliderInput, { target: { value: '75' } });
    
    expect(screen.getByText('Progress (75%)')).toBeInTheDocument();
    expect(mockOnChangeCommitted).toHaveBeenCalledWith(75);
  });

  it('disables the slider when disabled prop is true', () => {
    renderComponent({ disabled: true });
    
    const sliderInput = screen.getByRole('slider');
    expect(sliderInput).toBeDisabled();
  });
});
