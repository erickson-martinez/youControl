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
