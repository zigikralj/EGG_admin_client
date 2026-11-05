import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActivityLogsKpiCards } from './ActivityLogsKpiCards';
import type { KpiStats } from './types';

describe('ActivityLogsKpiCards component', () => {
  const mockKpiStats: KpiStats = {
    totalUsers: 12,
    activeToday: 5,
    totalSessions: 36,
    totalTrackedSeconds: 7200,
    topModule: 'Projects',
    topModulePercent: 45
  };

  const mockT = (key: string) => key;

  it('renders all 4 metric cards correctly in English', () => {
    render(
      <ActivityLogsKpiCards
        kpiStats={mockKpiStats}
        language="en"
        t={mockT}
        isDark={false}
      />
    );

    // Tracked Users
    expect(screen.getByText('totalTrackedUsers')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('5 activeInLast24h')).toBeInTheDocument();

    // Total Sessions
    expect(screen.getByText('totalSessions')).toBeInTheDocument();
    expect(screen.getByText('36')).toBeInTheDocument();
    expect(screen.getByText('~3 sessionsPerUser')).toBeInTheDocument();

    // Tracked Time
    expect(screen.getByText('totalTrackedTime')).toBeInTheDocument();
    expect(screen.getByText('2h')).toBeInTheDocument();
    expect(screen.getByText('3m 20s avgPerSession')).toBeInTheDocument();

    // Top Module
    expect(screen.getByText('topModule')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('45% ofOverallUsage')).toBeInTheDocument();
  });

  it('renders localized subtitle strings when t provides localized values', () => {
    const srDict: Record<string, string> = {
      activeInLast24h: 'aktivno u poslednja 24h',
      sessionsPerUser: 'sesija po korisniku',
      avgPerSession: 'prosečno po sesiji',
      ofOverallUsage: 'ukupnog korišćenja'
    };
    const srT = (key: string) => srDict[key] || key;

    render(
      <ActivityLogsKpiCards
        kpiStats={mockKpiStats}
        t={srT}
        isDark={false}
      />
    );

    expect(screen.getByText('5 aktivno u poslednja 24h')).toBeInTheDocument();
    expect(screen.getByText('~3 sesija po korisniku')).toBeInTheDocument();
    expect(screen.getByText('3m 20s prosečno po sesiji')).toBeInTheDocument();
    expect(screen.getByText('45% ukupnog korišćenja')).toBeInTheDocument();
  });
});
