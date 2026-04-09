/**
 * Service Worker — Client-side fallback for offline/backend-down scenarios.
 *
 * Caches the question bank JSON and scoring-related config so the app
 * can compute scores entirely client-side even when the network is unavailable.
 *
 * Strategy: Cache-first for config JSON, network-first for API routes.
 */

const CACHE_NAME = 'voter-matcher-v1';

const PRECACHE_URLS = [
  '/config/questions.json',
  '/config/scoring-params.json',
  '/config/party-registry.json',
  '/config/axis-registry.json',
  '/config/archetype-registry.json',
  '/config/language-registry.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache-first for config JSON files
  if (url.pathname.startsWith('/config/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for scoring API fallback
  if (url.pathname === '/api/score') {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: 'offline', message: 'Use client-side scoring' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }
});
