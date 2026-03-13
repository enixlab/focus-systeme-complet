const CACHE = 'focuscard-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '🔴 LIVE EN COURS — Mentalité Focus';
  const options = {
    body: data.body || 'Un live vient de démarrer. Ouvre ta carte.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/card.html' },
    actions: [
      { action: 'open', title: '🃏 Ouvrir ma carte' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/card.html';
  e.waitUntil(clients.openWindow(url));
});
