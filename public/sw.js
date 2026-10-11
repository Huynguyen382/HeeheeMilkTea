const CACHE_NAME = 'heehee-boba-v9';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/room.css',
  './css/farm.css',
  './css/franchise.css',
  './css/staff.css',
  './js/audio.js',
  './js/characters.js',
  './js/workstation.js',
  './js/api.js',
  './js/app.js',
  './js/canvas.js',
  './js/canvas/background.js',
  './js/canvas/background/cache.js',
  './js/canvas/background/atmosphere.js',
  './js/canvas/background/scene-town.js',
  './js/canvas/background/scene-hust.js',
  './js/canvas/background/scene-walking-street.js',
  './js/canvas/background/scene-moc-chau.js',
  './js/canvas/background/scene-franchise.js',
  './js/canvas/cart.js',
  './js/canvas/events.js',
  './js/canvas/fx.js',
  './js/canvas/joystick.js',
  './js/canvas/npc.js',
  './js/canvas/primitives.js',
  './js/canvas/room-avatar.js',
  './js/canvas/room-background.js',
  './js/canvas/room-furniture.js',
  './js/canvas/room-renderer.js',
  './js/canvas/time.js',
  './js/canvas/weather.js',
  './js/modules/auth.js',
  './js/modules/dev-mode.js',
  './js/modules/events.js',
  './js/modules/farm.js',
  './js/modules/franchise.js',
  './js/modules/live-sync.js',
  './js/modules/market.js',
  './js/modules/modal-sync.js',
  './js/modules/modals.js',
  './js/modules/npc-appearances.js',
  './js/modules/order-manager.js',
  './js/modules/pixel-art.js',
  './js/modules/pricing.js',
  './js/modules/rest.js',
  './js/modules/room.js',
  './js/modules/shift.js',
  './js/modules/staff.js',
  './js/modules/state.js',
  './js/modules/story-data.js',
  './js/modules/story.js',
  './js/modules/toast.js',
  './js/modules/ui.js',
  './js/modules/weather.js',
  './js/modules/workflow.js'
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

