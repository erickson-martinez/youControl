const fs = require('fs');

let content = fs.readFileSync('src/sw.ts', 'utf8');

if (!content.includes("addEventListener('push'")) {
  content += `

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
`;

  fs.writeFileSync('src/sw.ts', content);
  console.log("SW MODIFIED");
} else {
  console.log("ALREADY MODIFIED");
}
