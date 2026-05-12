import { useCallback, useEffect, useRef, startTransition } from 'react';
import { MotionValue } from 'framer-motion';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';

interface PointerLogicProps {
    x: MotionValue<number>;
    logica: any;
    actualizarVisualBoton: (pos: string, activo: boolean, esBajo: boolean) => void;
    trenRef: React.RefObject<HTMLDivElement>;
    desactivarAudio?: boolean;
    // Lista de rects (en coords de viewport) que ocluyen el hit-test del
    // acordeón. Pensado para drawers laterales como el panel FX: aunque el
    // pito siga vivo en rectsCache, si el dedo cae bajo el rect del panel,
    // tratamos el punto como sin pito (no se activa nada).
    obtenerRectsBloqueadores?: () => DOMRect[];
}

// Hit-test estilo app nativa. iOS Safari implicit pointer capture bug
// (WebKit #199803) entrega pointermove throttled cuando el dedo sale del target
// inicial — por eso usamos Touch Events en tactil (clientX/Y siempre fiable) y
// Pointer Events solo para mouse en desktop.
const IMAN_ENTRAR = 16;
const IMAN_SALIR = 22;

export const usePointerAcordeon = ({
    x, logica, actualizarVisualBoton, trenRef, desactivarAudio = false,
    obtenerRectsBloqueadores
}: PointerLogicProps) => {
    const pointersMap = useRef<Map<number, { pos: string; musicalId: string; ts: number }>>(new Map());
    const rectsCache = useRef<Map<string, { left: number; right: number; top: number; bottom: number }>>(new Map());

    // Asignación directa en body: es un ref (no state), evita el useEffect.
    const logicaRef = useRef(logica);
    logicaRef.current = logica;

    const desactivarAudioRef = useRef(desactivarAudio);
    desactivarAudioRef.current = desactivarAudio;

    const rectsBloqueadoresRef = useRef(obtenerRectsBloqueadores);
    rectsBloqueadoresRef.current = obtenerRectsBloqueadores;

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

        // ResizeObserver: invalida cache de rects automaticamente cuando CUALQUIER pito
        // cambia tamano o posicion. Captura casos que los listeners de resize/orientation
        // se pierden: animaciones framer-motion, swap halar/empujar (cambia disposicion de
        // notas), transforms de la barra de herramientas en modo foco, scroll del contenedor.
        // Sin esto, el rectsCache se desincronizaba con el tiempo de uso -> el dedo cae en
        // pito X pero hit-test devuelve X+1. El reset es throttled via requestAnimationFrame
        // dentro de actualizarGeometria, asi no hay costo por batch de cambios simultaneos.
        let rafPendienteRO = 0;
        const recalcThrottled = () => {
            if (rafPendienteRO) return;
            rafPendienteRO = requestAnimationFrame(() => {
                rafPendienteRO = 0;
                actualizarGeometria();
            });
        };
        const ro = new ResizeObserver(recalcThrottled);
        tren.querySelectorAll('.pito-boton').forEach(el => ro.observe(el));
        // Tambien observamos el contenedor padre del tren: si el padre cambia altura/ancho
        // (ej. barra de herramientas se mueve en modo foco), los pitos cambian de viewport
        // coords aunque su tamano relativo no cambie.
        ro.observe(tren);

        const dentroDe = (cx: number, cy: number, r: { left: number; right: number; top: number; bottom: number }, iman: number) =>
            cx >= r.left - iman && cx <= r.right + iman && cy >= r.top - iman && cy <= r.bottom + iman;

        // Devuelve true si (cx,cy) cae dentro de alguno de los rects que el
        // padre marcó como "bloqueadores" (ej. rect del panel FX abierto).
        // Cuando es true, ignoramos el punto como si no hubiera pito ahí —
        // así el slide de un pito visible hacia debajo del panel no enciende
        // los pitos que quedan tapados.
        const enRectBloqueador = (cx: number, cy: number): boolean => {
            const rects = rectsBloqueadoresRef.current?.();
            if (!rects || rects.length === 0) return false;
            for (const r of rects) {
                if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return true;
            }
            return false;
        };

        const encontrarPosEnPunto = (clientX: number, clientY: number, posActual?: string | null): string | null => {
            if (enRectBloqueador(clientX, clientY)) return null;
            // Fast-path Android low-end: elementFromPoint cuesta 5-10ms; si el dedo
            // sigue dentro del rect del pito actual, retornar sin hit-test nativo.
            if (posActual) {
                const rActual = rectsCache.current.get(posActual);
                if (rActual && dentroDe(clientX, clientY, rActual, 0)) return posActual;
            }
            // Match exacto sobre rectsCache antes de elementFromPoint: en
            // touchstart sin posActual, evita los 5-10ms del hit-test nativo
            // cuando el dedo cae claramente dentro de un pito conocido.
            for (const [pos, r] of rectsCache.current.entries()) {
                if (dentroDe(clientX, clientY, r, 0)) return pos;
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
        // Orden critico: actualizarVisualBoton PRIMERO (DOM directo, sincrono al
        // touch event) y actualizarBotonActivo despues envuelto en startTransition
        // (los setStates en cascada -> procesarGolpeAlumno -> notas/guia/maestro/
        // mensaje/feedback/estado se marcan como non-urgent, React no los procesa
        // hasta despues del paint del DOM directo). Esto da el feedback visual
        // inmediato en Android low-end.
        const procesarPunto = (id: number, clientX: number, clientY: number, ts: number) => {
            const data = pointersMap.current.get(id);
            if (!data) return;
            const pos = encontrarPosEnPunto(clientX, clientY, data.pos || null);
            if (pos !== data.pos) {
                if (data.pos) {
                    actualizarVisualBoton(data.pos, false, false);
                    const oldMId = data.musicalId;
                    startTransition(() => {
                        logicaRef.current.actualizarBotonActivo(oldMId, 'remove', null, false);
                    });
                }
                if (pos) {
                    const newMId = `${pos}-${logicaRef.current.direccion}`;
                    data.pos = pos;
                    data.musicalId = newMId;
                    data.ts = ts;
                    actualizarVisualBoton(pos, true, false);
                    startTransition(() => {
                        logicaRef.current.actualizarBotonActivo(newMId, 'add', null, false);
                    });
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
            // No recalcular geometria aqui: actualizarGeometria itera ~33 pitos
            // con getBoundingClientRect (~15ms en Android low-end). Los listeners
            // de resize/orientation/escala ya mantienen el cache fresco.
            const pos = encontrarPosEnPunto(clientX, clientY);
            const esToqueFuelle = !!target.closest('.seccion-bajos-contenedor');
            const esAreaJuego = !!(target.closest('.pito-boton') || esToqueFuelle || target.closest('.diapason-marco'));

            if (pos) {
                // Visual primero (sincrono), motor con startTransition.
                actualizarVisualBoton(pos, true, false);
                logicaRef.current.setFuelleVirtual?.(true);
                const mId = `${pos}-${logicaRef.current.direccion}`;
                pointersMap.current.set(id, { pos, musicalId: mId, ts });
                startTransition(() => {
                    logicaRef.current.actualizarBotonActivo(mId, 'add', null, false);
                });
            } else if (esAreaJuego) {
                pointersMap.current.set(id, { pos: '', musicalId: '', ts });
            }
        };

        const registrarFin = (id: number) => {
            const data = pointersMap.current.get(id);
            if (data?.pos) {
                actualizarVisualBoton(data.pos, false, false);
                const mId = data.musicalId;
                startTransition(() => {
                    logicaRef.current.actualizarBotonActivo(mId, 'remove', null, false);
                });
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
                // Si el touch empieza sobre un rect bloqueador (panel FX), no
                // se registra — evita activar pitos tapados por el panel.
                if (enRectBloqueador(t.clientX, t.clientY)) continue;
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
            // Click sobre el panel FX: ignora — los pitos tapados no deben sonar.
            if (enRectBloqueador(e.clientX, e.clientY)) return;
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
            ro.disconnect();
            if (rafPendienteRO) cancelAnimationFrame(rafPendienteRO);
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
    }, [x, actualizarVisualBoton, trenRef, actualizarGeometria]);

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
        // Defensa adicional: el swap halar/empujar cambia la disposicion de notas en los pitos.
        // El ResizeObserver puede no detectarlo si solo cambia CSS class sin tamano. Invalidamos
        // explicitamente para que el proximo touch use rects refrescados.
        limpiarGeometria();
    }};
};
