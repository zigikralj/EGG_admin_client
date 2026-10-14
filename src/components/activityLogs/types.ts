import type { ActivityLog, User } from '../../types';

export interface AccumulatedActivity {
  key: string;
  label: string;
  path?: string;
  type: string;
  totalDurationSeconds: number;
  count: number;
  percentage: number;
  firstTimestamp: string;
  lastTimestamp: string;
  items: ActivityLog[];
}

export interface Session {
  sessionId: string;
  userId: string;
  userName?: string;
  startTime: Date;
  endTime: Date;
  totalDurationSeconds: number;
  isActive: boolean;
  logs: ActivityLog[];
  accumulatedActivities: AccumulatedActivity[];
}

export interface UserActivityGroup {
  userId: string;
  userName: string;
  user?: User;
  totalDurationSeconds: number;
  totalSessionsCount: number;
  totalActivitiesCount: number;
  lastActive: Date;
  sessions: Session[];
  accumulatedActivities: AccumulatedActivity[];
}

export interface KpiStats {
  totalUsers: number;
  activeToday: number;
  totalSessions: number;
  totalTrackedSeconds: number;
  topModule: string;
  topModulePercent: number;
}

export interface DeleteDialogState {
  isOpen: boolean;
  type: 'all' | 'session';
  id?: string;
  ids?: string[];
  label?: string;
}

export type TimeRangeFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
