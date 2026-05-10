import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import './idiomas/configuracionIdiomas'; // Importar configuración de idiomas
import App from './App.tsx'

// Service worker (vite-plugin-pwa) — solo en web. En Capacitor el plugin
// esta deshabilitado en build, asi que evitamos importar el modulo virtual.
if (!Capacitor.isNativePlatform()) {
  import('./registerSW');
}

// ⚠️ NOTA: La seguridad se inicializa en App.tsx DESPUÉS del montaje
// para evitar conflictos con React DOM

// Inicializacion de plataforma nativa (Capacitor) — no-op en web
async function initNativePlatform() {
  if (!Capacitor.isNativePlatform()) return;

  // Marca el body para activar safe-areas via CSS
  document.body.classList.add('es-nativo');

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1f2937' });
  } catch {
    // plugin no disponible — ignorar
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    // plugin no disponible — ignorar
  }
}

initNativePlatform();

createRoot(document.getElementById('root')!).render(
  <App />
)
