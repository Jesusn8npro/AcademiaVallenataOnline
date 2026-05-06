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

// Hit-test estilo app nativa, robusto contra iOS Safari implicit pointer capture bug
// (WebKit #199803): cuando el dedo se mueve fuera del elemento donde empezó el toque,
// los pointermove se entregan a baja frecuencia o se pierden. Para evitarlo usamos
// Touch Events directamente en dispositivos táctiles (mejor soporte iOS) y Pointer
// Events solo para mouse en desktop.
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
            // 🎯 Latency optimization (Android low-end): elementFromPoint cuesta 5-10ms por
            // llamada en devices low-end. Si el dedo sigue claramente dentro del rect del pito
            // actual, retornar inmediatamente sin hit-test nativo. Esto cubre la mayoría de los
            // touchmoves (movimientos pequeños dentro del mismo pito) y reduce el bloqueo del
            // main thread, lo que se traduce en menor latencia perceptible al disparar notas.
            if (posActual) {
                const rActual = rectsCache.current.get(posActual);
                if (rActual && dentroDe(clientX, clientY, rActual, 0)) return posActual;
            }
            // 1) Hit nativo (siempre exacto aunque el tren se haya deslizado horizontalmente).
            const target = document.elementFromPoint(clientX, clientY);
            if (target) {
                const pito = (target as HTMLElement).closest('.pito-boton[data-pos]') as HTMLElement | null;
                if (pito?.dataset.pos) return pito.dataset.pos;
            }
            // 2) Histéresis suave si veníamos de un pito y aún estamos dentro de su rect expandido.
            if (posActual) {
                const rActual = rectsCache.current.get(posActual);
                if (rActual && dentroDe(clientX, clientY, rActual, IMAN_SALIR)) return posActual;
            }
            // 3) Imán al pito más cercano si caímos en gap.
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

        // ============== TOUCH EVENTS (móvil) ==============
        // Touch events son MÁS confiables en iOS Safari para drag continuo:
        // - No tienen el bug de implicit capture.
        // - clientX/Y se entregan correctamente aunque el dedo se mueva fuera del target inicial.
        // - e.changedTouches contiene cada touch individual de este evento.
        //
        // ⚠️ IMPORTANTE — iterar por TOUCH, no por evento.
        // Chrome Android puede coalesce varios touchstart en un solo evento cuando
        // ocurren en el mismo tick (ej: dedo en fuelle + dedos en pitos casi a la vez).
        // En ese caso `e.target` es el target de UN solo toque, pero `changedTouches`
        // contiene varios. Si filtramos por `e.target` se descarta el evento entero
        // y los pitos nunca se registran. Iteramos cada touch y filtramos su target
        // individualmente — así los toques del fuelle se ignoran (no son area de juego)
        // pero los toques de pitos en el mismo evento sí se registran.
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

        // touchmove: iterar todos los touches activos y procesar solo los que estén
        // registrados en pointersMap. procesarPunto ya filtra por pointersMap (si el
        // touch no está registrado, no hace nada), así que no necesita guarda de target.
        // Esto permite que los movimientos de los pitos se procesen aun cuando hay un
        // dedo en el fuelle activo simultaneamente.
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

        // 🎯 iOS Safari fix: attachar los listeners al elemento del simulador, NO a document.
        // En iOS, los eventos táctiles a nivel document son más propensos al throttling
        // single-touch y al "tap delay" del double-tap detection. A nivel elemento
        // específico (con touch-action: none) se entregan con mayor frecuencia.
        const rootSimulador = (document.querySelector('.simulador-app-root') as HTMLElement | null) || document;

        // 🎯 iOS throttling fix (single-touch): preventDefault SOLO sobre el área
        // jugable (pitos / diapasón / fuelle de bajos). Esto evita que iOS interprete
        // el toque como gesto del sistema y entregue los touchmove a frecuencia nativa
        // (60Hz vs 10-15Hz throttled).
        //
        // ⚠️ Estrategia "opt-in" (bloquear solo área de juego) en lugar de "opt-out"
        // (bloquear todo menos whitelist). El opt-out era frágil: cada modal/overlay
        // nuevo había que añadirlo a la lista o se quedaba con el touch bloqueado y
        // la pantalla se sentía muerta. Con opt-in, cualquier UI fuera del área
        // jugable funciona automáticamente sin mantenimiento.
        const ZONAS_JUGABLES = '.pito-boton, .diapason-marco, .seccion-bajos-contenedor';

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
