// Bhasha Setu Progressive Web App (PWA) Service Worker — Enhanced Offline-First V3
const CACHE_NAME = 'bhasha-setu-pwa-v3';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/sql-wasm.wasm',
  '/data/translations.db'
];

// Install event: cache core static app shell + icons + SQLite WASM binary + translations.db
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use Promise.allSettled so an optional resource failure doesn't block PWA install
      return Promise.allSettled(
        PRECACHE_ASSETS.map(asset => cache.add(asset).catch(e => console.warn(`[SW] Precache notice for ${asset}:`, e)))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean outdated caches safely
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log(`[SW] Purging outdated cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Cache-First for critical offline binary assets (.wasm, .db) & stale-while-revalidate for others
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Navigation requests: return cached index.html when disconnected
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 2. High-priority offline binary assets: Cache-first strategy
  if (url.pathname.endsWith('.wasm') || url.pathname.includes('translations.db')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 3. Static assets: Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.destination === 'image') {
            return caches.match('/favicon.svg');
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});
