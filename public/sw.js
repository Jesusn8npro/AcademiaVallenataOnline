// Academia Vallenata Online — Service Worker
// La versión de caché se actualiza automáticamente en cada `npm run build`
const CACHE = 'ava-qjDOfdnYSKa6nknlljat_';

const PRECACHE = [
  '/logo-175.webp',
  '/iconos-pwa/icon-192x192.svg',
  '/iconos-pwa/icon-512x512.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // En desarrollo no cachear nada: hot reload cambia chunks sin cambiar nombres de archivo,
  // lo que causaría que el SW sirva JS viejo → hydration mismatch → removeChild errors.
  const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
  if (isDev) return;

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
            return res;
          })
      )
    );
    return;
  }

  if (/\.(webp|png|jpg|jpeg|svg|ico|woff2?|mp3|gif)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((res) => {
              if (res.ok) {
                const clone = res.clone();
                caches.open(CACHE).then((c) => c.put(request, clone));
              }
              return res;
            })
            .catch(() => cached || new Response('', { status: 404 }))
      )
    );
  }
});
