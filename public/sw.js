// SERVICE WORKER AUTODESTRUCTIVO
// -------------------------------------------------------------------------
// Reemplaza al SW viejo de vite-plugin-pwa (Workbox) que quedó registrado en
// los navegadores de la versión Vite. El navegador re-descarga /sw.js al
// navegar; al detectar este (distinto byte a byte) lo instala, borra TODAS
// las caches, se desregistra a sí mismo y recarga las pestañas abiertas.
// Resultado: la PWA vieja desaparece y se sirve la app Next limpia.
// (Receta oficial "self-destroying service worker".)

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    (async function () {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(function (k) { return caches.delete(k); }));
      } catch (e) { /* noop */ }

      try {
        await self.registration.unregister();
      } catch (e) { /* noop */ }

      try {
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(function (client) {
          client.navigate(client.url);
        });
      } catch (e) { /* noop */ }
    })()
  );
});
