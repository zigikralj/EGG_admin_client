import type { ActivityAnalytics } from '../../types';
import {
  getCanonicalPagePath,
  getPathLabelAndIcon,
  MODULE_COLORS,
  formatDuration,
} from '../activityLogs/utils';

export {
  getCanonicalPagePath,
  getPathLabelAndIcon,
  MODULE_COLORS,
  formatDuration,
};

export interface CanonicalPageStat {
  path: string;
  label: string;
  icon: React.ReactElement;
  views: number;
  totalSeconds: number;
  avgSeconds: number;
  uniqueUsers: number;
  sessions: number;
}

export function normalizeCanonicalPath(rawPath?: string): string {
  if (!rawPath) return '';
  const clean = rawPath.split('?')[0];
  return getCanonicalPagePath(clean) || clean;
}

/**
 * Aggregates raw page entries from the API into canonical client paths.
 * Merges duplicates that map to the same page (e.g., query params, API equivalents).
 */
export function aggregateCanonicalPages(
  rawPages: ActivityAnalytics['pages'],
  t: (key: any) => string = (k) => k,
  language: string = 'en'
): CanonicalPageStat[] {
  const map = new Map<string, {
    views: number;
    totalSeconds: number;
    uniqueUsers: Set<number>;
    sessions: number;
  }>();

  for (const page of rawPages) {
    const canonical = normalizeCanonicalPath(page.path);
    const existing = map.get(canonical);
    if (existing) {
      existing.views += page.views;
      existing.totalSeconds += page.totalSeconds;
      existing.sessions += page.sessions;
    } else {
      map.set(canonical, {
        views: page.views,
        totalSeconds: page.totalSeconds,
        uniqueUsers: new Set(),
        sessions: page.sessions,
      });
    }
  }

  const result: CanonicalPageStat[] = [];
  for (const [path, stats] of map.entries()) {
    const { label, icon } = getPathLabelAndIcon(path, undefined, t, language);
    result.push({
      path,
      label,
      icon,
      views: stats.views,
      totalSeconds: stats.totalSeconds,
      avgSeconds: stats.views > 0 ? Math.round(stats.totalSeconds / stats.views) : 0,
      uniqueUsers: 0, // Approximate unique users when merged across raw paths
      sessions: stats.sessions,
    });
  }

  // Also preserve uniqueUsers from raw if single match
  for (const page of rawPages) {
    const canonical = normalizeCanonicalPath(page.path);
    const item = result.find((r) => r.path === canonical);
    if (item && page.uniqueUsers > item.uniqueUsers) {
      item.uniqueUsers = page.uniqueUsers;
    }
  }

  return result.sort((a, b) => b.totalSeconds - a.totalSeconds || b.views - a.views);
}

/**
 * Formats timeline date bucket according to granularity and user language.
 */
export function formatBucketLabel(
  bucket: string,
  granularity: 'day' | 'week' | 'month',
  language: string = 'en'
): string {
  const date = new Date(bucket);
  if (isNaN(date.getTime())) return bucket;

  const locale = language === 'en' ? 'en-US' : language === 'sr-Cyrl' ? 'sr-Cyrl-RS' : 'sr-Latn-RS';

  if (granularity === 'month') {
    return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
  }
  if (granularity === 'week') {
    const weekPrefix = language === 'en' ? 'W' : language === 'sr-Cyrl' ? 'Нед. ' : 'Ned. ';
    return `${weekPrefix}${getWeekNumber(date)} • ${date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`;
  }
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/**
 * Returns localized model/entity name.
 */
export function getModelLabel(model: string, t: (key: any) => string): string {
  switch (model) {
    case 'Project':
      return t('tabProjects');
    case 'ProvidedService':
      return t('tabProvidedServices');
    case 'Client':
      return t('tabClients');
    case 'Permit':
      return t('tabPermits');
    case 'Invoice':
      return t('tabInvoices');
    case 'Category':
      return t('tabCategories');
    case 'Service':
      return t('tabServices');
    case 'User':
      return t('tabUsers');
    case 'Role':
      return t('roles');
    case 'Reminder':
      return t('tabReminders');
    case 'ActivityLog':
      return t('tabActivityLogs');
    default:
      return model;
  }
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calculates percentage delta between current and previous values.
 */
export function calculateDelta(current: number, previous: number | null | undefined): {
  percent: number | null;
  direction: 'up' | 'down' | 'neutral';
  formatted: string;
} {
  if (previous === null || previous === undefined || previous === 0) {
    if (current > 0 && previous === 0) {
      return { percent: 100, direction: 'up', formatted: '+100%' };
    }
    return { percent: null, direction: 'neutral', formatted: '-' };
  }

  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);

  if (pct > 0) {
    return { percent: pct, direction: 'up', formatted: `+${pct}%` };
  }
  if (pct < 0) {
    return { percent: pct, direction: 'down', formatted: `${pct}%` };
  }
  return { percent: 0, direction: 'neutral', formatted: '0%' };
}
