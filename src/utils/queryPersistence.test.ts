import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  PERSISTENCE_VERSION,
  isPersistableQuery,
  restorePersistedQueries,
  savePersistedQueries,
  clearPersistedQueries,
  setupQueryPersistence,
} from './queryPersistence';
import { STORAGE_KEYS, TIME_MS } from '../constants';

describe('queryPersistence', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isPersistableQuery', () => {
    it('identifies user directory and summary queries as persistable', () => {
      expect(isPersistableQuery(['users', 'directory'])).toBe(true);
      expect(isPersistableQuery(['users', 'summary'])).toBe(true);
      expect(isPersistableQuery(['chat', 'allUsers'])).toBe(true);
    });

    it('rejects volatile, paginated, or sensitive queries', () => {
      expect(isPersistableQuery(['users', 'paginated', 1, 10])).toBe(false);
      expect(isPersistableQuery(['projects'])).toBe(false);
      expect(isPersistableQuery(['chat', 'messages', 'conv-1'])).toBe(false);
      expect(isPersistableQuery(['invoices'])).toBe(false);
      expect(isPersistableQuery([])).toBe(false);
      expect(isPersistableQuery(null as any)).toBe(false);
    });
  });

  describe('savePersistedQueries & restorePersistedQueries', () => {
    it('persists allowed queries and restores them into a new QueryClient', () => {
      const mockUsers = [
        { id: '1', name: 'Alice', role: 'Developer' },
        { id: '2', name: 'Bob', role: 'Manager' },
      ];

      // Seed queryClient with both persistable and non-persistable data
      queryClient.setQueryData(['users', 'directory'], mockUsers);
      queryClient.setQueryData(['projects'], [{ id: 'p1', name: 'Project 1' }]);

      savePersistedQueries(queryClient);

      // Verify localStorage was written
      const stored = localStorage.getItem(STORAGE_KEYS.QUERY_CACHE);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(PERSISTENCE_VERSION);
      expect(parsed.data.queries).toHaveLength(1);
      expect(parsed.data.queries[0].queryKey).toEqual(['users', 'directory']);

      // Restore into a fresh QueryClient
      const freshClient = new QueryClient();
      const restored = restorePersistedQueries(freshClient);

      expect(restored).toBe(true);
      expect(freshClient.getQueryData(['users', 'directory'])).toEqual(mockUsers);
      expect(freshClient.getQueryData(['projects'])).toBeUndefined();
    });

    it('returns false and cleans up corrupted storage', () => {
      localStorage.setItem(STORAGE_KEYS.QUERY_CACHE, '{ invalid json');

      const restored = restorePersistedQueries(queryClient);
      expect(restored).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.QUERY_CACHE)).toBeNull();
    });

    it('discards cache with mismatched version', () => {
      localStorage.setItem(
        STORAGE_KEYS.QUERY_CACHE,
        JSON.stringify({
          version: 999,
          timestamp: Date.now(),
          data: { queries: [] },
        })
      );

      const restored = restorePersistedQueries(queryClient);
      expect(restored).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.QUERY_CACHE)).toBeNull();
    });

    it('discards expired cache older than 7 days', () => {
      localStorage.setItem(
        STORAGE_KEYS.QUERY_CACHE,
        JSON.stringify({
          version: PERSISTENCE_VERSION,
          timestamp: Date.now() - (TIME_MS.SEVEN_DAYS + 1000),
          data: { queries: [{ queryKey: ['users', 'directory'], state: { data: [] } }] },
        })
      );

      const restored = restorePersistedQueries(queryClient);
      expect(restored).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.QUERY_CACHE)).toBeNull();
    });

    it('removes storage when no persistable queries are present', () => {
      queryClient.setQueryData(['projects'], [{ id: '1' }]);
      savePersistedQueries(queryClient);
      expect(localStorage.getItem(STORAGE_KEYS.QUERY_CACHE)).toBeNull();
    });
  });

  describe('clearPersistedQueries', () => {
    it('removes the persisted query cache from storage', () => {
      localStorage.setItem(STORAGE_KEYS.QUERY_CACHE, 'dummy');
      clearPersistedQueries();
      expect(localStorage.getItem(STORAGE_KEYS.QUERY_CACHE)).toBeNull();
    });
  });

  describe('setupQueryPersistence', () => {
    it('automatically debounces and saves when persistable query updates', async () => {
      vi.useFakeTimers();

      const unsubscribe = setupQueryPersistence(queryClient, 100);

      queryClient.setQueryData(['users', 'directory'], [{ id: 'u1', name: 'User 1' }]);

      // Not saved immediately due to debounce
      expect(localStorage.getItem(STORAGE_KEYS.QUERY_CACHE)).toBeNull();

      // Fast-forward debounce timer
      vi.advanceTimersByTime(150);

      const stored = localStorage.getItem(STORAGE_KEYS.QUERY_CACHE);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.data.queries[0].queryKey).toEqual(['users', 'directory']);

      unsubscribe();
    });
  });
});

