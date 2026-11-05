// EDUCO LMS Service Worker for System Push Notifications & PWA Offline Resilience
const CACHE_NAME = 'educo-v19-bulletproof-pwa';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/index.html']).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
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

// 4. Fetch event handler with bulletproof fallback so Chromium never throws ERR_FAILED
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Let API requests pass directly without SW interference
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful HTML & static assets
        if (response && response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone).catch(() => {});
            // If navigating, guarantee /index.html and / are cached
            if (event.request.mode === 'navigate' || event.request.destination === 'document') {
              cache.put('/index.html', resClone.clone()).catch(() => {});
              cache.put('/', resClone.clone()).catch(() => {});
            }
          });
        }
        return response;
      })
      .catch(async () => {
        // 1. Try matching cached response for request
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // 2. If navigating to a page, return cached index.html
        if (event.request.mode === 'navigate' || event.request.destination === 'document') {
          const indexCached = (await caches.match('/index.html')) || (await caches.match('/'));
          if (indexCached) return indexCached;
        }

        // 3. Resilient fallback response (never return undefined to avoid ERR_FAILED)
        return new Response(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><title>EDUCO LMS</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;text-align:center;padding:20px}button{background:#2563eb;color:white;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;cursor:pointer;margin-top:16px}</style></head><body><div><h2>EDUCO LMS</h2><p>Internet aloqasi yoki tarmoqda uzilish yuz berdi.</p><button onclick="window.location.reload()">Qayta yuklash</button></div></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
  );
});
