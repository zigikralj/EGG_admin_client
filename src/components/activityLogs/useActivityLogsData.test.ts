import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useActivityLogsData } from './useActivityLogsData';
import type { ActivityLog, User } from '../../types';

describe('useActivityLogsData hook', () => {
  const mockUsers: User[] = [
    {
      id: 'u1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'ADMIN',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'u2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'USER',
      createdAt: '2026-01-01T00:00:00Z',
    }
  ];

  const nowIso = new Date().toISOString();
  const pastHourIso = new Date(Date.now() - 3600 * 1000).toISOString();

  const mockLogs: ActivityLog[] = [
    {
      id: '1',
      userId: 'u1',
      userName: 'Alice Johnson',
      sessionId: 'sess_1',
      type: 'PAGE_VIEW',
      path: '/projects',
      durationSeconds: 120,
      timestamp: nowIso
    },
    {
      id: '2',
      userId: 'u1',
      userName: 'Alice Johnson',
      sessionId: 'sess_1',
      type: 'UPDATE',
      path: '/projects',
      details: JSON.stringify({ diff: { name: { old: 'A', new: 'B' } } }),
      durationSeconds: 30,
      timestamp: nowIso
    },
    {
      id: '3',
      userId: 'u1',
      userName: 'Alice Johnson',
      sessionId: 'sess_1',
      type: 'LOGIN',
      timestamp: pastHourIso
    },
    {
      id: '4',
      userId: 'u2',
      userName: 'Bob Smith',
      sessionId: 'sess_2',
      type: 'PAGE_VIEW',
      path: '/clients',
      durationSeconds: 60,
      timestamp: pastHourIso
    }
  ];

  it('handles empty logs gracefully', () => {
    const { result } = renderHook(() =>
      useActivityLogsData({
        logs: [],
        users: mockUsers,
        timeRangeFilter: 'ALL',
        selectedUserFilter: 'ALL',
        searchQuery: '',
        t: (k: string) => k,
        language: 'en'
      })
    );

    expect(result.current.processedData).toEqual([]);
    expect(result.current.filteredUsers).toEqual([]);
    expect(result.current.kpiStats.totalUsers).toBe(0);
    expect(result.current.kpiStats.totalSessions).toBe(0);
  });

  it('groups logs into user sessions and calculates accumulated activities', () => {
    const { result } = renderHook(() =>
      useActivityLogsData({
        logs: mockLogs,
        users: mockUsers,
        timeRangeFilter: 'ALL',
        selectedUserFilter: 'ALL',
        searchQuery: '',
        t: (k: string) => k,
        language: 'en'
      })
    );

    expect(result.current.processedData.length).toBe(2);

    const aliceGroup = result.current.processedData.find(u => u.userId === 'u1');
    expect(aliceGroup).toBeDefined();
    expect(aliceGroup?.userName).toBe('Alice Johnson');
    expect(aliceGroup?.sessions.length).toBe(1);

    // Accumulated activities should exclude LOGIN
    expect(aliceGroup?.accumulatedActivities.length).toBe(1);
    expect(aliceGroup?.accumulatedActivities[0].path).toBe('/projects');
    expect(aliceGroup?.accumulatedActivities[0].totalDurationSeconds).toBe(150);
  });

  it('calculates KPI stats correctly', () => {
    const { result } = renderHook(() =>
      useActivityLogsData({
        logs: mockLogs,
        users: mockUsers,
        timeRangeFilter: 'ALL',
        selectedUserFilter: 'ALL',
        searchQuery: '',
        t: (k: string) => k,
        language: 'en'
      })
    );

    const stats = result.current.kpiStats;
    expect(stats.totalUsers).toBe(2);
    expect(stats.totalSessions).toBe(2);
    expect(stats.totalTrackedSeconds).toBe(210);
    expect(stats.topModule).toBe('tabProjects');
  });

  it('filters data by selected user', () => {
    const { result } = renderHook(() =>
      useActivityLogsData({
        logs: mockLogs,
        users: mockUsers,
        timeRangeFilter: 'ALL',
        selectedUserFilter: 'u2',
        searchQuery: '',
        t: (k: string) => k,
        language: 'en'
      })
    );

    expect(result.current.filteredUsers.length).toBe(1);
    expect(result.current.filteredUsers[0].userId).toBe('u2');
  });

  it('filters data by search query matching user or activity', () => {
    const { result: userMatch } = renderHook(() =>
      useActivityLogsData({
        logs: mockLogs,
        users: mockUsers,
        timeRangeFilter: 'ALL',
        selectedUserFilter: 'ALL',
        searchQuery: 'alice',
        t: (k: string) => k,
        language: 'en'
      })
    );
    expect(userMatch.current.filteredUsers.length).toBe(1);
    expect(userMatch.current.filteredUsers[0].userId).toBe('u1');

    const { result: activityMatch } = renderHook(() =>
      useActivityLogsData({
        logs: mockLogs,
        users: mockUsers,
        timeRangeFilter: 'ALL',
        selectedUserFilter: 'ALL',
        searchQuery: 'clients',
        t: (k: string) => k,
        language: 'en'
      })
    );
    expect(activityMatch.current.filteredUsers.length).toBe(1);
    expect(activityMatch.current.filteredUsers[0].userId).toBe('u2');
  });

  it('merges consecutive activities across different session IDs when there was no logout and gap is small', () => {
    const t0 = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const t1 = new Date(Date.now() - 4 * 60 * 1000).toISOString();
    const t2 = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    const multiSessionLogs: ActivityLog[] = [
      {
        id: 's1-1',
        userId: 'u1',
        userName: 'Alice Johnson',
        sessionId: 'sess_tab1',
        type: 'PAGE_VIEW',
        path: '/projects',
        durationSeconds: 30,
        timestamp: t0
      },
      {
        id: 's1-2',
        userId: 'u1',
        userName: 'Alice Johnson',
        sessionId: 'sess_tab1',
        type: 'PAGE_VIEW',
        path: '/clients',
        durationSeconds: 20,
        timestamp: t1
      },
      // Second tab or page reload generates sess_tab2 1 min later without LOGOUT
      {
        id: 's2-1',
        userId: 'u1',
        userName: 'Alice Johnson',
        sessionId: 'sess_tab2',
        type: 'PAGE_VIEW',
        path: '/permits',
        durationSeconds: 15,
        timestamp: t2
      }
    ];

    const { result } = renderHook(() =>
      useActivityLogsData({
        logs: multiSessionLogs,
        users: mockUsers,
        timeRangeFilter: 'ALL',
        selectedUserFilter: 'u1',
        searchQuery: '',
        t: (k: string) => k,
        language: 'en'
      })
    );

    const user = result.current.processedData.find(u => u.userId === 'u1');
    expect(user).toBeDefined();
    // Should be clustered into 1 continuous session instead of 2 separate sections
    expect(user?.sessions.length).toBe(1);
    expect(user?.sessions[0].accumulatedActivities.length).toBe(3);
    expect(user?.sessions[0].isActive).toBe(true);
  });

  it('ensures only the latest session can be marked active even if older session was within 10 minutes', () => {
    const tPastSession = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const tLogout = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const tNewSession = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const twoSessionsWithLogout: ActivityLog[] = [
      {
        id: 'old-1',
        userId: 'u1',
        userName: 'Alice Johnson',
        sessionId: 'sess_old',
        type: 'PAGE_VIEW',
        path: '/projects',
        durationSeconds: 60,
        timestamp: tPastSession
      },
      {
        id: 'old-logout',
        userId: 'u1',
        userName: 'Alice Johnson',
        sessionId: 'sess_old',
        type: 'LOGOUT',
        timestamp: tLogout
      },
      {
        id: 'new-login',
        userId: 'u1',
        userName: 'Alice Johnson',
        sessionId: 'sess_new',
        type: 'LOGIN',
        timestamp: tNewSession
      },
      {
        id: 'new-1',
        userId: 'u1',
        userName: 'Alice Johnson',
        sessionId: 'sess_new',
        type: 'PAGE_VIEW',
        path: '/clients',
        durationSeconds: 30,
        timestamp: tNewSession
      }
    ];

    const { result } = renderHook(() =>
      useActivityLogsData({
        logs: twoSessionsWithLogout,
        users: mockUsers,
        timeRangeFilter: 'ALL',
        selectedUserFilter: 'u1',
        searchQuery: '',
        t: (k: string) => k,
        language: 'en'
      })
    );

    const user = result.current.processedData.find(u => u.userId === 'u1');
    expect(user).toBeDefined();
    expect(user?.sessions.length).toBe(2);
    // Newest session is active
    expect(user?.sessions[0].isActive).toBe(true);
    // Older session cannot be active
    expect(user?.sessions[1].isActive).toBe(false);
  });

  it('does not register or display sessions containing only login / logout that last less than 5 seconds', () => {
    const shortSessionLogs: ActivityLog[] = [
      {
        id: 'short-1',
        userId: 'u1',
        userName: 'Alice Johnson',
        sessionId: 'sess_short_lifecycle',
        type: 'LOGIN',
        durationSeconds: 0,
        timestamp: '2026-10-15T10:00:00.000Z'
      },
      {
        id: 'short-2',
        userId: 'u1',
        userName: 'Alice Johnson',
        sessionId: 'sess_short_lifecycle',
        type: 'LOGOUT',
        durationSeconds: 0,
        timestamp: '2026-10-15T10:00:02.000Z'
      }
    ];

    const { result } = renderHook(() =>
      useActivityLogsData({
        logs: shortSessionLogs,
        users: mockUsers,
        timeRangeFilter: 'ALL',
        selectedUserFilter: 'ALL',
        searchQuery: '',
        t: (k: string) => k,
        language: 'en'
      })
    );

    const user = result.current.processedData.find(u => u.userId === 'u1');
    expect(user?.sessions.length).toBe(0);
    expect(user?.totalSessionsCount).toBe(0);
  });
});

