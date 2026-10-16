import { describe, it, expect } from 'vitest';
import {
  isEmptyUpdateLog,
  formatDuration,
  formatDiffValue,
  getCanonicalPagePath,
  getPathLabelAndIcon,
  getActionChip,
  formatDateOnly,
  formatTimeOnly,
  formatDateTime
} from './utils';
import type { ActivityLog } from '../../types';
import { API_ROUTES, PAGE_ROUTES } from '../../constants';

describe('Activity Logs Utils', () => {
  describe('isEmptyUpdateLog', () => {
    it('returns false for non-UPDATE logs', () => {
      const log = { type: 'PAGE_VIEW' } as ActivityLog;
      expect(isEmptyUpdateLog(log)).toBe(false);
    });

    it('returns false for UPDATE log without details (details lazy-loaded in list query)', () => {
      const log = { type: 'UPDATE' } as ActivityLog;
      expect(isEmptyUpdateLog(log)).toBe(false);
    });

    it('returns false when diff has actual modified fields', () => {
      const log = {
        type: 'UPDATE',
        details: JSON.stringify({
          diff: {
            title: { old: 'Old Title', new: 'New Title' }
          }
        })
      } as ActivityLog;
      expect(isEmptyUpdateLog(log)).toBe(false);
    });

    it('returns true when diff old and new values are identical', () => {
      const log = {
        type: 'UPDATE',
        details: JSON.stringify({
          diff: {
            title: { old: 'Same', new: 'Same' }
          }
        })
      } as ActivityLog;
      expect(isEmptyUpdateLog(log)).toBe(true);
    });
  });

  describe('formatDuration', () => {
    it('returns "-" for undefined or null', () => {
      expect(formatDuration(undefined)).toBe('-');
    });

    it('formats seconds only', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2m 5s');
      expect(formatDuration(120)).toBe('2m');
    });

    it('formats hours and minutes', () => {
      expect(formatDuration(3660)).toBe('1h 1m');
      expect(formatDuration(7200)).toBe('2h');
    });
  });

  describe('formatDiffValue', () => {
    it('formats null and undefined', () => {
      expect(formatDiffValue(null)).toBe('null');
      expect(formatDiffValue(undefined)).toBe('undefined');
    });

    it('formats boolean and object values', () => {
      expect(formatDiffValue(true)).toBe('true');
      expect(formatDiffValue(false)).toBe('false');
      expect(formatDiffValue({ a: 1 })).toBe('{"a":1}');
    });

    it('formats string and number values', () => {
      expect(formatDiffValue('hello')).toBe('hello');
      expect(formatDiffValue(42)).toBe('42');
    });
  });

  describe('getCanonicalPagePath', () => {
    it('handles empty path', () => {
      expect(getCanonicalPagePath('')).toBe('');
      expect(getCanonicalPagePath(undefined)).toBe('');
    });

    it('canonicalizes provided-services API paths', () => {
      expect(getCanonicalPagePath(`${API_ROUTES.PROVIDED_SERVICES.BASE}?page=1`)).toBe(PAGE_ROUTES.PROVIDED_SERVICES);
      expect(getCanonicalPagePath(API_ROUTES.PROVIDED_SERVICES.BY_ID('123'))).toBe(PAGE_ROUTES.PROVIDED_SERVICES);
    });

    it('canonicalizes categories API paths', () => {
      expect(getCanonicalPagePath(API_ROUTES.CATEGORIES.BASE)).toBe(PAGE_ROUTES.CATEGORIES);
      expect(getCanonicalPagePath(API_ROUTES.CATEGORIES.BY_ID('123'))).toBe(PAGE_ROUTES.CATEGORIES);
    });

    it('canonicalizes invoices API paths', () => {
      expect(getCanonicalPagePath(API_ROUTES.INVOICES.BASE)).toBe(PAGE_ROUTES.INVOICES);
      expect(getCanonicalPagePath(API_ROUTES.INVOICES.BY_ID('123'))).toBe(PAGE_ROUTES.INVOICES);
    });

    it('canonicalizes other API resource paths', () => {
      expect(getCanonicalPagePath(API_ROUTES.PROJECTS.BY_ID('123'))).toBe(PAGE_ROUTES.PROJECTS);
      expect(getCanonicalPagePath(API_ROUTES.CLIENTS.BASE)).toBe(PAGE_ROUTES.CLIENTS);
    });

    it('preserves client-side paths', () => {
      expect(getCanonicalPagePath(PAGE_ROUTES.PROJECT_TRACKER)).toBe(PAGE_ROUTES.PROJECT_TRACKER);
      expect(getCanonicalPagePath('/dashboard')).toBe('/dashboard');
    });

    it('canonicalizes root path "/" to Dashboard', () => {
      expect(getCanonicalPagePath('/')).toBe(PAGE_ROUTES.PROJECT_TRACKER_PROJECTS);
    });
  });

  describe('getPathLabelAndIcon', () => {
    const mockT = (key: string) => key;

    it('handles lifecycle types without path', () => {
      const login = getPathLabelAndIcon(undefined, 'LOGIN', mockT, 'en');
      expect(login.label).toBe('Login');

      const logout = getPathLabelAndIcon(undefined, 'LOGOUT', mockT, 'en');
      expect(logout.label).toBe('Logout');

      const offline = getPathLabelAndIcon(undefined, 'OFFLINE', mockT, 'en');
      expect(offline.label).toBe('Offline');

      const online = getPathLabelAndIcon(undefined, 'ONLINE', mockT, 'en');
      expect(online.label).toBe('Online');
    });

    it('handles Serbian translations for lifecycle types', () => {
      const login = getPathLabelAndIcon(undefined, 'LOGIN', mockT, 'sr');
      expect(login.label).toBe('Prijava');

      const logout = getPathLabelAndIcon(undefined, 'LOGOUT', mockT, 'sr');
      expect(logout.label).toBe('Odjava');
    });

    it('handles known application routes', () => {
      expect(getPathLabelAndIcon('/project-tracker', undefined, mockT).label).toBe('tabDashboard');
      expect(getPathLabelAndIcon('/projects', undefined, mockT).label).toBe('tabProjects');
      expect(getPathLabelAndIcon('/clients', undefined, mockT).label).toBe('tabClients');
      expect(getPathLabelAndIcon('/permits', undefined, mockT).label).toBe('tabPermits');
    });
  });

  describe('getActionChip', () => {
    it('returns UPDATE chip for update action or type', () => {
      const chip = getActionChip('update');
      expect(chip?.props.label).toBe('UPDATE');
    });

    it('returns CREATE chip for create action or type', () => {
      const chip = getActionChip(undefined, 'CREATE');
      expect(chip?.props.label).toBe('CREATE');
    });

    it('returns DELETE chip for delete action or type', () => {
      const chip = getActionChip('DELETE');
      expect(chip?.props.label).toBe('DELETE');
    });

    it('returns null for unknown action', () => {
      expect(getActionChip('OTHER')).toBeNull();
    });
  });

  describe('Date formatters', () => {
    const sampleDate = new Date('2026-10-14T10:30:00Z');

    it('formats date and time without errors', () => {
      expect(formatDateOnly(sampleDate, 'en')).toBeDefined();
      expect(formatTimeOnly(sampleDate, 'en')).toBeDefined();
      expect(formatDateTime(sampleDate, 'en')).toBeDefined();
    });
  });
});
