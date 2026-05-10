import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';

/**
 * Hook que conecta el boton "back" hardware de Android al historial de la app.
 * - Si hay historial: navigate(-1)
 * - Si no: cierra la app
 * No-op en web.
 */
export function useBackButtonNativo() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            navigate(-1);
          } else {
            App.exitApp();
          }
        });
        if (cancelled) {
          handle.remove();
        } else {
          listenerHandle = handle;
        }
      } catch {
        // plugin no disponible — ignorar
      }
    })();

    return () => {
      cancelled = true;
      listenerHandle?.remove();
    };
  }, [navigate]);
}
