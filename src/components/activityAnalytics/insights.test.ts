import { describe, it, expect } from 'vitest';
import { generateInsights } from './insights';
import type { ActivityAnalytics } from '../../types';

describe('Activity Analytics Insights Engine', () => {
  const baseMockData: ActivityAnalytics = {
    range: { from: '2026-09-16T00:00:00.000Z', to: '2026-10-16T00:00:00.000Z', granularity: 'day', tz: 'UTC' },
    totals: {
      activeUsers: 8,
      sessions: 50,
      pageViews: 200,
      actions: 60,
      trackedSeconds: 10000,
      avgSessionSeconds: 200,
      avgPagesPerSession: 4,
    },
    previousTotals: {
      activeUsers: 7,
      sessions: 40,
      pageViews: 160,
      actions: 50,
      trackedSeconds: 7000,
      avgSessionSeconds: 175,
      avgPagesPerSession: 4,
    },
    timeline: [],
    pages: [
      {
        path: '/data-management/projects',
        views: 120,
        totalSeconds: 5000, // 50% of 10000 -> triggers top-time-sink (>35%)
        avgSeconds: 41,
        uniqueUsers: 7,
        sessions: 30,
      },
      {
        path: '/data-management/permits',
        views: 10,
        totalSeconds: 300,
        avgSeconds: 30,
        uniqueUsers: 1, // 1 of 10 registered users = 10% -> triggers low-adoption (<20%)
        sessions: 5,
      },
    ],
    actions: [
      { model: 'Project', action: 'update', count: 40, uniqueUsers: 5 },
    ],
    users: [
      {
        userId: 'u1',
        userName: 'Admin User',
        role: 'Administrator',
        sessions: 20,
        activeDays: 10,
        trackedSeconds: 4000,
        pageViews: 80,
        actions: 30,
        avgSessionSeconds: 200,
        lastActive: '2026-10-16T12:00:00.000Z',
        topPath: '/data-management/projects',
        pageSeconds: [],
      },
    ],
    heatmap: [],
    sessionLengthBuckets: [
      { bucket: '<1m', count: 35 }, // 35 of 50 = 70% -> triggers short-sessions (>50%)
      { bucket: '1-5m', count: 10 },
      { bucket: '5-15m', count: 5 },
      { bucket: '15-30m', count: 0 },
      { bucket: '30-60m', count: 0 },
      { bucket: '60m+', count: 0 },
    ],
    transitions: [
      { from: '/data-management/clients', to: '/data-management/permits', count: 15 }, // 15 of 20 = 75% -> frequent-hop
      { from: '/data-management/projects', to: '/data-management/invoices', count: 5 },
    ],
    entryPages: [],
    exitPages: [],
    editedFields: [
      { model: 'Project', field: 'progress', count: 25, uniqueUsers: 4 }, // 25 of 30 = 83% -> hot-field (>15%)
      { model: 'Project', field: 'notes', count: 5, uniqueUsers: 2 },
    ],
    quickDeletes: [
      { model: 'Reminder', count: 7 }, // 7 quick deletes >= 5 -> triggers quick-deletes
    ],
    stickiness: { dau: 4, wau: 7, mau: 8 },
    totalRegisteredActiveUsers: 10,
  };

  it('skips rules when total sessions is below threshold (< 10)', () => {
    const insufficientData: ActivityAnalytics = {
      ...baseMockData,
      totals: {
        ...baseMockData.totals,
        sessions: 5,
      },
    };

    const insights = generateInsights(insufficientData);
    expect(insights).toHaveLength(0);
  });

  it('triggers top-time-sink rule when a page takes >= 35% of total time', () => {
    const insights = generateInsights(baseMockData);
    const timeSink = insights.find((i) => i.id === 'top-time-sink');
    expect(timeSink).toBeDefined();
    expect(timeSink?.params.percent).toBe(50);
  });

  it('triggers low-adoption rule for rarely visited pages (< 20%)', () => {
    const insights = generateInsights(baseMockData);
    const lowAdoption = insights.find((i) => i.id.startsWith('low-adoption'));
    expect(lowAdoption).toBeDefined();
    expect(lowAdoption?.params.users).toBe(1);
    expect(lowAdoption?.params.totalUsers).toBe(10);
  });

  it('triggers hot-field rule for frequently edited fields (>= 15%)', () => {
    const insights = generateInsights(baseMockData);
    const hotField = insights.find((i) => i.id === 'hot-field');
    expect(hotField).toBeDefined();
    expect(hotField?.params.field).toBe('Project.progress');
  });

  it('triggers frequent-hop rule for navigation transitions (>= 10%)', () => {
    const insights = generateInsights(baseMockData);
    const hop = insights.find((i) => i.id === 'frequent-hop');
    expect(hop).toBeDefined();
    expect(hop?.params.count).toBe(15);
  });

  it('triggers short-sessions rule when > 50% sessions are under 1 minute', () => {
    const dataWithShortSessions: ActivityAnalytics = {
      ...baseMockData,
      quickDeletes: [],
      editedFields: [],
      transitions: [],
    };
    const insights = generateInsights(dataWithShortSessions);
    const shortSessions = insights.find((i) => i.id === 'short-sessions');
    expect(shortSessions).toBeDefined();
    expect(shortSessions?.params.percent).toBe(70);
  });

  it('triggers inactive-users rule when active users < total registered users', () => {
    const insights = generateInsights(baseMockData);
    const inactive = insights.find((i) => i.id === 'inactive-users');
    expect(inactive).toBeDefined();
    expect(inactive?.params.count).toBe(9); // 10 registered - 1 active in list
  });

  it('triggers quick-deletes rule when >= 5 records are quickly deleted', () => {
    const insights = generateInsights(baseMockData);
    const qd = insights.find((i) => i.id === 'quick-deletes');
    expect(qd).toBeDefined();
    expect(qd?.params.model).toBe('Reminder');
    expect(qd?.params.count).toBe(7);
  });
});
