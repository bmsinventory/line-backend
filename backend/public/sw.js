// Service Worker — LINE Issue Tracker PWA
const CACHE = 'line-tracker-v1';

const PRECACHE = [
  '/',
  '/manifest.json',
  '/data.js',
  '/helpers.jsx',
  '/inbox.jsx',
  '/board.jsx',
  '/dashboard.jsx',
  '/login.jsx',
  '/settings.jsx',
  '/app.jsx',
  '/icon-192.png',
  '/icon-512.png',
];

// ---- Install: precache static assets ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// ---- Activate: remove old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ---- Fetch: network-first for API/SSE, cache-first for static ----
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always go to network for API calls, SSE, and non-GET
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/webhook/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, clone));
        }
        return res;
      }).catch(() => cached); // offline → serve cache
      return cached || networkFetch;
    })
  );
});

// ---- Push notifications (for future server-push support) ----
self.addEventListener('push', (event) => {
  let data = { title: 'ปัญหาใหม่', body: 'มีปัญหาใหม่เข้ามาในระบบ' };
  try { data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'line-tracker',
      data: data.url || '/',
    })
  );
});

// ---- Notification click: focus/open the app ----
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(event.notification.data || '/');
    })
  );
});
