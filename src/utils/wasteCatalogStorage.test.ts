import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sortWasteCatalog,
  loadCatalogFromDB,
  saveCatalogToDB,
  applyDeltaToDB,
  upsertCatalogItemInDB,
  clearCatalogDB,
  syncWasteCatalog,
  getMemoryCachedCatalog,
} from './wasteCatalogStorage';
import type { WasteCatalog } from '../types';
import * as api from '../api';

function setupMockIndexedDB() {
  const storeData: Record<string, Map<string, any>> = {
    waste_catalog: new Map(),
    metadata: new Map(),
  };

  const createMockObjectStore = (storeName: string) => ({
    createIndex: vi.fn(),
    getAll: () => {
      const req: any = { result: Array.from(storeData[storeName].values()) };
      setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
      return req;
    },
    get: (key: string) => {
      const req: any = { result: storeData[storeName].get(key) };
      setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
      return req;
    },
    put: (item: any) => {
      const key = item.id || item.key;
      storeData[storeName].set(key, item);
      const req: any = { result: key };
      setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
      return req;
    },
    delete: (key: string) => {
      storeData[storeName].delete(key);
      const req: any = {};
      setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
      return req;
    },
    clear: () => {
      storeData[storeName].clear();
      const req: any = {};
      setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
      return req;
    },
  });

  const mockDb: any = {
    objectStoreNames: {
      contains: (name: string) => Boolean(storeData[name]),
    },
    createObjectStore: (name: string) => {
      if (!storeData[name]) storeData[name] = new Map();
      return createMockObjectStore(name);
    },
    transaction: (_stores: string[]) => {
      const tx: any = {
        objectStore: (name: string) => createMockObjectStore(name),
        oncomplete: null,
        onerror: null,
      };
      setTimeout(() => tx.oncomplete && tx.oncomplete({ target: tx }), 10);
      return tx;
    },
  };

  const mockIndexedDB = {
    open: (_name: string, _version: number) => {
      const req: any = {
        result: mockDb,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };
      setTimeout(() => {
        if (req.onupgradeneeded) {
          req.onupgradeneeded({ target: req });
        }
        if (req.onsuccess) {
          req.onsuccess({ target: req });
        }
      }, 0);
      return req;
    },
  };

  (globalThis as any).window = globalThis.window || {};
  Object.defineProperty(globalThis.window, 'indexedDB', {
    value: mockIndexedDB,
    writable: true,
    configurable: true,
  });

  return { storeData };
}

describe('wasteCatalogStorage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setupMockIndexedDB();
    await clearCatalogDB();
  });

  const sampleItems: WasteCatalog[] = [
    { id: '1', code: '15 01 02', description: 'Plastic', isHazardous: false, frequent: null },
    { id: '2', code: '15 01 01', description: 'Paper', isHazardous: false, frequent: 2 },
    { id: '3', code: '16 01 03', description: 'Tyres', isHazardous: false, frequent: 1 },
    { id: '4', code: '15 01 10*', description: 'Hazardous packaging', isHazardous: true, frequent: null },
  ];

  it('correctly sorts catalog with frequent items first, then by code', () => {
    const sorted = sortWasteCatalog(sampleItems);
    expect(sorted.map((s) => s.code)).toEqual([
      '16 01 03', // frequent: 1
      '15 01 01', // frequent: 2
      '15 01 02', // frequent: null, code asc
      '15 01 10*', // frequent: null, code asc
    ]);
  });

  it('saves and loads catalog items from IndexedDB', async () => {
    const timestamp = '2026-10-22T20:00:00.000Z';
    await saveCatalogToDB(sampleItems, timestamp);

    const result = await loadCatalogFromDB();
    expect(result.items.length).toBe(4);
    expect(result.syncedAt).toBe(timestamp);
    expect(getMemoryCachedCatalog()?.length).toBe(4);
  });

  it('reconciles delta updates: modifies items, removes deleted IDs, and updates metadata', async () => {
    const initialTimestamp = '2026-10-22T20:00:00.000Z';
    await saveCatalogToDB(sampleItems, initialTimestamp);

    const delta = {
      delta: true,
      items: [
        { id: '1', code: '15 01 02', description: 'Plastic packaging updated', isHazardous: false, frequent: 3 },
        { id: '5', code: '17 01 01', description: 'Concrete', isHazardous: false, frequent: null },
      ],
      deletedIds: ['4'], // delete item with id: '4'
      syncedAt: '2026-10-22T20:30:00.000Z',
    };

    const updated = await applyDeltaToDB(delta);
    expect(updated.length).toBe(4); // 4 - 1 + 1 = 4
    expect(updated.some((it) => it.id === '4')).toBe(false);
    expect(updated.find((it) => it.id === '1')?.description).toBe('Plastic packaging updated');
    expect(updated.find((it) => it.id === '5')?.description).toBe('Concrete');

    const loaded = await loadCatalogFromDB();
    expect(loaded.syncedAt).toBe('2026-10-22T20:30:00.000Z');
  });

  it('upserts a single item in memory and IndexedDB', async () => {
    await saveCatalogToDB(sampleItems, '2026-10-22T20:00:00.000Z');

    const updatedItem: WasteCatalog = {
      id: '2',
      code: '15 01 01',
      description: 'Paper modified',
      isHazardous: false,
      frequent: 1,
    };
    await upsertCatalogItemInDB(updatedItem);

    const loaded = await loadCatalogFromDB();
    const found = loaded.items.find((it) => it.id === '2');
    expect(found?.description).toBe('Paper modified');
    expect(found?.frequent).toBe(1);
  });

  it('syncWasteCatalog performs full load on cold start', async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValueOnce({
      ok: true,
      headers: { get: () => '2026-10-22T20:00:00.000Z' },
      json: async () => sampleItems,
    } as any);

    const result = await syncWasteCatalog();
    expect(result.length).toBe(4);
    expect(api.apiFetch).toHaveBeenCalledTimes(1);

    const loaded = await loadCatalogFromDB();
    expect(loaded.items.length).toBe(4);
  });

  it('syncWasteCatalog performs delta query when local cache is populated', async () => {
    await saveCatalogToDB(sampleItems, '2026-10-22T20:00:00.000Z');

    vi.spyOn(api, 'apiFetch').mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null },
      json: async () => ({
        delta: true,
        items: [{ id: '6', code: '20 01 01', description: 'Paper municipal', isHazardous: false }],
        deletedIds: [],
        syncedAt: '2026-10-22T20:45:00.000Z',
      }),
    } as any);

    const result = await syncWasteCatalog();
    expect(result.length).toBe(5);
    expect(api.apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('since='),
      expect.anything()
    );
  });
});
