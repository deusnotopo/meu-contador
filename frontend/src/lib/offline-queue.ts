export interface PendingTransaction {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  payload: unknown;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'meu-contador-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-transactions';

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (db) return db;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

export async function addToQueue(
  endpoint: string,
  payload: unknown,
  type: 'create' | 'update' | 'delete' = 'create'
): Promise<PendingTransaction> {
  const database = await openDB();
  
  const pending: PendingTransaction = {
    id: crypto.randomUUID(),
    type,
    endpoint,
    payload,
    timestamp: Date.now(),
    retries: 0
  };
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(pending);
    
    request.onsuccess = () => {
      dispatchEvent(new CustomEvent('offline-queue-updated'));
      resolve(pending);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getQueueStatus(): Promise<{ count: number; oldest: number | null; pending: PendingTransaction[] }> {
  const database = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const items = request.result as PendingTransaction[];
      const sorted = items.sort((a, b) => a.timestamp - b.timestamp);
      resolve({
        count: items.length,
        oldest: items.length > 0 ? Math.min(...items.map(i => i.timestamp)) : null,
        pending: sorted
      });
    };
    request.onerror = () => reject(request.error);
  });
}

export async function removeFromQueue(id: string): Promise<void> {
  const database = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      dispatchEvent(new CustomEvent('offline-queue-updated'));
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function processQueue(
  onItemProcessed?: (item: PendingTransaction, success: boolean) => void
): Promise<{ success: number; failed: number }> {
  const { pending } = await getQueueStatus();

  // Read auth token — stored by AuthContext in localStorage
  const token = localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '';

  let success = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const response = await fetch(item.endpoint, {
        method: item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: item.type !== 'delete' ? JSON.stringify(item.payload) : undefined,
      });

      if (response.ok || response.status === 404) {
        await removeFromQueue(item.id);
        success++;
        onItemProcessed?.(item, true);
      } else {
        await incrementRetry(item.id);
        failed++;
        onItemProcessed?.(item, false);
      }
    } catch {
      await incrementRetry(item.id);
      failed++;
      onItemProcessed?.(item, false);
    }
  }

  return { success, failed };
}

/** Remove items that exceeded 3 retries and are older than 24 hours */
export async function purgeStaleItems(): Promise<number> {
  const { pending } = await getQueueStatus();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const stale = pending.filter(i => i.retries >= 3 && i.timestamp < cutoff);
  await Promise.all(stale.map(i => removeFromQueue(i.id)));
  return stale.length;
}


async function incrementRetry(id: string): Promise<void> {
  const database = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const item = getRequest.result as PendingTransaction;
      if (item && item.retries < 3) {
        item.retries += 1;
        store.put(item);
      }
      resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onConnectionRestored(callback: () => void): () => void {
  const handler = () => {
    if (navigator.onLine) {
      callback();
    }
  };
  
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}