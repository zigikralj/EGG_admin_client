import type { QueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';

export interface DeltaEnvelope<T> {
  delta: boolean;
  items: T[];
  deletedIds: string[];
  syncedAt: string;
}

const syncTimestamps = new Map<string, string>();

export function getSyncTimestamp(key: string): string | null {
  return syncTimestamps.get(key) || null;
}

export function setSyncTimestamp(key: string, timestamp: string): void {
  syncTimestamps.set(key, timestamp);
}

export function clearSyncTimestamp(key: string): void {
  syncTimestamps.delete(key);
}

export function clearAllSyncTimestamps(): void {
  syncTimestamps.clear();
}

/**
 * Reconciles an existing cached collection with incoming delta updates and deleted tombstone IDs.
 * - Preserves existing positions for updated items.
 * - Filters out deleted IDs.
 * - Appends newly created items to the beginning (matching descending timestamp sort).
 */
export function mergeDelta<T extends { id: string }>(
  existing: T[] = [],
  delta: { items: T[]; deletedIds?: string[] }
): T[] {
  const deletedSet = new Set(delta.deletedIds || []);
  const updatedMap = new Map(delta.items.map((item) => [item.id, item]));

  // Update existing items in place and remove deleted ones
  const preserved = existing
    .filter((item) => !deletedSet.has(item.id))
    .map((item) => updatedMap.get(item.id) ?? item);

  // Identify new items not present in existing cache and not deleted
  const existingIdSet = new Set(existing.map((item) => item.id));
  const newItems = delta.items.filter(
    (item) => !existingIdSet.has(item.id) && !deletedSet.has(item.id)
  );

  return [...newItems, ...preserved];
}

export interface FetchWithDeltaOptions {
  url: string;
  queryKey: readonly unknown[];
  queryClient: QueryClient;
  headers?: Record<string, string>;
}

/**
 * Executes a network request leveraging delta query synchronization when cached data exists.
 * Transparently unpacks delta envelopes and updates the local cache.
 */
export async function fetchWithDeltaSync<T extends { id: string }>({
  url,
  queryKey,
  queryClient,
  headers,
}: FetchWithDeltaOptions): Promise<T[]> {
  const cacheKey = JSON.stringify(queryKey);
  const existing = queryClient.getQueryData<T[]>(queryKey);
  const lastSynced =
    Array.isArray(existing) && existing.length > 0 ? getSyncTimestamp(cacheKey) : null;

  const separator = url.includes('?') ? '&' : '?';
  const targetUrl = lastSynced
    ? `${url}${separator}since=${encodeURIComponent(lastSynced)}`
    : url;

  const res = await apiFetch(targetUrl, { headers });
  if (!res.ok) {
    // Reset sync timestamp on error so the next attempt executes a clean full fetch
    clearSyncTimestamp(cacheKey);
    throw new Error(`Failed to fetch from ${url} (status: ${res.status})`);
  }

  const json = await res.json();

  // If response is a delta envelope
  if (json && typeof json === 'object' && json.delta === true && Array.isArray(json.items)) {
    const deltaEnvelope = json as DeltaEnvelope<T>;
    setSyncTimestamp(cacheKey, deltaEnvelope.syncedAt);
    return mergeDelta(existing || [], deltaEnvelope);
  }

  // If response is a standard full array (initial full load or legacy server)
  if (Array.isArray(json)) {
    const serverDate = res.headers.get('date');
    const syncedAt = serverDate ? new Date(serverDate).toISOString() : new Date().toISOString();
    setSyncTimestamp(cacheKey, syncedAt);
    return json as T[];
  }

  // Fallback if wrapped in items property without delta flag
  if (json && typeof json === 'object' && Array.isArray(json.items)) {
    const serverDate = res.headers.get('date');
    const syncedAt = json.syncedAt || (serverDate ? new Date(serverDate).toISOString() : new Date().toISOString());
    setSyncTimestamp(cacheKey, syncedAt);
    return json.items as T[];
  }

  return json as T[];
}
