import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly, NetworkFirst, CacheFirst } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

const bgSyncPlugin = new BackgroundSyncPlugin('shopping-lists-queue', {
  maxRetentionTime: 24 * 60 // 24 hours
});

// NetworkFirst for all GET requests to /api/
registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
  }),
  'GET'
);

// Background sync for mutating shopping lists and items
registerRoute(
  ({url}) => url.pathname.includes('/api/shopping-lists') || url.pathname.includes('/api/shopping-items'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

registerRoute(
  ({url}) => url.pathname.includes('/api/shopping-lists') || url.pathname.includes('/api/shopping-items'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PUT'
);

registerRoute(
  ({url}) => url.pathname.includes('/api/shopping-lists') || url.pathname.includes('/api/shopping-items'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'DELETE'
);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


self.addEventListener('push', (event: any) => {
  const data = event.data ? event.data.json() : { title: 'Alerta Financeiro', body: 'Você tem transações pendentes!' };
  
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/mask-icon.svg',
    vibrate: [200, 100, 200],
    tag: data.tag || 'recurring-alert',
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    (self.clients as any).openWindow(event.notification.data || '/')
  );
});
