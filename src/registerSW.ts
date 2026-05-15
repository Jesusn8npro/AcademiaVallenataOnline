// Registro del service worker generado por vite-plugin-pwa (Workbox).
// Modo `autoUpdate`: la nueva version se aplica silenciosamente al recargar,
// sin confirm() al usuario.
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onRegisterError(error) {
    console.warn('[PWA] Error registrando service worker:', error);
  }
});

// Cuando el nuevo SW toma control (después de skipWaiting + clients.claim),
// recargamos la página para que el nuevo bundle se aplique. Sin esto los
// alumnos ven pantalla blanca y necesitan Ctrl+Shift+R tras cada deploy.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
