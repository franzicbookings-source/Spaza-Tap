const CACHE_NAME = "spaza-tap-cache-v4";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/spaza-tap-logo.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        STATIC_ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`Failed to cache PWA asset: ${asset}`, err);
          });
        })
      );
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
