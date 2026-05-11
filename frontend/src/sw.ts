/// <reference no-default-lib="true"/>
/// <reference lib="es2020" />
/// <reference lib="WebWorker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = "meu-contador-v1";
const OFFLINE_URL = "/offline.html";
const RUNTIME_CACHE = "meu-contador-runtime-v1";

interface QueueItem {
  id: string;
  type: "create" | "update" | "delete";
  endpoint: string;
  payload: unknown;
  timestamp: number;
  retries: number;
}

interface PushData {
  title: string;
  body: string;
}

const DB_NAME = "meu-contador-offline";
const STORE_NAME = "pending-transactions";

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getPendingItems(): Promise<QueueItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as QueueItem[]);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

async function removeFromQueue(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Ignore errors
  }
}

async function processOfflineQueue(): Promise<void> {
  if (!navigator.onLine) return;
  const items = await getPendingItems();
  for (const item of items) {
    try {
      const method =
        item.type === "create" ? "POST" : item.type === "update" ? "PUT" : "DELETE";
      const response = await fetch(item.endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: item.type !== "delete" ? JSON.stringify(item.payload) : undefined,
      });
      if (response.ok || response.status === 404) {
        await removeFromQueue(item.id);
      }
    } catch {
      // Will retry on next online event
    }
  }
}

sw.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["/", OFFLINE_URL]).catch(() => undefined)
    )
  );
  void sw.skipWaiting();
});

sw.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => sw.clients.claim())
  );
});

sw.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method !== "GET") {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith("/api/")) {
      event.respondWith(
        fetch(event.request).catch(() =>
          new Response(JSON.stringify({ error: "offline", queued: true }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
        )
      );
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return (cached ?? networked) as Promise<Response>;
    })
  );
});

sw.addEventListener("sync", (event: SyncEvent) => {
  if (event.tag === "sync-transactions") {
    event.waitUntil(processOfflineQueue());
  }
});

sw.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string } | null;
  if (data?.type === "PROCESS_QUEUE") {
    event.waitUntil(processOfflineQueue());
  }
});

sw.addEventListener("push", (event: PushEvent) => {
  if (!(sw.Notification && sw.Notification.permission === "granted")) return;

  let data: PushData = { title: "Meu Contador", body: "Nova atualização disponível!" };
  if (event.data) {
    try {
      data = event.data.json() as PushData;
    } catch {
      data = { title: "Meu Contador", body: event.data.text() };
    }
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now(), primaryKey: 1 },
    actions: [
      { action: "explore", title: "Ver Detalhes", icon: "/pwa-192x192.png" },
      { action: "close", title: "Fechar", icon: "/pwa-192x192.png" },
    ],
  };

  event.waitUntil(sw.registration.showNotification(data.title, options));
});

sw.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const focused = clientList.find((c) => c.focused);
        const client = focused ?? clientList[0];
        if (client) return client.focus();
        return sw.clients.openWindow("/");
      })
  );
});
