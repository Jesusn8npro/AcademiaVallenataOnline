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

// Hit-test estilo app nativa:
//  1) document.elementFromPoint() — el browser hace el hit-test real, sin matemática manual.
//     Funciona aunque el tren esté con transform, drag, escala o cualquier transformación.
//  2) Histéresis: una vez asignado a un pito, lo mantenemos mientras el dedo no salga
//     claramente de él. Anula el jitter sub-pixel del touch sensor.
//  3) Imán de proximidad: si el dedo cae en un gap entre pitos, lo asignamos al más cercano
//     dentro de IMAN_ENTRAR. Solo activo cuando elementFromPoint no encontró pito directo.
const IMAN_ENTRAR = 16;
const IMAN_SALIR = 36;

export const usePointerAcordeon = ({
    x, logica, actualizarVisualBoton, registrarEvento, trenRef, desactivarAudio = false
}: PointerLogicProps) => {
    const pointersMap = useRef<Map<number, { pos: string; musicalId: string; ts: number }>>(new Map());
    // Coords ABSOLUTAS de cada pito (no relativas al tren). Se refrescan en cada pointerdown
    // para que cualquier cambio de layout/drag/escala que haya pasado entre toques se vea reflejado.
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

        // Hit-test combinado: nativo + histéresis + imán.
        const encontrarPosEnPunto = (clientX: number, clientY: number, posActual?: string | null): string | null => {
            // 1) Hit-test nativo. Ignora pointer capture, ignora transforms, siempre exacto.
            //    En iOS/Safari y Android Chrome es ~0.05-0.2ms — más barato que iterar rects.
            const target = document.elementFromPoint(clientX, clientY);
            if (target) {
                const pito = (target as HTMLElement).closest('.pito-boton[data-pos]') as HTMLElement | null;
                if (pito?.dataset.pos) return pito.dataset.pos;
            }

            // 2) Histéresis: si veníamos de un pito, mantenerlo mientras el dedo no salga
            //    del rect expandido. Anula el "rebote" por jitter del sensor.
            if (posActual) {
                const rActual = rectsCache.current.get(posActual);
                if (rActual && dentroDe(clientX, clientY, rActual, IMAN_SALIR)) return posActual;
            }

            // 3) Imán: el dedo cayó en un gap. Buscar el pito más cercano dentro de IMAN_ENTRAR.
            for (const [pos, r] of rectsCache.current.entries()) {
                if (dentroDe(clientX, clientY, r, IMAN_ENTRAR)) return pos;
            }
            return null;
        };

        const handlePointerDown = (e: PointerEvent) => {
            if (desactivarAudioRef.current) return;

            const target = e.target as HTMLElement;
            const esAreaJuego = !!(target.closest('.pito-boton') || target.closest('.seccion-bajos-contenedor') || target.closest('.diapason-marco'));
            if (esAreaJuego && e.cancelable) e.preventDefault();

            motorAudioPro.activarContexto();

            if (target.closest('.indicador-fuelle') || target.closest('.barra-herramientas-contenedor')) return;

            // Refresco de rects al inicio de cada toque: 33 mediciones (~1-2ms en móvil).
            // Esto garantiza que el imán esté siempre alineado con la posición actual del tren,
            // sin importar cuántos drags/escalas/cambios hubo entre toques.
            actualizarGeometria();

            const pos = encontrarPosEnPunto(e.clientX, e.clientY);
            const esToqueFuelle = !!target.closest('.seccion-bajos-contenedor');

            if (pos) {
                logicaRef.current.setFuelleVirtual?.(true);
                const mId = `${pos}-${logicaRef.current.direccion}`;
                pointersMap.current.set(e.pointerId, { pos, musicalId: mId, ts: e.timeStamp });
                logicaRef.current.actualizarBotonActivo(mId, 'add', null, true);
                actualizarVisualBoton(pos, true, false);
                registrarEvento('nota_on', { id: mId, pos });
            } else if (esToqueFuelle) {
                pointersMap.current.set(e.pointerId, { pos: '', musicalId: '', ts: e.timeStamp });
            } else if (esAreaJuego) {
                pointersMap.current.set(e.pointerId, { pos: '', musicalId: '', ts: e.timeStamp });
            }
        };

        // Procesamiento directo (sin RAF throttle) — latencia mínima en glissandos.
        const handlePointerMove = (e: PointerEvent) => {
            const data = pointersMap.current.get(e.pointerId);
            if (!data) return;

            const target = e.target as HTMLElement;
            const esAreaJuego = !!(target.closest('.pito-boton') || target.closest('.seccion-bajos-contenedor') || target.closest('.diapason-marco'));
            if (esAreaJuego && e.cancelable) e.preventDefault();

            const pos = encontrarPosEnPunto(e.clientX, e.clientY, data.pos || null);
            if (pos !== data.pos) {
                if (data.pos) {
                    logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                    actualizarVisualBoton(data.pos, false, false);
                    registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                }
                if (pos) {
                    const newMId = `${pos}-${logicaRef.current.direccion}`;
                    pointersMap.current.set(e.pointerId, { pos, musicalId: newMId, ts: e.timeStamp });
                    logicaRef.current.actualizarBotonActivo(newMId, 'add', null, true);
                    actualizarVisualBoton(pos, true, false);
                    registrarEvento('nota_on', { id: newMId, pos });
                } else {
                    pointersMap.current.set(e.pointerId, { pos: '', musicalId: '', ts: e.timeStamp });
                }
            } else {
                data.ts = e.timeStamp;
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            const target = e.target as HTMLElement;
            const esAreaJuego = !!(target.closest('.pito-boton') || target.closest('.seccion-bajos-contenedor') || target.closest('.diapason-marco'));
            if (esAreaJuego && e.cancelable) e.preventDefault();

            const data = pointersMap.current.get(e.pointerId);
            if (data?.pos) {
                logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                actualizarVisualBoton(data.pos, false, false);
                registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
            }
            pointersMap.current.delete(e.pointerId);

            if (pointersMap.current.size === 0) {
                logicaRef.current.setFuelleVirtual?.(false);
            }
        };

        // Watchdog: pointers zombi por pointercancel perdidos (gestos del SO en iOS/Android).
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

        document.addEventListener('pointerdown', handlePointerDown, { capture: true });
        document.addEventListener('pointermove', handlePointerMove, { capture: true });
        document.addEventListener('pointerup', handlePointerUp, { capture: true });
        document.addEventListener('pointercancel', handlePointerUp, { capture: true });

        return () => {
            window.removeEventListener('resize', forzarRecalculo);
            window.removeEventListener('orientationchange', forzarRecalculo);
            window.clearInterval(watchdogId);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('blur', limpiarTodo);
            document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
            document.removeEventListener('pointermove', handlePointerMove, { capture: true });
            document.removeEventListener('pointerup', handlePointerUp, { capture: true });
            document.removeEventListener('pointercancel', handlePointerUp, { capture: true });
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
