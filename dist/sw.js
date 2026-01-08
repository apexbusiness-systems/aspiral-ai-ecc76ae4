// Service Worker v5 - Versioned cache discipline
const SW_VERSION = '5';
const CACHE_NAME = `app-v${SW_VERSION}`;
const STATIC_CACHE = `tradeline247-static-v${SW_VERSION}`;
const API_CACHE = `tradeline247-api-v${SW_VERSION}`;

// Cache configuration for production
const CACHE_CONFIG = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for static assets
  maxEntries: 100, // Limit cache size
  networkTimeout: 5000 // 5 seconds network timeout
};

self.addEventListener("install", (event) => {
  console.log(`[SW ${SW_VERSION}] Installing...`);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => 
      cache.addAll(['/', '/index.html'])
    ).then(() => {
      console.log(`[SW ${SW_VERSION}] Pre-cached core assets`);
      self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log(`[SW ${SW_VERSION}] Activating...`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const oldCaches = cacheNames.filter((cacheName) => 
        !cacheName.includes(`v${SW_VERSION}`) &&
        (cacheName.startsWith('tradeline247') || cacheName.startsWith('app-'))
      );
      console.log(`[SW ${SW_VERSION}] Deleting ${oldCaches.length} old caches`);
      return Promise.all(
        oldCaches.map((cacheName) => {
          console.log(`[SW ${SW_VERSION}] Deleting: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log(`[SW ${SW_VERSION}] Cache cleanup complete, claiming clients`);
      return self.clients.claim();
    }).then(() => {
      console.log(`[SW ${SW_VERSION}] CACHE_VERSION=${SW_VERSION}, clients claimed`);
      // Notify clients that update is available
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION });
        });
      });
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests, chrome extensions, and auth callbacks
  if (
    request.method !== 'GET' ||
    url.protocol === 'chrome-extension:' ||
    url.pathname.includes('/auth/callback')
  ) {
    return;
  }

  // SECURITY: Explicitly bypass caching for sensitive routes
  const sensitiveRoutes = [
    '/rest/v1/',
    '/auth/v1/',
    '/functions/v1/',
    '/api/',
    '/admin/',
    '/dashboard/',
    '/settings/',
    '/profile/',
    '/account/',
    '/billing/',
    '/workspace/',
    '/team/',
    '/organization/'
  ];

  const isSensitiveRoute = sensitiveRoutes.some(route =>
    url.pathname.includes(route)
  );

  if (isSensitiveRoute) {
    // Network-only for sensitive routes - never cache
    return;
  }

  // Static assets strategy: Cache-first with fallback
  if (
    url.pathname.match(/\.(js|css|woff2|png|jpg|jpeg|svg|ico|webp)$/) &&
    !url.pathname.includes('/functions/')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          // Validate cache age
          const cacheTime = cached.headers.get('sw-cache-time');
          if (cacheTime && Date.now() - parseInt(cacheTime) < CACHE_CONFIG.maxAge) {
            return cached;
          }
        }
        ]).catch(() => cached || new Response('Offline', { status: 503 }));
