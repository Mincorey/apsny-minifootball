// ─── Cache name — bump this string after each deploy ───────────────────────
const CACHE_NAME = 'apsny-mfl-v3';

// ─── Install: skip waiting, cache only the shell ───────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting(); // activate immediately, don't wait for old ta