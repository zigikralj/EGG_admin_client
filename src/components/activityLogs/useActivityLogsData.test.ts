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
});
