import { createRoot } from 'react-dom/client'
import './index.css'
import './idiomas/configuracionIdiomas'; // Importar configuración de idiomas
import App from './App.tsx'

// Detectar plataforma sin importar @capacitor/core (que pesaria 7KB en el
// critical path web aunque siempre returna false). Capacitor inyecta
// `window.Capacitor` antes que el JS app cargue, asi que basta con leerlo.
const esNativo = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

// Service worker solo en web. Dynamic import para que NO entre al chunk principal.
if (!esNativo) {
  import('./registerSW');
}

// Inicializacion de plataforma nativa (no-op en web). Todo el stack
// @capacitor/* se carga con dynamic import = cero coste en web.
if (esNativo) {
  (async () => {
    document.body.classList.add('es-nativo');
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1f2937' });
    } catch { /* plugin no disponible */ }
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
    } catch { /* plugin no disponible */ }
  })();
}

createRoot(document.getElementById('root')!).render(
  <App />
)
