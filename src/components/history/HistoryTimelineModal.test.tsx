import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryTimelineModal } from './HistoryTimelineModal';
import * as LanguageContext from '../../context/LanguageContext';
import * as AuthContext from '../../context/AuthContext';
import * as Queries from '../../queries';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../queries', () => ({
  useEntityTimelineQuery: vi.fn(),
  useVersionDiffQuery: vi.fn(),
  useRebuiltVersionQuery: vi.fn(),
  useRestoreVersionMutation: vi.fn(),
}));

describe('HistoryTimelineModal', () => {
  const mockOnClose = vi.fn();
  const mockRestoreMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
      language: 'en',
    });

    (AuthContext.useAuth as any).mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(true),
    });

    (Queries.useRestoreVersionMutation as any).mockReturnValue({
      mutate: mockRestoreMutate,
      isPending: false,
    });

    (Queries.useVersionDiffQuery as any).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (Queries.useRebuiltVersionQuery as any).mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  it('renders loading state when timeline is fetching', () => {
    (Queries.useEntityTimelineQuery as any).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(
      <HistoryTimelineModal
        open={true}
        onClose={mockOnClose}
        entityType="Project"
        entityId="p1"
        entityTitle="Test Project"
      />
    );

    expect(screen.getByText('historyLoading')).toBeInTheDocument();
  });

  it('renders empty message when no versions exist', () => {
    (Queries.useEntityTimelineQuery as any).mockReturnValue({
      data: { versions: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(
      <HistoryTimelineModal
        open={true}
        onClose={mockOnClose}
        entityType="Project"
        entityId="p1"
        entityTitle="Test Project"
      />
    );

    expect(screen.getByText('historyEmpty')).toBeInTheDocument();
  });

  it('renders versions with author, op chip, and restore button', () => {
    const mockVersions = [
      {
        id: '2',
        changeSetId: 'cs-2',
        entityType: 'Project',
        entityId: 'p1',
        version: 2,
        op: 'U',
        kind: 'D',
        changedFields: ['progress', 'done'],
        createdAt: '2026-10-19T18:00:00Z',
        changeSet: {
          id: 'cs-2',
          userId: 'u1',
          userName: 'Admin User',
          source: 'api',
          reason: 'Updated progress to 100%',
          createdAt: '2026-10-19T18:00:00Z',
        },
      },
      {
        id: '1',
        changeSetId: 'cs-1',
        entityType: 'Project',
        entityId: 'p1',
        version: 1,
        op: 'B',
        kind: 'S',
        changedFields: ['id', 'name'],
        createdAt: '2026-10-19T12:00:00Z',
        changeSet: {
          id: 'cs-1',
          userId: null,
          userName: null,
          source: 'system',
          reason: 'Initial baseline',
          createdAt: '2026-10-19T12:00:00Z',
        },
      },
    ];

    (Queries.useEntityTimelineQuery as any).mockReturnValue({
      data: { versions: mockVersions },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(
      <HistoryTimelineModal
        open={true}
        onClose={mockOnClose}
        entityType="Project"
        entityId="p1"
        entityTitle="Test Project"
      />
    );

    expect(screen.getByText('historyModalTitle')).toBeInTheDocument();
    expect(screen.getByText('— Test Project')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();

    // v1 is not latest and can be restored
    const restoreButtons = screen.getAllByText('historyRestore');
    expect(restoreButtons.length).toBeGreaterThan(0);

    // Clicking restore opens confirmation dialog
    fireEvent.click(restoreButtons[0]);
    expect(screen.getByText('historyRestoreConfirmTitle')).toBeInTheDocument();
  });
});
