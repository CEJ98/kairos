const STATIC_CACHE = 'kairos-static-v1';
const RUNTIME_CACHE = 'kairos-runtime-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-icon-180.png',
  '/offline.html',
  '/offline-workout.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Cache-first for static assets we explicitly precache
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Optimize Next.js build assets with stale-while-revalidate
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => cachedResponse);
          return cachedResponse || fetchPromise;
        })
      )
    );
    return;
  }

  // Navigation requests: prefer network, fallback to cache or offline
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            if (url.pathname.startsWith('/workout/')) {
              cache.put(request, clone);
            }
          });
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(RUNTIME_CACHE);
          const cached = await cache.match(request);
          if (cached) {
            return cached;
          }
          if (url.pathname.startsWith('/workout/')) {
            const staticCache = await caches.open(STATIC_CACHE);
            const fallback = await staticCache.match('/offline-workout.html');
            if (fallback) {
              return fallback;
            }
          }
          const staticCache = await caches.open(STATIC_CACHE);
          const offlineFallback = await staticCache.match('/offline.html');
          return (
            offlineFallback || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
          );
        })
    );
    return;
  }

  // API or other requests: network-first with fallback to cache when available
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(RUNTIME_CACHE);
          const cached = await cache.match(request);
          if (cached) {
            return cached;
          }
          return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
  }
});
