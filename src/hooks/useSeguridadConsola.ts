/**
 * SISTEMA DE SEGURIDAD DE CONSOLA - VERSIÓN FINAL ESTABLE Y PERMISIVA PARA ADMINS
 * 
 * Este sistema protege los datos en producción:
 * 1. USA import.meta.env.DEV para una detección 100% confiable en Vite.
 * 2. En desarrollo (localhost), el sistema se auto-deshabilita TOTALMENTE.
 * 3. En producción, deshabilita logs y bloquea DevTools a los usuarios.
 * 4. ¡NUEVO! Permite el uso completo de la consola a los administradores.
 */
import { useEffect } from 'react';
import { useUsuario } from '../contextos/UsuarioContext';

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

const funcionVacia = () => { };

// Variables globales para control de intervalos e interrupciones
let mensajeIntervalId: any = null;
let devToolsIntervalId: any = null;

const mostrarMensajeDetente = () => {
    // Si la consola debe estar permitida globalmente, evitamos los mensajes
    if ((window as any).__permitirDevTools) return;

    try {
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

export const inicializarSeguridadConsola = () => {
    // @ts-ignore
    if (import.meta.env.DEV) return;

    // Si ya somos admin o sabemos que tenemos acceso
    if ((window as any).__permitirDevTools) return;

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
    if (!mensajeIntervalId) {
        mensajeIntervalId = setInterval(mostrarMensajeDetente, 5000);
    }
};

export const restaurarConsola = () => {
    (window as any).__permitirDevTools = true;

    // Restaurar metodos originales
    Object.assign(console, consoleOriginal);

    // Limpiar intervalos si existen
    if (mensajeIntervalId) {
        clearInterval(mensajeIntervalId);
        mensajeIntervalId = null;
    }
    if (devToolsIntervalId) {
        clearInterval(devToolsIntervalId);
        devToolsIntervalId = null;
    }
};

const contextMenuHandler = (e: any) => {
    if ((window as any).__permitirDevTools) return;
    e.preventDefault();
    return false;
};

const keyDownHandler = (e: any) => {
    if ((window as any).__permitirDevTools) return;

    const isInspector = (e.key === 'F12') ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U') ||
        (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()));

    if (isInspector) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
};

const antiHackerLoop = () => {
    if ((window as any).__permitirDevTools) return;
    try {
        // Ejecuta un debugger infinito que congela la ventana de herramientas
        // de desarrollo si está abierta, dificultando investigar el código.
        (function () { return false; }['constructor']('debugger')());
    } catch (err) { }
};

export const bloquearDevTools = () => {
    // @ts-ignore
    if (import.meta.env.DEV) return;
    if ((window as any).__permitirDevTools) return;

    try {
        if (!(window as any).__seguridadListenersConfigurados) {
            document.addEventListener('contextmenu', contextMenuHandler, { capture: true });
            document.addEventListener('keydown', keyDownHandler, { capture: true });
            (window as any).__seguridadListenersConfigurados = true;
        }

        const detectarDevTools = () => {
            if ((window as any).__permitirDevTools) return;
            const threshold = 160;
            if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
                try {
                    consoleOriginal.clear();
                    mostrarMensajeDetente();
                } catch (e) { }
            }

            antiHackerLoop();
        };

        if (!devToolsIntervalId) {
            devToolsIntervalId = setInterval(detectarDevTools, 50);
        }
    } catch (e) { }
};

export const useSeguridadConsola = () => {
    const { usuario, inicializado } = useUsuario();

    useEffect(() => {
        // @ts-ignore
        if (import.meta.env.DEV) return;

        // Si todavía estamos cargando el usuario, no bloqueamos la consola aún,
        // esperamos hasta estar seguros.
        if (!inicializado) return;

        // Si el usuario es administrador, restaurar (o mantener) la consola normal
        if (usuario?.rol === 'admin') {
            restaurarConsola();
            console.log('🔓 Seguridad Consola: Acceso Administrador Activado. Tienes permiso.');
            return;
        }

        // Si no es administrador, o no está logueado, bloquear todo
        (window as any).__permitirDevTools = false;
        const timeoutId = setTimeout(() => {
            inicializarSeguridadConsola();
            bloquearDevTools();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [usuario, inicializado]);
};

