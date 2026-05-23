self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('abkhazia-mfl-cache-v1').then((cache) => {
      return cache.addAll(['/', '/index.html', '/src/index.css', '/src/main.tsx', '/src/App.tsx']);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
