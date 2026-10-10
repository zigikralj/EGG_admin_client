import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoadingMask } from './LoadingMask';
import * as LoadingContext from '../../context/LoadingContext';
import * as LanguageContext from '../../context/LanguageContext';

// Mock contexts
vi.mock('../../context/LoadingContext', () => ({
  useLoading: vi.fn(),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

// Mock icons
vi.mock('../icons', () => ({
  StorageIcon: () => <div data-testid="storage-icon" />,
  HourglassEmptyIcon: () => <div data-testid="hourglass-icon" />,
}));

describe('LoadingMask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string, params: any) => {
        if (key === 'loadingElapsedTime' && params?.seconds) {
          return `Elapsed: ${params.seconds}s`;
        }
        return key;
      },
    });
  });

  it('does not render visible backdrop when isLoading is false', () => {
    (LoadingContext.useLoading as any).mockReturnValue({
      isLoading: false,
      loadingMessage: 'Loading...',
      isServerWakingUp: false,
      elapsedSeconds: 0,
    });

    render(<LoadingMask />);
    
    // Backdrop sets pointer-events to none when not open, but it's technically in DOM for MUI transitions.
    // We can check if it has the aria-hidden attribute or check its styles, but in Material UI, 
    // we can check if it's visually hidden. The easiest way is to query by aria-busy.
    const backdrop = screen.getByRole('alert', { hidden: true });
    expect(backdrop).toHaveStyle('pointer-events: none');
    expect(backdrop).toHaveStyle('visibility: hidden');
  });

  it('renders loading message and shows when isLoading is true', () => {
    (LoadingContext.useLoading as any).mockReturnValue({
      isLoading: true,
      loadingMessage: 'Fetching data...',
      isServerWakingUp: false,
      elapsedSeconds: 0,
    });

    render(<LoadingMask />);
    
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
    expect(screen.getByText('loadingPleaseWait')).toBeInTheDocument();
    
    // Server waking up alert should not be visible
    expect(screen.queryByText('loadingServerWakingUp')).not.toBeInTheDocument();
  });

  it('renders server wake up notice when isServerWakingUp is true', () => {
    (LoadingContext.useLoading as any).mockReturnValue({
      isLoading: true,
      loadingMessage: 'Waking up server...',
      isServerWakingUp: true,
      elapsedSeconds: 45,
    });

    render(<LoadingMask />);
    
    expect(screen.getByText('Waking up server...')).toBeInTheDocument();
    expect(screen.getByText('loadingServerWakingUp')).toBeInTheDocument();
    expect(screen.getByText('loadingServerWakingUpDetail')).toBeInTheDocument();
    expect(screen.getByText('Elapsed: 45s')).toBeInTheDocument();
    expect(screen.getByTestId('storage-icon')).toBeInTheDocument();
  });
});
