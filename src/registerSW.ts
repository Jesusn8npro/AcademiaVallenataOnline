// Registro del service worker generado por vite-plugin-pwa (Workbox).
// Modo `prompt`: cuando hay nueva version, preguntamos al usuario si recargar.
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nueva version disponible. ¿Recargar ahora?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    // App lista para uso offline (SW activo y precache poblado)
  },
  onRegisterError(error) {
    console.warn('[PWA] Error registrando service worker:', error);
  }
});
