// Academia Vallenata Online — Service Worker
// La versión de caché se actualiza automáticamente en cada `npm run build`
const CACHE = 'ava--D3uH-ef3pgRQ3hbS3r5i';

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
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // En desarrollo no cachear nada: hot reload cambia chunks sin cambiar nombres de archivo,
  // lo que causaría que el SW sirva JS viejo → hydration mismatch → removeChild errors.
  const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
  if (isDev) return;

  if (request.method !== 'GET') return;

  // DOCUMENTO HTML (navegaciones): SIEMPRE network-first, ignorando la caché del navegador
  // (cache: 'reload'). Esto cura el bug del PWA instalado: el navegador guardaba el HTML de un
  // build viejo, que pedía chunks JS ya borrados del servidor tras el siguiente deploy → 404 →
  // el import() del Simulador (u otra ruta lazy) nunca resolvía → "carga infinita". Ahora el HTML
  // siempre llega fresco y referencia los chunks del build actual. Si no hay red, cae a una copia
  // cacheada del documento (o a '/') para mantener algo de soporte offline.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request, { cache: 'reload' })
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match('/')))
    );
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Chunks/estáticos de Next (nombre con hash → contenido inmutable): cache-first es seguro y
  // rápido. Añadimos .catch para que un fallo de red NO rechace el respondWith (evita disparar
  // un ChunkLoadError espurio cuando hay caché que sí sirve).
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request)
          .then((res) => {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
            return res;
          })
          .catch(() => cached)
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
