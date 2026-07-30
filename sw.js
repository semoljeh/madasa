// TAMBAHKAN BARIS INI DI PALING ATAS
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'madasa-pwa-v7'; // Versi dinaikkan untuk memicu pembaruan
const urlsToCache = [
  './',
  './index.html',
  './style.css',      // Ditambahkan agar CSS tersimpan
  './script.js',      // Ditambahkan agar logika JS tersimpan
  './config.js',      // Ditambahkan agar URL database tersimpan
  // Halaman Rapor
  './rapor_tpq.html',
  './rapor_ibtidaiyah.html',
  './rapor_sanawiyah.html',
  // Portal Ortu & SPP (Wajib ditambahkan)
'./informasi/ortu.html',
'./informasi/ortu.css',
'./informasi/ortu.js',

'./administrasi/spp.html',
'./administrasi/spp.js',
  // Aset Gambar
  './asset/logo.png',
  './asset/logo-192.png',
  './asset/logo-512.png'
];

// 1. Install Service Worker dan simpan file ke cache
self.addEventListener('install', event => {
  self.skipWaiting(); // Memaksa service worker baru langsung aktif
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Logika Fetch dengan Stale-While-Revalidate & Pengecualian API
self.addEventListener('fetch', event => {
  // A. Pengecualian mutlak untuk API Database (Metode POST & Domain Google)
  if (event.request.method !== 'GET' || event.request.url.includes('google.com') || event.request.url.includes('googleusercontent.com')) {
    return; // Biarkan browser yang mengurusnya, JANGAN disimpan di cache PWA
  }

  // B. Strategi Stale-While-Revalidate untuk file statis lainnya
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
     return cache.match(event.request, { ignoreSearch: true }).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Abaikan error jika offline
        });
        return response || fetchPromise;
      });
    })
  );
});

// 3. Hapus cache lama jika ada update versi
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim()); // Mengambil alih kontrol halaman saat ini juga
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Hapus cache v3 dan sebelumnya
          }
        })
      );
    })
  );
});