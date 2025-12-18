/**
 * SISTEMA DE SEGURIDAD DE CONSOLA
 * 
 * Este archivo implementa protección completa para producción:
 * 1. Deshabilita TODOS los console.log/warn/error en producción
 * 2. Solo muestra el mensaje "DETENTE" en producción
 * 3. Permite logs normales SOLO en localhost
 * 4. Bloquea DevTools (F12) en producción
 */

// Detectar si estamos en localhost
const esLocalhost = (): boolean => {
    return (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('.local') ||
        window.location.hostname === ''
    );
};

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
        // Limpiar consola
        consoleOriginal.clear();

        // Estilos para el título
        const estiloTitulo = [
            'color: #ef4444',
            'font-size: 50px',
            'font-weight: bold',
            'text-shadow: 2px 2px 4px black',
            'padding: 20px',
        ].join(';');

        // Estilos para el texto
        const estiloTexto = [
            'color: #1f2937',
            'font-size: 18px',
            'font-family: sans-serif',
            'padding: 10px',
            'line-height: 1.6',
        ].join(';');

        // Mostrar mensaje usando console original
        consoleOriginal.log('%c¡Detente!', estiloTitulo);
        consoleOriginal.log(
            '%cEsta función del navegador está pensada para desarrolladores. Si alguien te ha indicado que copies y pegues algo aquí para habilitar una función o para "hackear" la cuenta de alguien, se trata de un fraude. Si lo haces, esa persona podrá acceder a tu cuenta.',
            estiloTexto
        );
    } catch (e) {
        // Ignorar errores
    }
};

/**
 * Función vacía para reemplazar console en producción
 */
const funcionVacia = () => { };

/**
 * Inicializar protección de consola
 */
export const inicializarSeguridadConsola = () => {
    const esLocal = esLocalhost();

    if (esLocal) {
        // En localhost: permitir todos los logs normalmente
        console.log('🔓 Modo desarrollo: Logs habilitados');
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

    // Mostrar SOLO el mensaje DETENTE
    mostrarMensajeDetente();

    // Volver a mostrar el mensaje cada 2 segundos (por si alguien limpia la consola)
    setInterval(mostrarMensajeDetente, 2000);
};

/**
 * Bloquear DevTools en producción
 */
export const bloquearDevTools = () => {
    const esLocal = esLocalhost();

    if (esLocal) {
        // En localhost: no bloquear DevTools
        return;
    }

    // EN PRODUCCIÓN: Bloquear DevTools

    // Bloquear click derecho
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // Bloquear teclas de DevTools
    document.addEventListener('keydown', (e) => {
        // F12
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+I (Inspector)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+C (Inspector de elementos)
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
            return false;
        }

        // Ctrl+U (Ver código fuente)
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
            e.preventDefault();
            return false;
        }

        // Cmd+Option+I (Mac)
        if (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i')) {
            e.preventDefault();
            return false;
        }

        // Cmd+Option+J (Mac)
        if (e.metaKey && e.altKey && (e.key === 'J' || e.key === 'j')) {
            e.preventDefault();
            return false;
        }

        // Cmd+Option+C (Mac)
        if (e.metaKey && e.altKey && (e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
            return false;
        }
    });

    // Detectar si DevTools está abierto y redirigir
    const detectarDevTools = () => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        if (widthThreshold || heightThreshold) {
            // DevTools detectado - limpiar consola constantemente
            consoleOriginal.clear();
            mostrarMensajeDetente();
        }
    };

    // Verificar cada segundo
    setInterval(detectarDevTools, 1000);
};

/**
 * Hook de React para usar la seguridad
 */
import { useEffect } from 'react';

export const useSeguridadConsola = () => {
    useEffect(() => {
        inicializarSeguridadConsola();
        bloquearDevTools();
    }, []);
};
