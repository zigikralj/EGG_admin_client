import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mergeDelta,
  getSyncTimestamp,
  setSyncTimestamp,
  clearSyncTimestamp,
  clearAllSyncTimestamps,
  fetchWithDeltaSync,
} from './deltaSync';
import { QueryClient } from '@tanstack/react-query';
import * as apiModule from '../api';

describe('deltaSync utils', () => {
  beforeEach(() => {
    clearAllSyncTimestamps();
    vi.restoreAllMocks();
  });

  describe('mergeDelta', () => {
    it('returns empty array when existing and delta are empty', () => {
      const result = mergeDelta([], { items: [] });
      expect(result).toEqual([]);
    });

    it('returns new items when existing cache is empty', () => {
      const newItems = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
      const result = mergeDelta([], { items: newItems });
      expect(result).toEqual(newItems);
    });

    it('updates existing items in place with fresh properties', () => {
      const existing = [
        { id: '1', name: 'A', progress: 10 },
        { id: '2', name: 'B', progress: 20 },
      ];
      const delta = {
        items: [{ id: '1', name: 'A Updated', progress: 99 }],
      };
      const result = mergeDelta(existing, delta);
      expect(result).toEqual([
        { id: '1', name: 'A Updated', progress: 99 },
        { id: '2', name: 'B', progress: 20 },
      ]);
    });

    it('prepends brand new items to the front of the list', () => {
      const existing = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ];
      const delta = {
        items: [{ id: '3', name: 'C New' }],
      };
      const result = mergeDelta(existing, delta);
      expect(result).toEqual([
        { id: '3', name: 'C New' },
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ]);
    });

    it('removes deleted items specified in deletedIds', () => {
      const existing = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '3', name: 'C' },
      ];
      const delta = {
        items: [{ id: '2', name: 'B Updated' }],
        deletedIds: ['1', '3'],
      };
      const result = mergeDelta(existing, delta);
      expect(result).toEqual([{ id: '2', name: 'B Updated' }]);
    });

    it('handles simultaneous update, insert, and delete cleanly', () => {
      const existing = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ];
      const delta = {
        items: [
          { id: '2', name: 'B Fresh' },
          { id: '3', name: 'C New' },
        ],
        deletedIds: ['1'],
      };
      const result = mergeDelta(existing, delta);
      expect(result).toEqual([
        { id: '3', name: 'C New' },
        { id: '2', name: 'B Fresh' },
      ]);
    });
  });

  describe('Sync timestamp tracking', () => {
    it('sets, gets, and clears sync timestamps by key', () => {
      const key = 'test-key';
      expect(getSyncTimestamp(key)).toBeNull();

      setSyncTimestamp(key, '2026-10-22T00:00:00.000Z');
      expect(getSyncTimestamp(key)).toBe('2026-10-22T00:00:00.000Z');

      clearSyncTimestamp(key);
      expect(getSyncTimestamp(key)).toBeNull();
    });

    it('clears all timestamps with clearAllSyncTimestamps', () => {
      setSyncTimestamp('k1', 'time1');
      setSyncTimestamp('k2', 'time2');

      clearAllSyncTimestamps();
      expect(getSyncTimestamp('k1')).toBeNull();
      expect(getSyncTimestamp('k2')).toBeNull();
    });
  });

  describe('fetchWithDeltaSync', () => {
    it('performs full fetch without since when cache is empty', async () => {
      const queryClient = new QueryClient();
      const queryKey = ['test-entity'];

      const mockResponse = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      const apiFetchSpy = vi.spyOn(apiModule, 'apiFetch').mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ date: 'Thu, 22 Oct 2026 00:00:00 GMT' }),
        json: async () => mockResponse,
      } as any);

      const data = await fetchWithDeltaSync({
        url: '/api/test',
        queryKey,
        queryClient,
      });

      expect(apiFetchSpy).toHaveBeenCalledWith('/api/test', { headers: undefined });
      expect(data).toEqual(mockResponse);
      expect(getSyncTimestamp(JSON.stringify(queryKey))).toBe('2026-10-22T00:00:00.000Z');
    });

    it('attaches since parameter and merges delta envelope when cached data exists', async () => {
      const queryClient = new QueryClient();
      const queryKey = ['test-entity'];
      const cacheKey = JSON.stringify(queryKey);

      // Prepopulate cache and timestamp
      const existingItems = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      queryClient.setQueryData(queryKey, existingItems);
      setSyncTimestamp(cacheKey, '2026-10-22T00:00:00.000Z');

      const deltaEnvelope = {
        delta: true,
        items: [{ id: '2', name: 'Item 2 Updated' }],
        deletedIds: ['1'],
        syncedAt: '2026-10-22T01:00:00.000Z',
      };

      const apiFetchSpy = vi.spyOn(apiModule, 'apiFetch').mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => deltaEnvelope,
      } as any);

      const data = await fetchWithDeltaSync({
        url: '/api/test',
        queryKey,
        queryClient,
      });

      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/test?since=2026-10-22T00%3A00%3A00.000Z',
        { headers: undefined }
      );
      expect(data).toEqual([{ id: '2', name: 'Item 2 Updated' }]);
      expect(getSyncTimestamp(cacheKey)).toBe('2026-10-22T01:00:00.000Z');
    });

    it('resets sync timestamp if API request fails', async () => {
      const queryClient = new QueryClient();
      const queryKey = ['test-entity'];
      const cacheKey = JSON.stringify(queryKey);

      setSyncTimestamp(cacheKey, '2026-10-22T00:00:00.000Z');

      vi.spyOn(apiModule, 'apiFetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as any);

      await expect(
        fetchWithDeltaSync({
          url: '/api/test',
          queryKey,
          queryClient,
        })
      ).rejects.toThrow('Failed to fetch from /api/test (status: 500)');

      expect(getSyncTimestamp(cacheKey)).toBeNull();
    });
  });
});
