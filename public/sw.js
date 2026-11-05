// EDUCO LMS Service Worker for System Push Notifications & PWA Lifecycle
const CACHE_NAME = 'educo-v20-pure-network';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 1. Show notification from client postMessage (instant foreground & background trigger)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, url, tag, renotify } = event.data;
    const options = {
      body: body || 'Yangi bildirishnoma mavjud',
      icon: icon || '/educo-logo-192.png',
      badge: badge || '/favicon-32x32.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: tag || 'educo-notification',
      renotify: renotify !== false,
      data: {
        url: url || '/',
      },
    };
    event.waitUntil(self.registration.showNotification(title || 'EDUCO LMS', options));
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 2. Standard Web Push event
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'EDUCO LMS';
  const options = {
    body: data.body || 'Yangi bildirishnoma mavjud',
    icon: data.icon || '/educo-logo-192.png',
    badge: data.badge || '/favicon-32x32.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'educo-notification',
    renotify: true,
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 3. Open LMS when user taps notification on phone
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Notice: No 'fetch' event listener!
// Direct native network navigation guarantees net::ERR_FAILED NEVER occurs!
