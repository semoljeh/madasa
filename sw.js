const CACHE_NAME = 'madasa-pwa-v5';
const urlsToCache = [
  './',
  './index.html',
  './rapor_tpq.html',
  './rapor_ibtidaiyah.html',
  './rapor_sanawiyah.html',
  './asset/logo.png',
  './asset/logo-192.png',
  './asset/logo-512.png'
];

// Install Service Worker dan simpan file ke cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Ambil file dari cache jika tidak ada internet / agar lebih cepat
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; 
        }
        return fetch(event.request);
      }
    )
  );
});

// Hapus cache lama jika ada update
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
