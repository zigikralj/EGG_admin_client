export interface ActivityLog {
  id: string;
  userId: string;
  userName?: string;
  type: string;
  path?: string;
  details?: string;
  durationSeconds?: number;
  sessionId?: string | null;
  timestamp: string;
}

export interface ActivityLogMonthlyStats {
  id: string;
  userId: string;
  userName?: string;
  yearMonth: string;
  totalDurationSeconds: number;
  sessionCount: number;
  actionCount: number;
  moduleBreakdown?: Record<string, number> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnalyticsTotals {
  activeUsers: number;
  sessions: number;
  pageViews: number;
  actions: number;
  trackedSeconds: number;
  avgSessionSeconds: number;
  avgPagesPerSession: number;
}

export interface ActivityAnalytics {
  range: { from: string; to: string; granularity: 'day' | 'week' | 'month'; tz: string };
  totals: AnalyticsTotals;
  previousTotals: AnalyticsTotals | null;
  timeline: Array<{
    bucket: string;
    activeUsers: number;
    sessions: number;
    trackedSeconds: number;
    pageViews: number;
    actions: number;
  }>;
  pages: Array<{
    path: string;
    views: number;
    totalSeconds: number;
    avgSeconds: number;
    uniqueUsers: number;
    sessions: number;
  }>;
  actions: Array<{
    model: string;
    action: 'create' | 'update' | 'delete';
    count: number;
    uniqueUsers: number;
  }>;
  users: Array<{
    userId: string;
    userName: string;
    role: string | null;
    sessions: number;
    activeDays: number;
    trackedSeconds: number;
    pageViews: number;
    actions: number;
    avgSessionSeconds: number;
    lastActive: string;
    topPath: string | null;
    pageSeconds: Array<{ path: string; seconds: number }>;
    pageActions?: Array<{ path: string; actions: number }>;
  }>;
  heatmap: Array<{ dow: number; hour: number; trackedSeconds: number; actions: number }>;
  sessionLengthBuckets: Array<{
    bucket: '<1m' | '1-5m' | '5-15m' | '15-30m' | '30-60m' | '60m+';
    count: number;
  }>;
  transitions: Array<{ from: string; to: string; count: number }>;
  entryPages: Array<{ path: string; count: number }>;
  exitPages: Array<{ path: string; count: number }>;
  editedFields: Array<{ model: string; field: string; count: number; uniqueUsers: number }>;
  quickDeletes: Array<{ model: string; count: number }>;
  stickiness: { dau: number; wau: number; mau: number };
  totalRegisteredActiveUsers: number;
}

export interface EntityVersionSummary {
  id: string;
  changeSetId: string;
  entityType: string;
  entityId: string;
  version: number;
  op: 'I' | 'U' | 'D' | 'B' | string;
  kind: 'S' | 'D' | string;
  changedFields: string[];
  parentType?: string | null;
  parentId?: string | null;
  createdAt: string;
  changeSet: {
    id: string;
    userId: string | null;
    userName: string | null;
    source: string;
    reason: string | null;
    route: string | null;
    method: string | null;
    createdAt: string;
  };
}

export interface EntityTimelineResponse {
  total: number;
  limit: number;
  offset: number;
  versions: EntityVersionSummary[];
}

export interface VersionDiffResponse {
  entityType: string;
  entityId: string;
  vFrom: number;
  vTo: number;
  fromCreatedAt: string;
  toCreatedAt: string;
  changedFields: string[];
  diff: Record<string, { old: any; new: any }>;
}

export interface RebuiltVersionResponse {
  entityType: string;
  entityId: string;
  version: number;
  op: string;
  kind: string;
  createdAt: string;
  state: Record<string, any>;
}

export interface RestoreVersionResponse {
  restored: boolean;
  entityType: string;
  entityId: string;
  restoredToVersion: number;
  record: any;
}
