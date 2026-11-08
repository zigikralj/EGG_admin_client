import type { ChatConversationItem, ChatMessageItem } from './chatApi';

const DB_NAME = 'ekos_chat_cache_db';
const DB_VERSION = 1;
const CONV_STORE = 'conversations';
const MSG_STORE = 'messages';
const META_STORE = 'metadata';

const isDbSupported = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

function openDB(): Promise<IDBDatabase | null> {
  if (!isDbSupported) return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(CONV_STORE)) {
          db.createObjectStore(CONV_STORE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(MSG_STORE)) {
          const msgStore = db.createObjectStore(MSG_STORE, { keyPath: 'id' });
          msgStore.createIndex('by_conv_seq', ['conversationId', 'seq'], { unique: false });
          msgStore.createIndex('by_conv', 'conversationId', { unique: false });
        }

        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export const chatStorage = {
  // --- Conversations Cache ---
  async getConversations(): Promise<ChatConversationItem[] | null> {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([CONV_STORE], 'readonly');
        const store = tx.objectStore(CONV_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  },

  async saveConversations(conversations: ChatConversationItem[]): Promise<void> {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([CONV_STORE, META_STORE], 'readwrite');
        const convStore = tx.objectStore(CONV_STORE);
        const metaStore = tx.objectStore(META_STORE);

        conversations.forEach((c) => convStore.put(c));
        metaStore.put({ key: 'conversations_synced_at', value: new Date().toISOString() });

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  async getConversationsSyncedAt(): Promise<string | null> {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([META_STORE], 'readonly');
        const store = tx.objectStore(META_STORE);
        const req = store.get('conversations_synced_at');
        req.onsuccess = () => resolve(req.result?.value || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  },

  // --- Messages Cache ---
  async getMessages(conversationId: string): Promise<ChatMessageItem[] | null> {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([MSG_STORE], 'readonly');
        const store = tx.objectStore(MSG_STORE);
        const index = store.index('by_conv');
        const req = index.getAll(conversationId);

        req.onsuccess = () => {
          const list: ChatMessageItem[] = req.result || [];
          list.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
          resolve(list.length > 0 ? list : null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  },

  async saveMessages(conversationId: string, messages: ChatMessageItem[]): Promise<void> {
    const db = await openDB();
    if (!db || messages.length === 0) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([MSG_STORE, META_STORE], 'readwrite');
        const store = tx.objectStore(MSG_STORE);
        const metaStore = tx.objectStore(META_STORE);

        let maxSeq = 0;
        messages.forEach((m) => {
          store.put(m);
          if (m.seq && m.seq > maxSeq) maxSeq = m.seq;
        });

        metaStore.put({
          key: `conv_meta_${conversationId}`,
          maxSeq,
          syncedAt: new Date().toISOString(),
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  async getConversationMeta(conversationId: string): Promise<{ maxSeq: number; syncedAt: string } | null> {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([META_STORE], 'readonly');
        const store = tx.objectStore(META_STORE);
        const req = store.get(`conv_meta_${conversationId}`);
        req.onsuccess = () => resolve(req.result ? { maxSeq: req.result.maxSeq || 0, syncedAt: req.result.syncedAt || '' } : null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  },

  async clearAll(): Promise<void> {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([CONV_STORE, MSG_STORE, META_STORE], 'readwrite');
        tx.objectStore(CONV_STORE).clear();
        tx.objectStore(MSG_STORE).clear();
        tx.objectStore(META_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },
};
