const STATIC_CACHE_NAME = 'sundar-gutka-static-v7';
const DB_CACHE_NAME = 'sundar-gutka-db-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './icons.svg',
  './fonts/GurbaniAkharTrue.ttf',
  './fonts/GurbaniAkharThickTrue.ttf',
  './fonts/GurbaniAkharHeavyTrue.ttf',
  './fonts/AnmolLipiSG.ttf',
  './data/banis.json',
  './data/banis/2.json',
  './data/banis/3.json',
  './data/banis/4.json',
  './data/banis/6.json',
  './data/banis/9.json',
  './data/banis/10.json',
  './data/banis/21.json',
  './data/banis/22.json',
  './data/banis/23.json',
  './data/banis/30.json',
  './data/banis/31.json',
  './data/banis/36.json',
  './data/banis/90.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DB_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Exclude hot-reload script from being cached
  if (url.pathname.includes('reload')) {
    return;
  }

  // Special cache handling for the JSON database files
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(DB_CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response(JSON.stringify({ error: 'Database resource not available offline' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            });
          });
      })
    );
    return;
  }

  // General cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache successful responses for local static assets
          if (networkResponse && networkResponse.status === 200) {
            if (url.origin === self.location.origin) {
              const responseToCache = networkResponse.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }
          return networkResponse;
        })
        .catch((error) => {
          // Fallback offline behavior for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          // Return a clean error response to prevent console uncaught promise rejections
          return new Response('Network error occurred offline', {
            status: 408,
            statusText: 'Network Connect Timeout'
          });
        });
    })
  );
});
