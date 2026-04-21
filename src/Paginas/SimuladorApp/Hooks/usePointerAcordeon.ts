import { useCallback, useEffect, useRef } from 'react';
import { MotionValue } from 'framer-motion';
import { motorAudioPro } from '../../SimuladorDeAcordeon/AudioEnginePro';

interface PointerLogicProps {
    x: MotionValue<number>;
    logica: any;
    actualizarVisualBoton: (pos: string, activo: boolean, esBajo: boolean) => void;
    registrarEvento: (tipo: 'nota_on' | 'nota_off' | 'fuelle', data: any) => void;
    trenRef: React.RefObject<HTMLDivElement>;
    desactivarAudio?: boolean;
}

export const usePointerAcordeon = ({
    x, logica, actualizarVisualBoton, registrarEvento, trenRef, desactivarAudio = false
}: PointerLogicProps) => {
    const pointersMap = useRef<Map<number, { pos: string; musicalId: string }>>(new Map());
    const rectsCache = useRef<Map<string, { left: number; right: number; top: number; bottom: number }>>(new Map());
    const lastTrenRect = useRef<{ left: number; top: number } | null>(null);
    const geometriaListaRef = useRef(false);

    // 🚀 THROTTLING: RAF para pointermove (reduce de 120 eventos/seg a 1 por frame)
    const rafPendingRef = useRef<number | null>(null);
    const pendingMoveRef = useRef<Map<number, PointerEvent>>(new Map());

    const logicaRef = useRef(logica);
    useEffect(() => { logicaRef.current = logica; }, [logica]);

    const desactivarAudioRef = useRef(desactivarAudio);
    useEffect(() => { desactivarAudioRef.current = desactivarAudio; }, [desactivarAudio]);

    // Recálculo completo de geometría — definido fuera del effect para ser estable y reutilizable.
    // Sólo usa refs, así que no necesita estar en el array de deps del effect.
    const actualizarGeometria = useCallback(() => {
        const tren = trenRef.current;
        if (!tren) return;
        const elPitos = tren.querySelectorAll('.pito-boton');
        const currentX = x.get();
        const trenBase = tren.getBoundingClientRect();
        lastTrenRect.current = { left: trenBase.left - currentX, top: trenBase.top };
        rectsCache.current.clear();
        elPitos.forEach(el => {
            const pos = (el as HTMLElement).dataset.pos;
            const r = el.getBoundingClientRect();
            if (pos) rectsCache.current.set(pos, {
                left: r.left - trenBase.left, right: r.right - trenBase.left,
                top: r.top - trenBase.top, bottom: r.bottom - trenBase.top
            });
        });
        geometriaListaRef.current = true;
    }, [trenRef, x]);

    useEffect(() => {
        const tren = trenRef.current;
        if (!tren) return;

        const forzarRecalculo = () => {
            geometriaListaRef.current = false;
            actualizarGeometria();
        };

        window.addEventListener('resize', forzarRecalculo);
        // Primer cálculo en el siguiente frame después de montar
        requestAnimationFrame(actualizarGeometria);

        const encontrarPosEnPunto = (clientX: number, clientY: number): string | null => {
            if (!lastTrenRect.current) return null;
            const currentX = x.get();
            const relX = clientX - (lastTrenRect.current.left + currentX);
            const relY = clientY - lastTrenRect.current.top;
            const IMAN = 8;
            for (const [pos, r] of rectsCache.current.entries()) {
                if (relX >= r.left - IMAN && relX <= r.right + IMAN && relY >= r.top - IMAN && relY <= r.bottom + IMAN) return pos;
            }
            return null;
        };

        const handlePointerDown = (e: PointerEvent) => {
            if (desactivarAudioRef.current) return; // 🔇 SILENCIO TOTAL SI HAY MODAL
            const target = e.target as HTMLElement;
            if (target.closest('.indicador-fuelle') || target.closest('.barra-herramientas-contenedor')) return;
            try { target.setPointerCapture(e.pointerId); } catch (_) { }
            // Recálculo síncrono si la geometría aún no está lista (primer toque muy rápido tras montar)
            if (!geometriaListaRef.current) actualizarGeometria();
            const pos = encontrarPosEnPunto(e.clientX, e.clientY);

            // Detección por elemento — funciona sin importar la posición en pantalla del fuelle
            const esToqueFuelle = !!target.closest('.seccion-bajos-contenedor');

            if (pos) {
                // Fuelle Virtual: despierta el AudioContext (fix iOS/Android + silenciador iPhone)
                logicaRef.current.setFuelleVirtual?.(true);
                const mId = `${pos}-${logicaRef.current.direccion}`;
                pointersMap.current.set(e.pointerId, { pos, musicalId: mId });
                logicaRef.current.actualizarBotonActivo(mId, 'add', null, true);
                actualizarVisualBoton(pos, true, false);
                registrarEvento('nota_on', { id: mId, pos });
            } else if (esToqueFuelle) {
                // Registrar el pointer del fuelle (pos vacío) para que el guard de manejarCambioFuelle
                // sepa que el fuelle está activo y no revierta a halar prematuramente
                pointersMap.current.set(e.pointerId, { pos: '', musicalId: '' });
            }
        };

        // 🎯 Función central que procesa un evento de movimiento
        const procesarMove = (e: PointerEvent, pointerId: number) => {
            const data = pointersMap.current.get(pointerId);
            if (!data) return;

            // La dirección se controla EXCLUSIVAMENTE desde ContenedorBajos via manejarCambioFuelle.
            // Nunca llamar setDireccion aquí — cambia el estado sin actualizar los sonidos
            // y genera condiciones de carrera con manejarCambioFuelle.

            const pos = encontrarPosEnPunto(e.clientX, e.clientY);
            if (pos !== data.pos) {
                if (data.pos) {
                    logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                    actualizarVisualBoton(data.pos, false, false);
                    registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                }
                if (pos) {
                    const newMId = `${pos}-${logicaRef.current.direccion}`;
                    pointersMap.current.set(pointerId, { pos, musicalId: newMId });
                    logicaRef.current.actualizarBotonActivo(newMId, 'add', null, true);
                    actualizarVisualBoton(pos, true, false);
                    registrarEvento('nota_on', { id: newMId, pos });
                } else {
                    pointersMap.current.set(pointerId, { pos: '', musicalId: '' });
                }
            }
        };

        // ⚡ RAF-throttled pointermove: acumula eventos y procesa en batch
        const handlePointerMove = (e: PointerEvent) => {
            pendingMoveRef.current.set(e.pointerId, e);
            if (rafPendingRef.current !== null) return; // Ya hay un frame pendiente
            rafPendingRef.current = requestAnimationFrame(() => {
                rafPendingRef.current = null;
                pendingMoveRef.current.forEach((ev, pId) => procesarMove(ev, pId));
                pendingMoveRef.current.clear();
            });
        };

        const handlePointerUp = (e: PointerEvent) => {
            const data = pointersMap.current.get(e.pointerId);
            if (data?.pos) {
                logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                actualizarVisualBoton(data.pos, false, false);
                registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
            }
            pointersMap.current.delete(e.pointerId);

            // Fuelle Virtual: desactivar cuando no quedan dedos en pantalla
            if (pointersMap.current.size === 0) {
                logicaRef.current.setFuelleVirtual?.(false);
            }

            // Auto-revert a HALAR: solo si el pointer que se levantó era de un BOTÓN (pos !== ''),
            // no de un fuelle (pos === ''). El fuelle gestiona su propio revert via ContenedorBajos.
            // También verifica que no quede ningún otro pointer activo (ni botón ni fuelle).
            const eraPointerFuelle = data !== undefined && data.pos === '';
            if (!eraPointerFuelle && pointersMap.current.size === 0 && logicaRef.current.direccion === 'empujar') {
                logicaRef.current.ejecutarSwapDireccion('halar');
            }
        };

        document.addEventListener('pointerdown', handlePointerDown, { capture: true });
        document.addEventListener('pointermove', handlePointerMove, { capture: true });
        document.addEventListener('pointerup', handlePointerUp, { capture: true });
        document.addEventListener('pointercancel', handlePointerUp, { capture: true });

        return () => {
            window.removeEventListener('resize', forzarRecalculo);
            document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
            document.removeEventListener('pointermove', handlePointerMove, { capture: true });
            document.removeEventListener('pointerup', handlePointerUp, { capture: true });
            document.removeEventListener('pointercancel', handlePointerUp, { capture: true });
            if (rafPendingRef.current !== null) {
                cancelAnimationFrame(rafPendingRef.current);
                rafPendingRef.current = null;
            }
        };
    }, [x, actualizarVisualBoton, registrarEvento, trenRef, actualizarGeometria]);

    // Llamar desde SimuladorApp cuando cambia la tonalidad o la escala
    const limpiarGeometria = useCallback(() => {
        geometriaListaRef.current = false;
        rectsCache.current.clear();
        requestAnimationFrame(actualizarGeometria);
    }, [actualizarGeometria]);

    return { pointersMap, limpiarGeometria, actualizarGeometria, manejarCambioFuelle: (nuevaDireccion: 'halar' | 'empujar', motorAudioPro: any) => {
        if (nuevaDireccion === logicaRef.current.direccion) return;
        // Guard: si el revert es a 'halar' pero hay dedos activos en botones,
        // no interrumpir — el timer del fuelle llegó tarde, el usuario está tocando.
        if (nuevaDireccion === 'halar') {
            for (const data of pointersMap.current.values()) {
                if (data.pos !== '') return;
            }
        }
        motorAudioPro.activarContexto();
        // Si la geometría no estaba lista (primer toque en fuelle antes del RAF de mount),
        // calcularla ahora para que los botones respondan correctamente después.
        if (!geometriaListaRef.current) actualizarGeometria();
        // ejecutarSwapDireccion hace crossfade por nota (para+arranca en 15ms por canal)
        // sin gap audible. También llama setDireccion internamente.
        logicaRef.current.ejecutarSwapDireccion(nuevaDireccion);
        // Sincronizar pointersMap con los nuevos musicalIds para que handlePointerUp
        // pueda remover las notas correctamente al soltar los dedos
        pointersMap.current.forEach((data, pId) => {
            if (data.pos) {
                pointersMap.current.set(pId, { ...data, musicalId: `${data.pos}-${nuevaDireccion}` });
            }
        });
    }};
};
