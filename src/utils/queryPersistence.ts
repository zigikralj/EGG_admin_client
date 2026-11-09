import { QueryClient, dehydrate, hydrate, type DehydratedState } from '@tanstack/react-query';
import { STORAGE_KEYS, TIME_MS } from '../constants';

export const PERSISTENCE_VERSION = 2;

export interface PersistedQueryCachePayload {
  version: number;
  timestamp: number;
  data: DehydratedState;
}

/**
 * Predicate to decide if a query should be persisted to browser storage.
 * Only static or slow-changing app-wide queries (like user directory and summaries)
 * are persisted to disk — never transient, sensitive, or paginated queries.
 */
export function isPersistableQuery(queryKey: readonly unknown[]): boolean {
  if (!Array.isArray(queryKey) || queryKey.length === 0) return false;

  const [domain, subType] = queryKey;

  // Persist user directory and summary queries
  if (domain === 'users' && (subType === 'directory' || subType === 'summary')) {
    return true;
  }

  return false;
}

/**
 * Hydrates the query client with cached data from localStorage.
 * Runs synchronously on application bootstrap before the React tree mounts,
 * ensuring 0ms latency and no empty loading states for users.
 */
export function restorePersistedQueries(queryClient: QueryClient): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUERY_CACHE);
    if (!raw) return false;

    const payload: PersistedQueryCachePayload = JSON.parse(raw);
    if (payload.version !== PERSISTENCE_VERSION) {
      localStorage.removeItem(STORAGE_KEYS.QUERY_CACHE);
      return false;
    }

    // Discard cache older than 7 days
    if (Date.now() - payload.timestamp > TIME_MS.SEVEN_DAYS) {
      localStorage.removeItem(STORAGE_KEYS.QUERY_CACHE);
      return false;
    }

    if (payload.data && Array.isArray(payload.data.queries) && payload.data.queries.length > 0) {
      // Discard any queries with empty arrays or missing data to prevent hydrating stale/empty states
      const validQueries = payload.data.queries.filter((q) => {
        const data = q.state?.data;
        if (data == null) return false;
        if (Array.isArray(data) && data.length === 0) return false;
        return true;
      });

      if (validQueries.length > 0) {
        hydrate(queryClient, { ...payload.data, queries: validQueries });
        return true;
      }

      // If all queries were empty or invalid, clean up corrupted/empty storage
      localStorage.removeItem(STORAGE_KEYS.QUERY_CACHE);
      return false;
    }

    return false;
  } catch (err) {
    console.warn('[QueryPersistence] Failed to restore persisted query cache:', err);
    try {
      localStorage.removeItem(STORAGE_KEYS.QUERY_CACHE);
    } catch {}
    return false;
  }
}

/**
 * Saves persistable queries to localStorage.
 */
export function savePersistedQueries(queryClient: QueryClient): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) => {
        if (!isPersistableQuery(query.queryKey)) return false;
        if (query.state.status !== 'success' || query.state.data == null) return false;
        // Never persist empty collections (e.g. empty user directory or summaries)
        if (Array.isArray(query.state.data) && query.state.data.length === 0) return false;
        return true;
      },
    });

    if (dehydrated.queries.length > 0) {
      const payload: PersistedQueryCachePayload = {
        version: PERSISTENCE_VERSION,
        timestamp: Date.now(),
        data: dehydrated,
      };
      localStorage.setItem(STORAGE_KEYS.QUERY_CACHE, JSON.stringify(payload));
    } else {
      localStorage.removeItem(STORAGE_KEYS.QUERY_CACHE);
    }
  } catch (err) {
    console.warn('[QueryPersistence] Failed to save query cache:', err);
  }
}

/**
 * Clears the persisted query cache in localStorage.
 * Invoked during logout or when cache is explicitly reset.
 */
export function clearPersistedQueries(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.QUERY_CACHE);
  } catch {}
}

/**
 * Subscribes to QueryCache events with debouncing to automatically sync
 * persistable queries to storage whenever they are successfully updated.
 */
export function setupQueryPersistence(
  queryClient: QueryClient,
  debounceMs: number = 300
): () => void {
  if (typeof window === 'undefined') return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;

  const debouncedSave = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      savePersistedQueries(queryClient);
    }, debounceMs);
  };

  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'success') {
      if (isPersistableQuery(event.query.queryKey)) {
        debouncedSave();
      }
    } else if (event.type === 'removed') {
      debouncedSave();
    }
  });

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}

