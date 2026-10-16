import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LogDiffView } from './LogDiffView';

describe('LogDiffView component', () => {
  it('renders nothing when detailsStr is missing', () => {
    const { container } = render(
      <LogDiffView detailsStr={null} isDark={false} language="en" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders raw string when detailsStr is not valid JSON', () => {
    render(
      <LogDiffView detailsStr="raw string details" isDark={false} language="en" />
    );
    expect(screen.getByText('raw string details')).toBeInTheDocument();
  });

  it('renders "(No fields modified)" when diff has no real differences', () => {
    const details = JSON.stringify({
      diff: {
        status: { old: 'ACTIVE', new: 'ACTIVE' }
      }
    });

    render(
      <LogDiffView detailsStr={details} isDark={false} language="en" />
    );
    expect(screen.getByText('(No fields modified)')).toBeInTheDocument();
  });

  it('renders Serbian fallback "(Nema izmenjenih polja)"', () => {
    const details = JSON.stringify({
      diff: {
        status: { old: 'ACTIVE', new: 'ACTIVE' }
      }
    });

    render(
      <LogDiffView detailsStr={details} isDark={false} language="sr" />
    );
    expect(screen.getByText('(Nema izmenjenih polja)')).toBeInTheDocument();
  });

  it('renders field changes showing old and new values', () => {
    const details = JSON.stringify({
      diff: {
        status: { old: 'PENDING', new: 'ACTIVE' },
        description: { old: null, new: 'Added description' }
      }
    });

    render(
      <LogDiffView detailsStr={details} isDark={false} language="en" />
    );

    expect(screen.getByText('status:')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();

    expect(screen.getByText('description:')).toBeInTheDocument();
    expect(screen.getByText('Added description')).toBeInTheDocument();
  });
});
