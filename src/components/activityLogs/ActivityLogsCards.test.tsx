import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Table, TableBody } from '@mui/material';
import { renderWithProviders } from '../../tests/test-utils';
import { UserActivityCard } from './UserActivityCard';
import { SessionAccordion } from './SessionAccordion';
import { ActivityTableRow } from './ActivityTableRow';
import type { UserActivityGroup, Session, AccumulatedActivity } from './types';

describe('Activity Logs Cards and Tables', () => {
  const mockT = (key: string) => key;

  const mockActivity: AccumulatedActivity = {
    key: 'path:/projects',
    label: 'Projects',
    path: '/projects',
    type: 'PAGE_VIEW',
    totalDurationSeconds: 120,
    count: 2,
    percentage: 50,
    firstTimestamp: '2026-10-14T10:00:00Z',
    lastTimestamp: '2026-10-14T10:05:00Z',
    items: [
      {
        id: '1',
        userId: 'u1',
        userName: 'Alice',
        type: 'PAGE_VIEW',
        path: '/projects',
        durationSeconds: 90,
        timestamp: '2026-10-14T10:00:00Z'
      },
      {
        id: '2',
        userId: 'u1',
        userName: 'Alice',
        type: 'UPDATE',
        path: '/projects',
        details: JSON.stringify({ diff: { status: { old: 'DRAFT', new: 'ACTIVE' } } }),
        durationSeconds: 30,
        timestamp: '2026-10-14T10:05:00Z'
      }
    ]
  };

  const mockSession: Session = {
    sessionId: 'sess_1',
    userId: 'u1',
    userName: 'Alice Johnson',
    startTime: new Date('2026-10-14T10:00:00Z'),
    endTime: new Date('2026-10-14T10:10:00Z'),
    totalDurationSeconds: 240,
    isActive: true,
    logs: mockActivity.items,
    accumulatedActivities: [mockActivity]
  };

  const mockUserGroup: UserActivityGroup = {
    userId: 'u1',
    userName: 'Alice Johnson',
    user: {
      id: 'u1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'ADMIN',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    totalDurationSeconds: 240,
    totalSessionsCount: 1,
    totalActivitiesCount: 2,
    lastActive: new Date('2026-10-14T10:10:00Z'),
    sessions: [mockSession],
    accumulatedActivities: [mockActivity]
  };

  describe('ActivityTableRow', () => {
    it('renders activity row with label, path, duration, and action chips', () => {
      const handleToggleRow = vi.fn();

      renderWithProviders(
        <Table>
          <TableBody>
            <ActivityTableRow
              sessionId="sess_1"
              act={mockActivity}
              isRowExpanded={false}
              onToggleRowDetail={handleToggleRow}
              isDark={false}
              language="en"
              t={mockT}
            />
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('/projects')).toBeInTheDocument();
      expect(screen.getByText('2m')).toBeInTheDocument();
      expect(screen.getByText('1 visit')).toBeInTheDocument();
      expect(screen.getByText('1 action')).toBeInTheDocument();
      expect(screen.getAllByText('UPDATE').length).toBeGreaterThanOrEqual(1);

      // Click to toggle details
      const row = screen.getByText('Projects').closest('tr')!;
      fireEvent.click(row);
      expect(handleToggleRow).toHaveBeenCalledWith('sess_1_path:/projects');
    });
  });

  describe('SessionAccordion', () => {
    it('renders session header and calls onToggle and onDeleteSession', () => {
      const handleToggle = vi.fn();
      const handleDelete = vi.fn();

      renderWithProviders(
        <SessionAccordion
          session={mockSession}
          userName="Alice Johnson"
          isExpanded={true}
          onToggle={handleToggle}
          expandedRows={{}}
          onToggleRowDetail={vi.fn()}
          onDeleteSession={handleDelete}
          isDark={false}
          language="en"
          t={mockT}
        />
      );

      expect(screen.getByText(/sessionNumber/i)).toBeInTheDocument();
      expect(screen.getByText('activeSession')).toBeInTheDocument();

      const deleteButton = screen.getByRole('button', { name: 'Delete session' });
      fireEvent.click(deleteButton);
      expect(handleDelete).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('UserActivityCard', () => {
    it('renders user details and triggers onToggleUser', () => {
      const handleToggleUser = vi.fn();

      renderWithProviders(
        <UserActivityCard
          userGroup={mockUserGroup}
          isExpanded={true}
          onToggleUser={handleToggleUser}
          expandedSessions={{}}
          onToggleSession={vi.fn()}
          expandedRows={{}}
          onToggleRowDetail={vi.fn()}
          onDeleteSession={vi.fn()}
          isDark={false}
          language="en"
          t={mockT}
        />
      );

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
      expect(screen.getByText(/alice@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/1 session • 2 events/i)).toBeInTheDocument();

      const userHeader = screen.getByText('Alice Johnson').closest('.MuiBox-root')!;
      fireEvent.click(userHeader);
      expect(handleToggleUser).toHaveBeenCalled();
    });
  });
});
