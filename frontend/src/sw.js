import { precacheAndRoute } from 'workbox-precaching';

// Precaching automático orquestrado pelo Vite
precacheAndRoute(self.__WB_MANIFEST || []);

// Escuta disparos feitos através da VAPID API do Backend (mesmo com App Fechado)
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/masked-icon.svg',
      vibrate: [100, 50, 100],
      data: {
        url: '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Ação de Clique Nativo: Ao tocar o banner de push, focar ou reabrir o WebApp "Meu Contador"
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.claim().then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // Tenta focar se já estiver aberto
        if (windowClients.length > 0) {
          const client = windowClients[0];
          if ('focus' in client) {
            return client.focus();
          }
        }
        // Senão abre uma aba
        if (self.clients.openWindow) {
          return self.clients.openWindow(event.notification.data.url);
        }
      });
    })
  );
});
