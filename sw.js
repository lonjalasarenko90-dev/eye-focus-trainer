// Eye Focus Trainer — Service Worker v2
const CACHE = 'eye-trainer-v2';
const ASSETS = [
  './eye-trainer-pwa.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return res;
      }).catch(() => caches.match('./eye-trainer-pwa.html'));
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Eye Focus Trainer 👁', {
      body: data.body || 'Час для вправи! 5 хвилин для ваших очей.',
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: '▶ Тренуватись' },
        { action: 'dismiss', title: 'Пізніше' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('./eye-trainer-pwa.html');
    })
  );
});

// Periodic background sync (Chrome Android, якщо дозволено)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'eye-reminder') {
    event.waitUntil(
      self.registration.showNotification('Eye Focus Trainer 👁', {
        body: 'Не забудьте про вправи для очей сьогодні!',
        icon: './icon-192.png',
        vibrate: [200, 100, 200]
      })
    );
  }
});
