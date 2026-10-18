import type { ActivityAnalytics } from '../../types';
import { getCanonicalPagePath } from './utils';

export type InsightSeverity = 'info' | 'opportunity' | 'warning';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  messageKey: string;
  params: Record<string, string | number>;
  targetTab?: 'overview' | 'pages' | 'actions' | 'users' | 'behavior';
  score: number;
}

export const INSIGHT_THRESHOLDS = {
  MIN_SESSIONS_REQUIRED: 10,
  LOW_ADOPTION_RATIO: 0.2,
  TOP_TIME_SINK_RATIO: 0.35,
  HOT_FIELD_RATIO: 0.15,
  FREQUENT_HOP_RATIO: 0.10,
  SHORT_SESSIONS_RATIO: 0.50,
  USAGE_TREND_RATIO: 0.25,
  QUICK_DELETES_COUNT: 5,
};

export function generateInsights(
  data: ActivityAnalytics,
  labelOf: (path: string) => string = (p) => p,
  modelLabelOf: (model: string) => string = (m) => m
): Insight[] {
  // Guard: not enough sessions
  if (data.totals.sessions < INSIGHT_THRESHOLDS.MIN_SESSIONS_REQUIRED) {
    return [];
  }

  const insights: Insight[] = [];

  // 1. Top Time Sink
  if (data.totals.trackedSeconds > 0 && data.pages.length > 0) {
    const topPage = data.pages[0];
    const ratio = topPage.totalSeconds / data.totals.trackedSeconds;
    if (ratio >= INSIGHT_THRESHOLDS.TOP_TIME_SINK_RATIO) {
      const pct = Math.round(ratio * 100);
      insights.push({
        id: 'top-time-sink',
        severity: 'opportunity',
        messageKey: 'insightTopTimeSink',
        params: {
          page: labelOf(topPage.path),
          percent: pct,
        },
        targetTab: 'pages',
        score: 90,
      });
    }
  }

  // 2. Low Adoption
  if (data.totalRegisteredActiveUsers > 0) {
    for (const page of data.pages) {
      const canonical = getCanonicalPagePath(page.path);
      if (canonical.includes('activity-logs') || canonical.includes('roles')) continue;

      const ratio = page.uniqueUsers / data.totalRegisteredActiveUsers;
      if (ratio < INSIGHT_THRESHOLDS.LOW_ADOPTION_RATIO && page.uniqueUsers > 0) {
        insights.push({
          id: `low-adoption-${canonical}`,
          severity: 'opportunity',
          messageKey: 'insightLowAdoption',
          params: {
            page: labelOf(page.path),
            users: page.uniqueUsers,
            totalUsers: data.totalRegisteredActiveUsers,
          },
          targetTab: 'pages',
          score: 70,
        });
        break; // Only report top low-adoption page
      }
    }
  }

  // 3. Hot Field
  const totalFieldChanges = data.editedFields.reduce((sum, f) => sum + f.count, 0);
  if (totalFieldChanges >= 10 && data.editedFields.length > 0) {
    const topField = data.editedFields[0];
    const ratio = topField.count / totalFieldChanges;
    if (ratio >= INSIGHT_THRESHOLDS.HOT_FIELD_RATIO) {
      insights.push({
        id: 'hot-field',
        severity: 'info',
        messageKey: 'insightHotField',
        params: {
          field: `${modelLabelOf(topField.model)}.${topField.field}`,
          count: topField.count,
        },
        targetTab: 'actions',
        score: 80,
      });
    }
  }

  // 4. Frequent Hop (navigation transition)
  const totalTransitions = data.transitions.reduce((sum, t) => sum + t.count, 0);
  if (totalTransitions >= 10 && data.transitions.length > 0) {
    const topTransition = data.transitions[0];
    const ratio = topTransition.count / totalTransitions;
    if (ratio >= INSIGHT_THRESHOLDS.FREQUENT_HOP_RATIO) {
      insights.push({
        id: 'frequent-hop',
        severity: 'opportunity',
        messageKey: 'insightFrequentHop',
        params: {
          from: labelOf(topTransition.from),
          to: labelOf(topTransition.to),
          count: topTransition.count,
        },
        targetTab: 'behavior',
        score: 75,
      });
    }
  }

  // 5. Short Sessions
  const totalBucketsCount = data.sessionLengthBuckets.reduce((sum, b) => sum + b.count, 0);
  const under1m = data.sessionLengthBuckets.find((b) => b.bucket === '<1m')?.count || 0;
  if (totalBucketsCount >= 10 && under1m / totalBucketsCount >= INSIGHT_THRESHOLDS.SHORT_SESSIONS_RATIO) {
    insights.push({
      id: 'short-sessions',
      severity: 'info',
      messageKey: 'insightShortSessions',
      params: {
        percent: Math.round((under1m / totalBucketsCount) * 100),
      },
      targetTab: 'overview',
      score: 65,
    });
  }

  // 6. Inactive Registered Users
  const activeUserIds = new Set(data.users.map((u) => u.userId));
  const inactiveCount = Math.max(0, data.totalRegisteredActiveUsers - activeUserIds.size);
  if (inactiveCount > 0 && data.totalRegisteredActiveUsers >= 3) {
    insights.push({
      id: 'inactive-users',
      severity: 'warning',
      messageKey: 'insightInactiveUsers',
      params: {
        count: inactiveCount,
      },
      targetTab: 'users',
      score: 85,
    });
  }

  // 7. Usage Trend
  if (data.previousTotals && data.previousTotals.trackedSeconds > 0) {
    const deltaSeconds = data.totals.trackedSeconds - data.previousTotals.trackedSeconds;
    const ratio = Math.abs(deltaSeconds) / data.previousTotals.trackedSeconds;
    if (ratio >= INSIGHT_THRESHOLDS.USAGE_TREND_RATIO) {
      const pct = Math.round(ratio * 100);
      const isUp = deltaSeconds > 0;
      insights.push({
        id: 'usage-trend',
        severity: isUp ? 'opportunity' : 'warning',
        messageKey: isUp ? 'insightUsageTrendUp' : 'insightUsageTrendDown',
        params: {
          percent: pct,
        },
        targetTab: 'overview',
        score: 60,
      });
    }
  }

  // 8. Quick Deletes
  if (data.quickDeletes.length > 0) {
    const topQd = data.quickDeletes[0];
    if (topQd.count >= INSIGHT_THRESHOLDS.QUICK_DELETES_COUNT) {
      insights.push({
        id: 'quick-deletes',
        severity: 'warning',
        messageKey: 'insightQuickDeletes',
        params: {
          model: modelLabelOf(topQd.model),
          count: topQd.count,
        },
        targetTab: 'actions',
        score: 82,
      });
    }
  }

  // Sort insights by score desc and take top 6
  return insights.sort((a, b) => b.score - a.score).slice(0, 6);
}
