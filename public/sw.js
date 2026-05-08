// 🚀 Service Worker - Academia Vallenata Online PWA
// Bump de versión: cuando se cambia el sufijo, en `activate` se borran TODAS las caches
// con otro nombre → se obliga a usuarios a refetchear assets nuevos. Subir versión
// cada vez que un fix crítico necesita llegar urgente al usuario (p.ej. fix de pagos).
const CACHE_NAME = 'academia-vallenata-v3-reverb-22-presets';
const OFFLINE_PAGE = '/offline.html';

// URLs a cachear durante la instalación
const URLS_TO_CACHE = [
  '/',
  '/cursos',
  '/comunidad',
  '/simulador-gaming',
  '/manifest.json',
  '/favicon.png',
  // CSS y JS se cachan automáticamente por SvelteKit
];

// 📦 Instalación del service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache abierto para Academia Vallenata
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 🔄 Activación del service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            // Eliminando cache antiguo
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 🌐 Interceptar requests (estrategia cache-first para assets, network-first para páginas)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar requests del mismo origen
  if (url.origin !== location.origin) return;

  // Estrategia para diferentes tipos de recursos
  if (request.destination === 'document') {
    // Páginas: Network-first, fallback a cache
    event.respondWith(networkFirstStrategy(request));
  } else if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'audio' ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.wav')
  ) {
    // Imágenes, fuentes y SONIDOS: Cache-first
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Otros recursos: Network-first
    event.respondWith(networkFirstStrategy(request));
  }
});

// 🌐 Estrategia Network-first
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // Solo cachear responses exitosas
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Red no disponible, usando cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Si es una página y no hay cache, mostrar página offline
    if (request.destination === 'document') {
      return caches.match(OFFLINE_PAGE);
    }

    throw error;
  }
}

// 💾 Estrategia Cache-first  
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Error al cargar recurso
    throw error;
  }
}

// 🔔 Manejo de notificaciones push (futuro)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: data.data,
      tag: 'academia-vallenata'
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 📱 Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.openWindow(url)
  );
}); 