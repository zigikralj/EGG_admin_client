import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HistoryDiffView } from './HistoryDiffView';

describe('HistoryDiffView component', () => {
  it('renders empty message when diff is missing or null', () => {
    render(<HistoryDiffView diff={null} isDark={false} language="en" />);
    expect(screen.getByText('No difference detected.')).toBeInTheDocument();
  });

  it('renders Serbian fallback when diff is null', () => {
    render(<HistoryDiffView diff={null} isDark={false} language="sr-Latn" />);
    expect(screen.getByText('Nema detektovanih razlika.')).toBeInTheDocument();
  });

  it('renders "No fields modified between these versions." when old === new', () => {
    const diff = {
      progress: { old: 50, new: 50 },
    };
    render(<HistoryDiffView diff={diff} isDark={false} language="en" />);
    expect(screen.getByText('No fields modified between these versions.')).toBeInTheDocument();
  });

  it('renders field changes showing strikethrough old value and green new value', () => {
    const diff = {
      progress: { old: 25, new: 50 },
      done: { old: false, new: true },
    };

    render(<HistoryDiffView diff={diff} isDark={false} language="en" />);

    expect(screen.getByText('progress:')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    expect(screen.getByText('done:')).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });
});
