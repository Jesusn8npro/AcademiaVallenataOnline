import { useCallback, useEffect, useRef } from 'react';
import { MotionValue } from 'framer-motion';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';

interface PointerLogicProps {
    x: MotionValue<number>;
    logica: any;
    actualizarVisualBoton: (pos: string, activo: boolean, esBajo: boolean) => void;
    registrarEvento: (tipo: 'nota_on' | 'nota_off' | 'fuelle', data: any) => void;
    trenRef: React.RefObject<HTMLDivElement>;
    desactivarAudio?: boolean;
}

// Hit-test estilo app nativa. iOS Safari implicit pointer capture bug
// (WebKit #199803) entrega pointermove throttled cuando el dedo sale del target
// inicial — por eso usamos Touch Events en tactil (clientX/Y siempre fiable) y
// Pointer Events solo para mouse en desktop.
const IMAN_ENTRAR = 16;
const IMAN_SALIR = 22;

export const usePointerAcordeon = ({
    x, logica, actualizarVisualBoton, registrarEvento, trenRef, desactivarAudio = false
}: PointerLogicProps) => {
    const pointersMap = useRef<Map<number, { pos: string; musicalId: string; ts: number }>>(new Map());
    const rectsCache = useRef<Map<string, { left: number; right: number; top: number; bottom: number }>>(new Map());

    const logicaRef = useRef(logica);
    useEffect(() => { logicaRef.current = logica; }, [logica]);

    const desactivarAudioRef = useRef(desactivarAudio);
    useEffect(() => { desactivarAudioRef.current = desactivarAudio; }, [desactivarAudio]);

    const actualizarGeometria = useCallback(() => {
        const tren = trenRef.current;
        if (!tren) return;
        const elPitos = tren.querySelectorAll('.pito-boton');
        rectsCache.current.clear();
        elPitos.forEach(el => {
            const pos = (el as HTMLElement).dataset.pos;
            if (!pos) return;
            const r = el.getBoundingClientRect();
            rectsCache.current.set(pos, { left: r.left, right: r.right, top: r.top, bottom: r.bottom });
        });
    }, [trenRef]);

    useEffect(() => {
        const tren = trenRef.current;
        if (!tren) return;

        const forzarRecalculo = () => actualizarGeometria();
        window.addEventListener('resize', forzarRecalculo);
        window.addEventListener('orientationchange', forzarRecalculo);
        requestAnimationFrame(actualizarGeometria);

        const dentroDe = (cx: number, cy: number, r: { left: number; right: number; top: number; bottom: number }, iman: number) =>
            cx >= r.left - iman && cx <= r.right + iman && cy >= r.top - iman && cy <= r.bottom + iman;

        const encontrarPosEnPunto = (clientX: number, clientY: number, posActual?: string | null): string | null => {
            // Fast-path Android low-end: elementFromPoint cuesta 5-10ms; si el dedo
            // sigue dentro del rect del pito actual, retornar sin hit-test nativo.
            if (posActual) {
                const rActual = rectsCache.current.get(posActual);
                if (rActual && dentroDe(clientX, clientY, rActual, 0)) return posActual;
            }
            const target = document.elementFromPoint(clientX, clientY);
            if (target) {
                const pito = (target as HTMLElement).closest('.pito-boton[data-pos]') as HTMLElement | null;
                if (pito?.dataset.pos) return pito.dataset.pos;
            }
            // Histeresis: aun dentro del rect expandido del pito anterior.
            if (posActual) {
                const rActual = rectsCache.current.get(posActual);
                if (rActual && dentroDe(clientX, clientY, rActual, IMAN_SALIR)) return posActual;
            }
            // Iman al pito mas cercano si caimos en gap.
            for (const [pos, r] of rectsCache.current.entries()) {
                if (dentroDe(clientX, clientY, r, IMAN_ENTRAR)) return pos;
            }
            return null;
        };

        // Procesa una posición individual del dedo (extraído para reusar entre touch/move/coalesced).
        const procesarPunto = (id: number, clientX: number, clientY: number, ts: number) => {
            const data = pointersMap.current.get(id);
            if (!data) return;
            const pos = encontrarPosEnPunto(clientX, clientY, data.pos || null);
            if (pos !== data.pos) {
                if (data.pos) {
                    logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, false);
                    actualizarVisualBoton(data.pos, false, false);
                    registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                }
                if (pos) {
                    const newMId = `${pos}-${logicaRef.current.direccion}`;
                    data.pos = pos;
                    data.musicalId = newMId;
                    data.ts = ts;
                    logicaRef.current.actualizarBotonActivo(newMId, 'add', null, false);
                    actualizarVisualBoton(pos, true, false);
                    registrarEvento('nota_on', { id: newMId, pos });
                } else {
                    data.pos = '';
                    data.musicalId = '';
                    data.ts = ts;
                }
            } else {
                data.ts = ts;
            }
        };

        const registrarInicio = (id: number, target: HTMLElement, clientX: number, clientY: number, ts: number) => {
            if (target.closest('.indicador-fuelle') || target.closest('.barra-herramientas-contenedor')) return;
            actualizarGeometria();
            const pos = encontrarPosEnPunto(clientX, clientY);
            const esToqueFuelle = !!target.closest('.seccion-bajos-contenedor');
            const esAreaJuego = !!(target.closest('.pito-boton') || esToqueFuelle || target.closest('.diapason-marco'));

            if (pos) {
                logicaRef.current.setFuelleVirtual?.(true);
                const mId = `${pos}-${logicaRef.current.direccion}`;
                pointersMap.current.set(id, { pos, musicalId: mId, ts });
                logicaRef.current.actualizarBotonActivo(mId, 'add', null, false);
                actualizarVisualBoton(pos, true, false);
                registrarEvento('nota_on', { id: mId, pos });
            } else if (esAreaJuego) {
                pointersMap.current.set(id, { pos: '', musicalId: '', ts });
            }
        };

        const registrarFin = (id: number) => {
            const data = pointersMap.current.get(id);
            if (data?.pos) {
                logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, false);
                actualizarVisualBoton(data.pos, false, false);
                registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
            }
            pointersMap.current.delete(id);
            if (pointersMap.current.size === 0) {
                logicaRef.current.setFuelleVirtual?.(false);
            }
        };

        const enAreaJuego = (target: HTMLElement) =>
            !!(target.closest('.pito-boton') || target.closest('.seccion-bajos-contenedor') || target.closest('.diapason-marco'));

        // ============== TOUCH EVENTS (movil) ==============
        // Iterar por TOUCH, no por evento: Chrome Android coalesce varios touchstart
        // en un solo evento cuando ocurren en el mismo tick (dedo en fuelle + dedos
        // en pitos). e.target es solo del primer toque; filtrar por e.target descarta
        // el evento entero. Iteramos cada changedTouch para no perder pitos cuando
        // hay un dedo en zona no-jugable simultaneamente.
        const handleTouchStart = (e: TouchEvent) => {
            if (desactivarAudioRef.current) return;
            let huboRegistro = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const tTarget = t.target as HTMLElement;
                if (!enAreaJuego(tTarget)) continue;
                if (!huboRegistro) {
                    motorAudioPro.activarContexto();
                    huboRegistro = true;
                }
                registrarInicio(t.identifier, tTarget, t.clientX, t.clientY, e.timeStamp);
            }
            if (huboRegistro && e.cancelable) e.preventDefault();
        };

        // touchmove: procesar solo touches registrados en pointersMap. Permite que
        // los movimientos de pitos se procesen aun con dedo en zona no-jugable.
        const handleTouchMove = (e: TouchEvent) => {
            let huboProceso = false;
            for (let i = 0; i < e.touches.length; i++) {
                const t = e.touches[i];
                if (!pointersMap.current.has(t.identifier)) continue;
                procesarPunto(t.identifier, t.clientX, t.clientY, e.timeStamp);
                huboProceso = true;
            }
            if (huboProceso && e.cancelable) e.preventDefault();
        };

        const handleTouchEnd = (e: TouchEvent) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                registrarFin(e.changedTouches[i].identifier);
            }
        };

        // ============== POINTER EVENTS (mouse desktop) ==============
        const handlePointerDown = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return; // En táctil usamos touch events.
            if (desactivarAudioRef.current) return;
            const target = e.target as HTMLElement;
            if (enAreaJuego(target) && e.cancelable) e.preventDefault();
            motorAudioPro.activarContexto();
            registrarInicio(e.pointerId, target, e.clientX, e.clientY, e.timeStamp);
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return;
            const data = pointersMap.current.get(e.pointerId);
            if (!data) return;
            const target = e.target as HTMLElement;
            if (enAreaJuego(target) && e.cancelable) e.preventDefault();
            procesarPunto(e.pointerId, e.clientX, e.clientY, e.timeStamp);
        };

        const handlePointerUp = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return;
            const target = e.target as HTMLElement;
            if (enAreaJuego(target) && e.cancelable) e.preventDefault();
            registrarFin(e.pointerId);
        };

        const esTouchDevice = 'ontouchstart' in window || (navigator as any).maxTouchPoints > 0;

        // Listeners en elemento del simulador, NO en document: en iOS los tactiles
        // a nivel document tienen mas throttling single-touch y tap-delay; sobre un
        // elemento con touch-action: none se entregan a 60Hz.
        const rootSimulador = (document.querySelector('.simulador-app-root') as HTMLElement | null) || document;

        // Estrategia opt-in: preventDefault SOLO sobre area jugable (no opt-out con
        // whitelist global, que se rompia cada vez que se anadia un modal nuevo).
        // .juego-sim-fuelle-zona incluida: sin un gesto sostenido en iOS, los
        // touchstarts cortos en pitos se entregan throttled — mantenerla como zona
        // jugable preserva la frecuencia de entrega sin requerir dedo permanente.
        const ZONAS_JUGABLES = '.pito-boton, .diapason-marco, .seccion-bajos-contenedor, .juego-sim-fuelle-zona';

        const esZonaJugable = (target: EventTarget | null): boolean => {
            const el = target as HTMLElement | null;
            if (!el || !el.closest) return false;
            return !!el.closest(ZONAS_JUGABLES);
        };

        const handleWindowTouchStart = (e: TouchEvent) => {
            if (!esZonaJugable(e.target)) return;
            if (e.cancelable) e.preventDefault();
        };

        const handleWindowTouchMove = (e: TouchEvent) => {
            if (!esZonaJugable(e.target)) return;
            if (e.cancelable) e.preventDefault();
        };

        if (esTouchDevice) {
            window.addEventListener('touchstart', handleWindowTouchStart, { passive: false, capture: true });
            window.addEventListener('touchmove', handleWindowTouchMove, { passive: false, capture: true });
            rootSimulador.addEventListener('touchstart', handleTouchStart as EventListener, { passive: false, capture: true });
            rootSimulador.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false, capture: true });
            rootSimulador.addEventListener('touchend', handleTouchEnd as EventListener, { passive: false, capture: true });
            rootSimulador.addEventListener('touchcancel', handleTouchEnd as EventListener, { passive: false, capture: true });
        } else {
            document.addEventListener('pointerdown', handlePointerDown, { capture: true });
            document.addEventListener('pointermove', handlePointerMove, { capture: true });
            document.addEventListener('pointerup', handlePointerUp, { capture: true });
            document.addEventListener('pointercancel', handlePointerUp, { capture: true });
        }

        // Watchdog: pointers zombi por touchcancel/pointercancel perdidos.
        const ZOMBIE_TTL_MS = 4000;
        const watchdogId = window.setInterval(() => {
            if (pointersMap.current.size === 0) return;
            const ahora = performance.now();
            const muertos: number[] = [];
            pointersMap.current.forEach((data, pId) => {
                if (ahora - data.ts > ZOMBIE_TTL_MS) muertos.push(pId);
            });
            muertos.forEach(pId => {
                const data = pointersMap.current.get(pId);
                if (data?.pos) {
                    logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, false);
                    actualizarVisualBoton(data.pos, false, false);
                }
                pointersMap.current.delete(pId);
            });
            if (pointersMap.current.size === 0) logicaRef.current.setFuelleVirtual?.(false);
        }, 1500);

        const limpiarTodo = () => {
            if (pointersMap.current.size === 0) return;
            pointersMap.current.forEach((data) => {
                if (data.pos) {
                    logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, false);
                    actualizarVisualBoton(data.pos, false, false);
                }
            });
            pointersMap.current.clear();
            logicaRef.current.setFuelleVirtual?.(false);
            logicaRef.current.limpiarTodasLasNotas?.();
        };
        const onVisibility = () => { if (document.visibilityState === 'hidden') limpiarTodo(); };
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('blur', limpiarTodo);

        return () => {
            window.removeEventListener('resize', forzarRecalculo);
            window.removeEventListener('orientationchange', forzarRecalculo);
            window.clearInterval(watchdogId);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('blur', limpiarTodo);

            if (esTouchDevice) {
                window.removeEventListener('touchstart', handleWindowTouchStart, { capture: true });
                window.removeEventListener('touchmove', handleWindowTouchMove, { capture: true });
                rootSimulador.removeEventListener('touchstart', handleTouchStart as EventListener, { capture: true });
                rootSimulador.removeEventListener('touchmove', handleTouchMove as EventListener, { capture: true });
                rootSimulador.removeEventListener('touchend', handleTouchEnd as EventListener, { capture: true });
                rootSimulador.removeEventListener('touchcancel', handleTouchEnd as EventListener, { capture: true });
            } else {
                document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
                document.removeEventListener('pointermove', handlePointerMove, { capture: true });
                document.removeEventListener('pointerup', handlePointerUp, { capture: true });
                document.removeEventListener('pointercancel', handlePointerUp, { capture: true });
            }
        };
    }, [x, actualizarVisualBoton, registrarEvento, trenRef, actualizarGeometria]);

    const limpiarGeometria = useCallback(() => {
        rectsCache.current.clear();
        requestAnimationFrame(actualizarGeometria);
    }, [actualizarGeometria]);

    return { pointersMap, limpiarGeometria, actualizarGeometria, manejarCambioFuelle: (nuevaDireccion: 'halar' | 'empujar', motorAudioPro: any) => {
        if (nuevaDireccion === logicaRef.current.direccion) return;
        motorAudioPro.activarContexto();
        logicaRef.current.ejecutarSwapDireccion(nuevaDireccion);
        const ahora = performance.now();
        pointersMap.current.forEach((data, pId) => {
            if (data.pos) {
                pointersMap.current.set(pId, { pos: data.pos, musicalId: `${data.pos}-${nuevaDireccion}`, ts: ahora });
            }
        });
    }};
};
