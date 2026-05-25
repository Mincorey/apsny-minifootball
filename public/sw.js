const CACHE_NAME = 'apsny-mfl-v5';

// ─── Install: skip waiting immediately ─────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/']))
  );
});

// ─── Activate: delete old caches, claim clients, then FOR