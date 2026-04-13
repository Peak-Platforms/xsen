// ─── XSEN Service Worker ──────────────────────────────────────────────────────
// Version — bump this to force cache refresh on deploy
const CACHE_VERSION = 'xsen-sooners-v1';

const STATIC_ASSETS = [
  '/',
  '/sooners/app.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        // Non-fatal — app still works without cache
        console.warn('[SW] Cache prefill partial:', err.message);
      });
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH — Network first, cache fallback ────────────────────────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Don't intercept API calls to Railway — always go network
  const url = new URL(event.request.url);
  if (url.hostname.includes('railway.app') || url.hostname.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for static assets
        if (response.ok && STATIC_ASSETS.some(a => url.pathname.startsWith(a))) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Offline fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/sooners/app.html');
          }
        });
      })
  );
});

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
self.addEventListener('push', event => {
  console.log('[SW] Push received');

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'XSEN Sooners', body: event.data ? event.data.text() : 'New update!' };
  }

  const title   = data.title || '🏈 XSEN Sooners';
  const options = {
    body:    data.body || 'New update from Sooner Nation!',
    icon:    data.icon || '/icons/icon-192x192.png',
    badge:   '/icons/badge-72x72.png',
    image:   data.image || null,
    tag:     data.tag || 'xsen-sooners',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/sooners/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open',    title: '🏈 Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── NOTIFICATION CLICK ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || 'https://boomerbot.fun';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes('/sooners/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── PUSH SUBSCRIPTION CHANGE ────────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', event => {
  console.log('[SW] Push subscription changed, resubscribing...');
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: self.VAPID_PUBLIC_KEY
    }).then(subscription => {
      return fetch('/push/resubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });
    })
  );
});

