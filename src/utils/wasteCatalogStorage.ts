import type { WasteCatalog } from '../types';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';

const DB_NAME = 'ekos_project_tracker_db';
const DB_VERSION = 1;
const CATALOG_STORE = 'waste_catalog';
const META_STORE = 'metadata';
const META_KEY = 'waste_catalog_meta';
const SYNC_CHANNEL_NAME = 'ekos_waste_catalog_sync';

export interface CatalogMetadata {
  key: string;
  syncedAt: string | null;
  count: number;
  version: number;
}

export interface WasteCatalogDeltaResponse {
  delta: boolean;
  items: WasteCatalog[];
  deletedIds: string[];
  syncedAt: string;
}

// In-memory cache for 0ms synchronous access
let memoryCache: WasteCatalog[] | null = null;
let memorySyncedAt: string | null = null;
let isDbSupported = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

// Cross-tab broadcast channel
const syncChannel: BroadcastChannel | null =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(SYNC_CHANNEL_NAME)
    : null;

// Listen for catalog updates from other tabs
if (syncChannel) {
  syncChannel.onmessage = (event) => {
    if (event.data?.type === 'CATALOG_UPDATED') {
      // Invalidate memory cache so next read pulls updated records from IndexedDB
      memoryCache = null;
      memorySyncedAt = null;
      // Dispatch window event so mounted React Query / components can refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ekos:waste-catalog-updated', { detail: event.data }));
      }
    } else if (event.data?.type === 'CATALOG_CLEARED') {
      memoryCache = null;
      memorySyncedAt = null;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ekos:waste-catalog-cleared'));
      }
    }
  };
}

function broadcastUpdate(syncedAt: string, count: number): void {
  try {
    syncChannel?.postMessage({
      type: 'CATALOG_UPDATED',
      syncedAt,
      count,
    });
  } catch {
    // Ignore postMessage failure
  }
}

function broadcastClear(): void {
  try {
    syncChannel?.postMessage({ type: 'CATALOG_CLEARED' });
  } catch {
    // Ignore postMessage failure
  }
}

/**
 * Opens or initializes the IndexedDB instance for the waste catalog.
 */
function openDB(): Promise<IDBDatabase | null> {
  if (!isDbSupported) return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(CATALOG_STORE)) {
          const store = db.createObjectStore(CATALOG_STORE, { keyPath: 'id' });
          store.createIndex('code', 'code', { unique: true });
          store.createIndex('frequent', 'frequent', { unique: false });
        }

        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);

      request.onerror = (err) => {
        console.warn('[WasteCatalogStorage] IndexedDB open error, falling back to memory cache:', err);
        isDbSupported = false;
        resolve(null);
      };
    } catch (err) {
      console.warn('[WasteCatalogStorage] IndexedDB initialization failed:', err);
      isDbSupported = false;
      resolve(null);
    }
  });
}

/**
 * Sorts waste catalog items: frequent items first (ascending order 1, 2, ...), then by code ascending.
 */
export function sortWasteCatalog(items: WasteCatalog[]): WasteCatalog[] {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const freqA = a.frequent !== null && a.frequent !== undefined ? a.frequent : Infinity;
    const freqB = b.frequent !== null && b.frequent !== undefined ? b.frequent : Infinity;
    if (freqA !== freqB) {
      return freqA - freqB;
    }
    return (a.code || '').localeCompare(b.code || '');
  });
}

/**
 * Reads all cached catalog items and the last syncedAt timestamp from IndexedDB.
 */
export async function loadCatalogFromDB(): Promise<{ items: WasteCatalog[]; syncedAt: string | null }> {
  if (memoryCache && memoryCache.length > 0) {
    return { items: memoryCache, syncedAt: memorySyncedAt };
  }

  const db = await openDB();
  if (!db) {
    return { items: memoryCache || [], syncedAt: memorySyncedAt };
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([CATALOG_STORE, META_STORE], 'readonly');
      const catalogStore = tx.objectStore(CATALOG_STORE);
      const metaStore = tx.objectStore(META_STORE);

      const itemsRequest = catalogStore.getAll();
      const metaRequest = metaStore.get(META_KEY);

      let items: WasteCatalog[] = [];
      let syncedAt: string | null = null;

      itemsRequest.onsuccess = () => {
        items = (itemsRequest.result as WasteCatalog[]) || [];
      };

      metaRequest.onsuccess = () => {
        const meta = metaRequest.result as CatalogMetadata | undefined;
        if (meta?.syncedAt) {
          syncedAt = meta.syncedAt;
        }
      };

      tx.oncomplete = () => {
        const sorted = sortWasteCatalog(items);
        memoryCache = sorted;
        memorySyncedAt = syncedAt;
        resolve({ items: sorted, syncedAt });
      };

      tx.onerror = () => {
        resolve({ items: [], syncedAt: null });
      };
    } catch (err) {
      console.warn('[WasteCatalogStorage] Failed to read from IndexedDB:', err);
      resolve({ items: [], syncedAt: null });
    }
  });
}

/**
 * Saves a full snapshot of the waste catalog to IndexedDB and updates in-memory cache.
 */
export async function saveCatalogToDB(items: WasteCatalog[], syncedAt: string): Promise<void> {
  const sorted = sortWasteCatalog(items);
  memoryCache = sorted;
  memorySyncedAt = syncedAt;

  const db = await openDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([CATALOG_STORE, META_STORE], 'readwrite');
      const catalogStore = tx.objectStore(CATALOG_STORE);
      const metaStore = tx.objectStore(META_STORE);

      catalogStore.clear();
      for (const item of sorted) {
        if (item.id) {
          catalogStore.put(item);
        }
      }

      const meta: CatalogMetadata = {
        key: META_KEY,
        syncedAt,
        count: sorted.length,
        version: DB_VERSION,
      };
      metaStore.put(meta);

      tx.oncomplete = () => {
        broadcastUpdate(syncedAt, sorted.length);
        resolve();
      };

      tx.onerror = () => resolve();
    } catch (err) {
      console.warn('[WasteCatalogStorage] Failed to save catalog to IndexedDB:', err);
      resolve();
    }
  });
}

/**
 * Reconciles incoming delta changes with the local IndexedDB database and updates memory cache.
 */
export async function applyDeltaToDB(delta: WasteCatalogDeltaResponse): Promise<WasteCatalog[]> {
  const { items: updatedItems, deletedIds, syncedAt } = delta;
  const deletedSet = new Set(deletedIds || []);

  const db = await openDB();
  if (!db) {
    // In-memory fallback
    const current = memoryCache || [];
    const updatedMap = new Map(updatedItems.map((it) => [it.id, it]));
    const preserved = current
      .filter((it) => !deletedSet.has(it.id))
      .map((it) => updatedMap.get(it.id) ?? it);

    const existingIdSet = new Set(current.map((it) => it.id));
    const brandNew = updatedItems.filter((it) => !existingIdSet.has(it.id) && !deletedSet.has(it.id));
    const merged = sortWasteCatalog([...brandNew, ...preserved]);
    memoryCache = merged;
    memorySyncedAt = syncedAt;
    return merged;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([CATALOG_STORE, META_STORE], 'readwrite');
      const catalogStore = tx.objectStore(CATALOG_STORE);
      const metaStore = tx.objectStore(META_STORE);

      // 1. Remove deleted items
      for (const delId of deletedIds) {
        catalogStore.delete(delId);
      }

      // 2. Put created/updated items
      for (const item of updatedItems) {
        if (item.id) {
          catalogStore.put(item);
        }
      }

      // 3. Update metadata
      const itemsRequest = catalogStore.getAll();
      itemsRequest.onsuccess = () => {
        const allItems = (itemsRequest.result as WasteCatalog[]) || [];
        const sorted = sortWasteCatalog(allItems);
        memoryCache = sorted;
        memorySyncedAt = syncedAt;

        const meta: CatalogMetadata = {
          key: META_KEY,
          syncedAt,
          count: sorted.length,
          version: DB_VERSION,
        };
        metaStore.put(meta);
      };

      tx.oncomplete = () => {
        broadcastUpdate(syncedAt, memoryCache?.length || 0);
        resolve(memoryCache || []);
      };

      tx.onerror = () => {
        resolve(memoryCache || []);
      };
    } catch (err) {
      console.warn('[WasteCatalogStorage] Failed to apply delta to IndexedDB:', err);
      resolve(memoryCache || []);
    }
  });
}

/**
 * Upserts a single item in the local cache and database (e.g. after frequent toggle or admin edit).
 */
export async function upsertCatalogItemInDB(item: WasteCatalog): Promise<void> {
  if (!item?.id) return;

  // Update memory cache
  const current = memoryCache || [];
  const idx = current.findIndex((it) => it.id === item.id || it.code === item.code);
  let updatedList: WasteCatalog[];
  if (idx >= 0) {
    updatedList = [...current];
    updatedList[idx] = item;
  } else {
    updatedList = [item, ...current];
  }
  memoryCache = sortWasteCatalog(updatedList);

  const db = await openDB();
  if (!db) return;

  try {
    const tx = db.transaction([CATALOG_STORE], 'readwrite');
    tx.objectStore(CATALOG_STORE).put(item);
  } catch (err) {
    console.warn('[WasteCatalogStorage] Failed to upsert item in IndexedDB:', err);
  }
}

/**
 * Clears the local IndexedDB database and in-memory cache.
 */
export async function clearCatalogDB(): Promise<void> {
  memoryCache = null;
  memorySyncedAt = null;

  const db = await openDB();
  if (!db) {
    broadcastClear();
    return;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([CATALOG_STORE, META_STORE], 'readwrite');
      tx.objectStore(CATALOG_STORE).clear();
      tx.objectStore(META_STORE).clear();
      tx.oncomplete = () => {
        broadcastClear();
        resolve();
      };
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Synchronizes the waste catalog:
 * - Reads from IndexedDB first for instant UI response.
 * - Performs background delta query against /api/waste-catalog?since=...
 * - Reconciles any changes and updates the local storage.
 */
export async function syncWasteCatalog(headers?: Record<string, string>): Promise<WasteCatalog[]> {
  const local = await loadCatalogFromDB();

  // If we already have cached data and a sync timestamp, execute delta sync
  if (local.items.length > 0 && local.syncedAt) {
    try {
      const url = `${API_ROUTES.WASTE_CATALOG.BASE}?since=${encodeURIComponent(local.syncedAt)}`;
      const res = await apiFetch(url, { headers });

      if (res.ok) {
        const json = await res.json();
        if (json && typeof json === 'object' && json.delta === true) {
          const deltaEnvelope = json as WasteCatalogDeltaResponse;
          if (deltaEnvelope.items.length > 0 || (deltaEnvelope.deletedIds && deltaEnvelope.deletedIds.length > 0)) {
            return await applyDeltaToDB(deltaEnvelope);
          }
          // No changes since last sync; update timestamp if provided
          if (deltaEnvelope.syncedAt) {
            memorySyncedAt = deltaEnvelope.syncedAt;
          }
          return local.items;
        }

        // If server responded with a full array (e.g. forced re-sync or reset)
        if (Array.isArray(json)) {
          const serverDate = res.headers?.get ? res.headers.get('date') : null;
          const syncedAt = serverDate ? new Date(serverDate).toISOString() : new Date().toISOString();
          await saveCatalogToDB(json as WasteCatalog[], syncedAt);
          return sortWasteCatalog(json as WasteCatalog[]);
        }
      }
    } catch (err) {
      console.warn('[WasteCatalogStorage] Delta sync failed, using cached catalog:', err);
      return local.items;
    }

    return local.items;
  }

  // Cold start: full fetch from server
  try {
    const res = await apiFetch(API_ROUTES.WASTE_CATALOG.BASE, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch waste catalog (status: ${res.status})`);
    }

    const raw = await res.json();
    const items: WasteCatalog[] = Array.isArray(raw)
      ? raw
      : (raw && Array.isArray(raw.items) ? raw.items : []);
    const serverDate = res.headers?.get ? res.headers.get('date') : null;
    const syncedAt = serverDate ? new Date(serverDate).toISOString() : new Date().toISOString();
    await saveCatalogToDB(items, syncedAt);
    return sortWasteCatalog(items);
  } catch (err) {
    console.error('[WasteCatalogStorage] Failed to fetch full waste catalog:', err);
    // If network fails on cold start, return whatever was in local DB if any
    return local.items;
  }
}

/**
 * Returns current in-memory cached catalog synchronously if available.
 */
export function getMemoryCachedCatalog(): WasteCatalog[] | null {
  return memoryCache;
}
