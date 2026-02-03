/**
 * SISTEMA DE SEGURIDAD DE CONSOLA - VERSIÓN FINAL ESTABLE
 * 
 * Este sistema protege los datos en producción:
 * 1. USA import.meta.env.DEV para una detección 100% confiable en Vite.
 * 2. En desarrollo (localhost), el sistema se auto-deshabilita TOTALMENTE.
 * 3. En producción, deshabilita logs y bloquea DevTools.
 */

// Guardar referencias originales de console
const consoleOriginal = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
    table: console.table,
    dir: console.dir,
    dirxml: console.dirxml,
    trace: console.trace,
    group: console.group,
    groupCollapsed: console.groupCollapsed,
    groupEnd: console.groupEnd,
    clear: console.clear
};

/**
 * Función para mostrar SOLO el mensaje de seguridad DETENTE
 */
const mostrarMensajeDetente = () => {
    try {
        // En producción, limpiar consola puede ser útil, pero lo hacemos con cuidado
        if (typeof consoleOriginal.clear === 'function') {
            consoleOriginal.clear();
        }

        const estiloTitulo = [
            'color: #ef4444',
            'font-size: 50px',
            'font-weight: bold',
            'text-shadow: 2px 2px 4px black',
            'padding: 20px',
        ].join(';');

        const estiloTexto = [
            'color: #1f2937',
            'font-size: 18px',
            'font-family: sans-serif',
            'padding: 10px',
            'line-height: 1.6',
        ].join(';');

        consoleOriginal.log('%c¡Detente!', estiloTitulo);
        consoleOriginal.log(
            '%cEsta función del navegador está pensada para desarrolladores. Si alguien te ha indicado que copies y pegues algo aquí para habilitar una función o para "hackear" la cuenta de alguien, se trata de un fraude. Si lo haces, esa persona podrá acceder a tu cuenta.',
            estiloTexto
        );
    } catch (e) {
        // Ignorar errores
    }
};

const funcionVacia = () => { };

/**
 * Inicializar protección de consola
 */
export const inicializarSeguridadConsola = () => {
    // 🛡️ Detección nativa de Vite para desarrollo
    // @ts-ignore
    if (import.meta.env.DEV) {
        console.log('🔓 Seguridad: Modo desarrollo detectado (Logs habilitados)');
        return;
    }

    // EN PRODUCCIÓN: Deshabilitar TODA la consola
    console.log = funcionVacia;
    console.warn = funcionVacia;
    console.error = funcionVacia;
    console.info = funcionVacia;
    console.debug = funcionVacia;
    console.table = funcionVacia;
    console.dir = funcionVacia;
    console.dirxml = funcionVacia;
    console.trace = funcionVacia;
    console.group = funcionVacia;
    console.groupCollapsed = funcionVacia;
    console.groupEnd = funcionVacia;

    mostrarMensajeDetente();
    setInterval(mostrarMensajeDetente, 5000); // 5 seg en lugar de 2 para menos carga
};

/**
 * Bloquear DevTools en producción
 */
export const bloquearDevTools = () => {
    // @ts-ignore
    if (import.meta.env.DEV) return;

    try {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        }, { capture: true });

        document.addEventListener('keydown', (e) => {
            // F12, Ctrl+Shift+I/J/C, Ctrl+U
            const isInspector = (e.key === 'F12') ||
                (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
                (e.ctrlKey && e.key.toUpperCase() === 'U') ||
                (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()));

            if (isInspector) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, { capture: true });

        const detectarDevTools = () => {
            const threshold = 160;
            if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
                try {
                    consoleOriginal.clear();
                    mostrarMensajeDetente();
                } catch (e) { }
            }
        };
        setInterval(detectarDevTools, 2000);
    } catch (e) { }
};

/**
 * Hook de React para usar la seguridad
 */
import { useEffect } from 'react';

export const useSeguridadConsola = () => {
    useEffect(() => {
        // @ts-ignore
        if (import.meta.env.DEV) return;

        const timeoutId = setTimeout(() => {
            inicializarSeguridadConsola();
            bloquearDevTools();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, []);
};
