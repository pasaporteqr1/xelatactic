const CACHE_NAME = 'tactics-heat-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/style.css',
  '/assets/logowhite.png',
  'https://unpkg.com/lucide@latest',
  'https://unpkg.com/konva@latest/konva.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple strategy: Online first, fallback to cache for static assets.
  // For Konva/Lucide external links, we'd cache them as well.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache new successful requests
        if (response.status === 200) {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cacheCopy);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, serve from cache
        return caches.match(event.request);
      })
  );
});
