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
    expect(screen.getByText('5 active in the last 24h')).toBeInTheDocument();

    // Total Sessions
    expect(screen.getByText('totalSessions')).toBeInTheDocument();
    expect(screen.getByText('36')).toBeInTheDocument();
    expect(screen.getByText('~3 sessions / user')).toBeInTheDocument();

    // Tracked Time
    expect(screen.getByText('totalTrackedTime')).toBeInTheDocument();
    expect(screen.getByText('2h')).toBeInTheDocument();

    // Top Module
    expect(screen.getByText('topModule')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('45% of overall usage')).toBeInTheDocument();
  });

  it('renders localized subtitle strings in Serbian', () => {
    render(
      <ActivityLogsKpiCards
        kpiStats={mockKpiStats}
        language="sr"
        t={mockT}
        isDark={false}
      />
    );

    expect(screen.getByText('5 aktivno u poslednja 24h')).toBeInTheDocument();
    expect(screen.getByText('~3 sesija po korisniku')).toBeInTheDocument();
    expect(screen.getByText('45% ukupnog korišćenja')).toBeInTheDocument();
  });
});
