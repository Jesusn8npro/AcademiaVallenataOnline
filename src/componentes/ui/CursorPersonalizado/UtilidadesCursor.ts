/**
 * Utilidades para el cursor personalizado
 * Funciones auxiliares y detección de capacidades del dispositivo
 */

export class UtilidadesCursor {

    /**
     * Detecta si el dispositivo es táctil REAL (móvil/tablet)
     */
    static esDispositivoTactil(): boolean {
        if (typeof window === 'undefined') return false;

        // 1. User Agent
        const userAgent = navigator.userAgent.toLowerCase();
        const esDispositivoMovilReal = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

        // 2. Capacidades táctiles
        const tieneCapacidadTactil = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (navigator as any).msMaxTouchPoints > 0;

        // 3. Media queries
        const noTieneHover = window.matchMedia('(hover: none)').matches;
        const pointerGrueso = window.matchMedia('(pointer: coarse)').matches;

        // 4. Mouse disponible
        const tieneMouseDisponible = window.matchMedia('(any-hover: hover)').matches;

        // 5. Tipo de dispositivo por resolución y densidad
        const esPantallaMovilReal = window.innerWidth <= 768 && window.devicePixelRatio >= 2;

        const esMovilReal = esDispositivoMovilReal || // User agent confirma móvil
            (noTieneHover && pointerGrueso && !tieneMouseDisponible) || // Sin capacidades de hover Y sin mouse
            (tieneCapacidadTactil && esPantallaMovilReal && !tieneMouseDisponible); // Táctil + pantalla móvil + sin mouse

        if (tieneMouseDisponible) {
            return false;
        }

        return esMovilReal;
    }

    static obtenerPosicionRelativa(evento: MouseEvent, elemento: HTMLElement): { x: number; y: number } {
        const rect = elemento.getBoundingClientRect();
        return {
            x: evento.clientX - rect.left,
            y: evento.clientY - rect.top
        };
    }

    static calcularDistancia(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    static encontrarElementoInteractivoPadre(elemento: HTMLElement): HTMLElement | null {
        let elementoActual: HTMLElement | null = elemento;

        while (elementoActual && elementoActual !== document.body) {
            // Verificar si es un elemento interactivo
            if (
                elementoActual.tagName === 'BUTTON' ||
                elementoActual.tagName === 'A' ||
                (elementoActual.hasAttribute('role') && elementoActual.getAttribute('role') === 'button') ||
                elementoActual.classList.contains('boton') ||
                elementoActual.classList.contains('btn') ||
                elementoActual.classList.contains('enlace') ||
                elementoActual.classList.contains('clickeable') ||
                elementoActual.hasAttribute('tabindex') ||
                // Elementos específicos de la academia
                elementoActual.classList.contains('menu-item') ||
                elementoActual.classList.contains('leccion-item') ||
                elementoActual.classList.contains('modulo-header') ||
                elementoActual.classList.contains('tab-btn') ||
                elementoActual.classList.contains('tarjeta-curso') ||
                elementoActual.classList.contains('tarjeta-tutorial') ||
                elementoActual.classList.contains('cerrar-sidebar')
            ) {
                return elementoActual;
            }
            elementoActual = elementoActual.parentElement;
        }

        return null;
    }
}
