import { useEffect } from 'react';

/**
 * Fullscreen en Android: requestFullscreen requiere user activation valida.
 * Lo disparamos en touchend/mouseup (no en pointerdown) porque el
 * preventDefault que aplicamos en touchstart consume la activation y Chrome
 * Android rechaza requestFullscreen llamado desde pointerdown. touchend no
 * tiene preventDefault y el browser aun considera el gesto valido.
 *
 * iOS no soporta fullscreen para sitios; lo skippeamos. PWA standalone ya
 * esta en fullscreen nativo, idem.
 *
 * IMPORTANTE: persistente, no one-shot. El primer touchend puede no ser un
 * "user activation" válido (ej. el browser no lo considera deliberate, o el
 * usuario salió de fullscreen manualmente con un swipe-down). Reintentamos
 * en cada touchend hasta lograrlo. Cuando ya estamos en fullscreen el chequeo
 * `yaEnFullscreen` corta temprano y el cost es ~0.
 */
export const useFullscreenAndroid = () => {
    useEffect(() => {
        const esMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
        if (!esMobile) return;

        const esAndroid = /android/i.test(navigator.userAgent);
        if (!esAndroid) return; // iOS no soporta fullscreen para sitios.

        let intentos = 0;
        const MAX_INTENTOS = 20; // ~20 toques: si el usuario sale a proposito de fullscreen, dejamos de molestar.

        const intentarFullscreen = () => {
            if (intentos >= MAX_INTENTOS) return;
            const noEsPWA = !window.matchMedia('(display-mode: standalone)').matches;
            const yaEnFullscreen = !!document.fullscreenElement;
            if (!noEsPWA || yaEnFullscreen) return;
            intentos++;
            document.documentElement.requestFullscreen?.().catch(() => { /* fallback silencioso */ });
        };

        // Reset contador si el usuario YA esta en fullscreen y luego sale -> intentamos de nuevo.
        const onFullscreenChange = () => {
            if (!document.fullscreenElement) intentos = 0;
        };

        document.addEventListener('touchend', intentarFullscreen, { passive: true });
        document.addEventListener('mouseup', intentarFullscreen, { passive: true });
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => {
            document.removeEventListener('touchend', intentarFullscreen);
            document.removeEventListener('mouseup', intentarFullscreen);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
        };
    }, []);
};
