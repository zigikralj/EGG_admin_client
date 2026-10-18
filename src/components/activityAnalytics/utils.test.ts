import { describe, it, expect } from 'vitest';
import {
  aggregateCanonicalPages,
  formatBucketLabel,
  calculateDelta,
} from './utils';

describe('Activity Analytics Utils', () => {
  describe('aggregateCanonicalPages', () => {
    it('merges raw pages with identical canonical targets', () => {
      const raw = [
        {
          path: '/data-management/projects?tab=active',
          views: 10,
          totalSeconds: 300,
          avgSeconds: 30,
          uniqueUsers: 3,
          sessions: 5,
        },
        {
          path: '/api/projects',
          views: 5,
          totalSeconds: 150,
          avgSeconds: 30,
          uniqueUsers: 2,
          sessions: 3,
        },
        {
          path: '/data-management/clients',
          views: 8,
          totalSeconds: 200,
          avgSeconds: 25,
          uniqueUsers: 2,
          sessions: 4,
        },
      ];

      const merged = aggregateCanonicalPages(raw as any);
      expect(merged).toHaveLength(2);
      const projects = merged.find((m) => m.path === '/data-management/projects');
      expect(projects).toBeDefined();
      expect(projects?.views).toBe(15);
      expect(projects?.totalSeconds).toBe(450);
      expect(projects?.sessions).toBe(8);
    });
  });

  describe('formatBucketLabel', () => {
    it('formats month bucket', () => {
      const formatted = formatBucketLabel('2026-10-01', 'month', 'en');
      expect(formatted).toContain('Oct');
      expect(formatted).toContain('2026');
    });

    it('formats day bucket', () => {
      const formatted = formatBucketLabel('2026-10-16', 'day', 'en');
      expect(formatted).toContain('Oct');
      expect(formatted).toContain('16');
    });
  });

  describe('calculateDelta', () => {
    it('computes positive delta', () => {
      const delta = calculateDelta(120, 100);
      expect(delta.percent).toBe(20);
      expect(delta.direction).toBe('up');
      expect(delta.formatted).toBe('+20%');
    });

    it('computes negative delta', () => {
      const delta = calculateDelta(80, 100);
      expect(delta.percent).toBe(-20);
      expect(delta.direction).toBe('down');
      expect(delta.formatted).toBe('-20%');
    });

    it('handles zero previous gracefully', () => {
      const delta = calculateDelta(50, 0);
      expect(delta.direction).toBe('up');
      expect(delta.formatted).toBe('+100%');
    });

    it('handles null or undefined previous', () => {
      const delta = calculateDelta(50, null);
      expect(delta.percent).toBeNull();
      expect(delta.direction).toBe('neutral');
    });
  });
});
