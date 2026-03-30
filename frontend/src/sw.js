import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

const isDevHost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

if (isDevHost) {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      const registrations = await self.registration.unregister();
      void registrations;

      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((client) => {
        client.navigate(client.url);
      });
    })());
  });
} else {

// 1. Precaching orquestrado pelo Vite
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// 2. Estratégia para Documentos (HTML) - Network First
// Garante a versão mais recente, mas carrega offline se necessário
const htmlHandler = new NetworkFirst({
  cacheName: 'html-cache',
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
  ],
});
registerRoute(new NavigationRoute(htmlHandler));

// 3. Estratégia para Assets Estáticos (Imagens, Ícones) - Cache First
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
      }),
    ],
  })
);

// 4. Estratégia para Scripts e Styles - Stale While Revalidate
registerRoute(
  ({ request, url }) => {
    if (isDevHost) {
      const pathname = url.pathname;
      if (
        pathname.startsWith('/@vite') ||
        pathname.startsWith('/@react-refresh') ||
        pathname.startsWith('/@fs/') ||
        pathname.startsWith('/src/') ||
        pathname.startsWith('/node_modules/.vite/')
      ) {
        return false;
      }
    }

    return request.destination === 'script' || request.destination === 'style';
  },
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// 5. Push Notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || "Você tem uma nova atualização financeira.",
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' }
    };
    event.waitUntil(self.registration.showNotification(data.title || "Meu Contador", options));
  }
});

// 6. Clique na Notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === event.notification.data.url && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(event.notification.data.url);
    })
  );
});

// 7. Background Sync (Previsão para Transações Offline)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    console.log('SW: Sincronizando transações pendentes...');
    // A lógica real de sincronização deve ser implementada via IndexedDB no App
  }
});
}
