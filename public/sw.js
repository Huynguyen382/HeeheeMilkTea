const CACHE_NAME = 'heehee-boba-v10';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './dist/game.min.css',
  './dist/game.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('SW cache.addAll partially skipped:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Let dynamic /api/ requests, non-GET, or extension URLs bypass cache
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http') || e.request.url.includes('/api/')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (!res || res.status !== 200) {
          return res;
        }
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, resClone).catch(() => {});
        });
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

