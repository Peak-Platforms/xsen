// ─── XSEN Service Worker ──────────────────────────────────────────────────────
// Version — bump this to force cache refresh on deploy
const CACHE_VERSION = 'xsen-sooners-v3';

const STATIC_ASSETS = [
  '/',
  '/sooners/app',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
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

// ─── FETCH — NETWORK FIRST, SAFE FALLBACK ─────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache API calls
  if (
    url.hostname.includes('railway.app') ||
    url.hostname.includes('supabase.co')
  ) {
    return;
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);

      // Cache static assets only
      if (
        response &&
        response.ok &&
        STATIC_ASSETS.some(a => url.pathname.startsWith(a))
      ) {
        const cache = await caches.open(CACHE_VERSION);
        cache.put(event.request, response.clone());
      }

      return response;

    } catch (err) {
      console.warn('[SW] Network failed:', err.message);

      const cached = await caches.match(event.request);
      if (cached) return cached;

      // IMPORTANT: ALWAYS return a Response
      if (event.request.mode === 'navigate') {
        const fallback = await caches.match('/sooners/app');
        return fallback || new Response('Offline', {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        });
      }

      return new Response('Network error', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  })());
});

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
self.addEventListener('push', event => {
  console.log('[SW] Push received');

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: 'XSEN Sooners',
      body: event.data ? event.data.text() : 'New update!'
    };
  }

  const title = data.title || '🏈 XSEN Sooners';

  const options = {
    body: data.body || 'New update from Sooner Nation!',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image || null,
    tag: data.tag || 'xsen-sooners',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/sooners/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: '🏈 Open App' },
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

 const targetUrl = 'https://xsen.fun/sooners/app';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes('/sooners/') && 'focus' in client) {
            return client.focus();
          }
        }

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
    (async () => {
      try {
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true
        });

        await fetch('/push/resubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });
      } catch (err) {
        console.warn('[SW] Resubscribe failed:', err.message);
      }
    })()
  );
});

