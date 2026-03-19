const CACHE_NAME = 'erp-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles/main.css',
  './js/app.js',
  './js/modules/dashboard.js',
  './js/modules/tickets.js',
  './js/modules/inventory.js',
  './js/modules/analysis.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Ignoramos errores si falta algun fetch en live server
        return cache.addAll(urlsToCache).catch(err => console.log('Caching failed', err));
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request);
      })
  );
});
