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
