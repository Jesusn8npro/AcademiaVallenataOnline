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
 */
export const useFullscreenAndroid = () => {
    useEffect(() => {
        const esMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
        if (!esMobile) return;

        const intentarFullscreen = () => {
            const noEsPWA = !window.matchMedia('(display-mode: standalone)').matches;
            const yaEnFullscreen = !!document.fullscreenElement;
            const esAndroid = /android/i.test(navigator.userAgent);
            if (esAndroid && noEsPWA && !yaEnFullscreen) {
                document.documentElement.requestFullscreen?.().catch(() => { /* fallback silencioso */ });
            }
            document.removeEventListener('touchend', intentarFullscreen);
            document.removeEventListener('mouseup', intentarFullscreen);
        };

        document.addEventListener('touchend', intentarFullscreen);
        document.addEventListener('mouseup', intentarFullscreen);
        return () => {
            document.removeEventListener('touchend', intentarFullscreen);
            document.removeEventListener('mouseup', intentarFullscreen);
        };
    }, []);
};
