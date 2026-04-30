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
            // 1) Hit nativo (siempre exacto, ignora pointer capture).
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
                    logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                    actualizarVisualBoton(data.pos, false, false);
                    registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                }
                if (pos) {
                    const newMId = `${pos}-${logicaRef.current.direccion}`;
                    data.pos = pos;
                    data.musicalId = newMId;
                    data.ts = ts;
                    logicaRef.current.actualizarBotonActivo(newMId, 'add', null, true);
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
                logicaRef.current.actualizarBotonActivo(mId, 'add', null, true);
                actualizarVisualBoton(pos, true, false);
                registrarEvento('nota_on', { id: mId, pos });
            } else if (esAreaJuego) {
                pointersMap.current.set(id, { pos: '', musicalId: '', ts });
            }
        };

        const registrarFin = (id: number) => {
            const data = pointersMap.current.get(id);
            if (data?.pos) {
                logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
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
        // - getCoalescedEvents-equivalente: e.changedTouches contiene cada touch individual.
        const handleTouchStart = (e: TouchEvent) => {
            if (desactivarAudioRef.current) return;
            motorAudioPro.activarContexto();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                registrarInicio(t.identifier, t.target as HTMLElement, t.clientX, t.clientY, e.timeStamp);
            }
            // preventDefault SIEMPRE en el root (no solo en area de juego): impide que iOS
            // active el "system gesture detection" que dispara el throttling de touchmove con un solo dedo.
            if (e.cancelable) e.preventDefault();
        };

        const handleTouchMove = (e: TouchEvent) => {
            // Procesar TODOS los touches activos (no solo changedTouches): iOS Safari puede
            // suprimir touchmove individuales con un solo dedo (bug WebKit conocido), pero el
            // próximo evento que llegue traerá la posición actualizada de ambos dedos en e.touches.
            // Esto recupera transiciones perdidas durante trinos rápidos.
            for (let i = 0; i < e.touches.length; i++) {
                const t = e.touches[i];
                procesarPunto(t.identifier, t.clientX, t.clientY, e.timeStamp);
            }
            if (e.cancelable) e.preventDefault();
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

        // 🎯 iOS throttling fix (single-touch): supresores globales de touchstart Y touchmove
        // en zonas no interactivas. El throttling adaptativo de iOS se aplica al touchmove
        // (no solo al touchstart) cuando el browser detecta que el evento PUEDE ser interpretado
        // como gesto del sistema (swipe-back, edge-pan, scroll). Si UN listener pasivo de
        // touchmove existe en el path, iOS reduce a 10-15Hz "por las dudas". Marcar el listener
        // como no-pasivo Y llamar preventDefault le dice a iOS "nadie va a scrollear/zoomear,
        // entrega los eventos a frecuencia nativa (60Hz)". La whitelist excluye inputs, selects
        // y todos los overlays de modales para no romper scroll, selección, ni teclado virtual.
        const SELECTORES_INTERACTIVOS = 'input, textarea, select, [contenteditable], .modal-instrumentos-overlay, .modal-tonalidades-overlay, .modal-vista-overlay, .modal-metronomo-overlay, .modal-contacto-overlay, .menu-opciones-contenedor';

        const esZonaInteractiva = (target: EventTarget | null): boolean => {
            const el = target as HTMLElement | null;
            if (!el || !el.closest) return false;
            return !!el.closest(SELECTORES_INTERACTIVOS);
        };

        const handleWindowTouchStart = (e: TouchEvent) => {
            if (esZonaInteractiva(e.target)) return;
            if (e.cancelable) e.preventDefault();
        };

        const handleWindowTouchMove = (e: TouchEvent) => {
            if (esZonaInteractiva(e.target)) return;
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
                    logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
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
                    logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
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
