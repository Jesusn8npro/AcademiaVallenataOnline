/**
 * SISTEMA DE SEGURIDAD DE CONSOLA - VERSIÓN FINAL ESTABLE Y PERMISIVA PARA ADMINS
 * 
 * Protege los datos en producción:
 * 1. Usa import.meta.env.DEV para detección 100% confiable en Vite (En Localhost NO hace nada).
 * 2. En producción, deshabilita logs y bloquea DevTools a los usuarios.
 * 3. Permite el uso completo de la consola a los administradores.
 * 4. Muestra un mensaje gigante anti-SelfXSS.
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
            'font-size: 80px', // Aumentado para máximo impacto
            'font-weight: bold',
            'text-shadow: 4px 4px 8px black',
            'padding: 20px',
            'font-family: system-ui, -apple-system, sans-serif'
        ].join(';');

        const estiloTexto = [
            'color: #1f2937',
            'font-size: 20px',
            'font-family: sans-serif',
            'padding: 10px',
            'line-height: 1.6',
        ].join(';');

        consoleOriginal.log('%c¡Detente!', estiloTitulo);
        consoleOriginal.log(
            '%cEsta función del navegador está pensada para desarrolladores. Si alguna persona te ha indicado que copiarlas y pegaras algo aquí para habilitar una función de la Academia o para "hackear" la cuenta de alguien, se trata de un fraude. Si lo haces, esta persona podrá acceder a tu cuenta.',
            estiloTexto
        );
        consoleOriginal.log(
            '%cPara obtener más información, consulta https://www.academiavallenataonline.com/seguridad',
            'color: blue; text-decoration: underline; font-size: 16px;'
        );
    } catch (e) {
        // Ignorar errores
    }
};

export const inicializarSeguridadConsola = () => {
    // @ts-ignore
    if (import.meta.env.DEV) return;
    if ((window as any).__permitirDevTools) return;

    // EN PRODUCCIÓN: Deshabilitar TODA la consola para no-admins
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
    Object.assign(console, consoleOriginal);

    if (mensajeIntervalId) {
        clearInterval(mensajeIntervalId);
        mensajeIntervalId = null;
    }
    if (devToolsIntervalId) {
        clearInterval(devToolsIntervalId);
        devToolsIntervalId = null;
    }
    consoleOriginal.clear();
    consoleOriginal.log('🔓 Consola Desbloqueada para Administrador');
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
        };

        if (!devToolsIntervalId) {
            devToolsIntervalId = setInterval(detectarDevTools, 500); // 500ms para no saturar
        }
    } catch (e) { }
};

export const useSeguridadConsola = () => {
    const { usuario, inicializado } = useUsuario();

    useEffect(() => {
        // @ts-ignore
        if (import.meta.env.DEV) return; // EN DESARROLLO NO HACE NADA

        // Lanzar advertencia inmediata para todos en producción
        inicializarSeguridadConsola();
        bloquearDevTools();

        // Si el usuario es administrador, restaurar la consola después
        if (inicializado && usuario?.rol === 'admin') {
            restaurarConsola();
        }
    }, [usuario, inicializado]);
};
