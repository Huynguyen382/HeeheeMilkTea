const CACHE_NAME = 'heehee-boba-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/room.css',
  './manifest.json',
  './js/main.js',
  './js/api.js',
  './js/characters.js',
  './js/canvas.js',
  './js/modules/state.js',
  './js/modules/ui.js',
  './js/modules/workflow.js',
  './js/modules/modals.js',
  './js/modules/toast.js',
  './js/modules/story.js',
  './js/modules/story-data.js',
  './js/modules/room.js'
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
  // Let dynamic /api/ requests bypass cache
  if (e.request.url.includes('/api/')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      return (
        cached ||
        fetch(e.request).then((res) => {
          if (!res || res.status !== 200 || res.type !== 'basic') {
            return res;
          }
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
          return res;
        }).catch(() => cached)
      );
    })
  );
});

