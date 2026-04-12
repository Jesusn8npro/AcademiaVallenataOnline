import { useEffect, useRef } from 'react';
import { MotionValue } from 'framer-motion';

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

    // 🚀 THROTTLING: RAF para pointermove (reduce de 120 eventos/seg a 1 por frame)
    const rafPendingRef = useRef<number | null>(null);
    const pendingMoveRef = useRef<Map<number, PointerEvent>>(new Map());

    const logicaRef = useRef(logica);
    useEffect(() => { logicaRef.current = logica; }, [logica]);

    useEffect(() => {
        const tren = trenRef.current;
        if (!tren) return;

        const actualizarGeometriaBase = () => {
            if (!tren) return;
            const elPitos = tren.querySelectorAll('.pito-boton');
            const currentX = x.get();
            const trenBase = tren.getBoundingClientRect();
            lastTrenRect.current = { left: trenBase.left - currentX, top: trenBase.top };
            rectsCache.current.clear();
            elPitos.forEach(el => {
                const pos = (el as HTMLElement).dataset.pos;
                const r = el.getBoundingClientRect();
                if (pos) {
                    rectsCache.current.set(pos, {
                        left: r.left - trenBase.left, right: r.right - trenBase.left,
                        top: r.top - trenBase.top, bottom: r.bottom - trenBase.top
                    });
                }
            });
        };

        window.addEventListener('resize', actualizarGeometriaBase);
        // ⚡ Carga inmediata en el próximo frame (no esperar 1 segundo)
        requestAnimationFrame(actualizarGeometriaBase);

        const encontrarPosEnPunto = (clientX: number, clientY: number): string | null => {
            if (!lastTrenRect.current) return null;
            const currentX = x.get();
            const relX = clientX - (lastTrenRect.current.left + currentX);
            const relY = clientY - lastTrenRect.current.top;
            const IMAN = 25;
            for (const [pos, r] of rectsCache.current.entries()) {
                if (relX >= r.left - IMAN && relX <= r.right + IMAN && relY >= r.top - IMAN && relY <= r.bottom + IMAN) return pos;
            }
            return null;
        };

        const handlePointerDown = (e: PointerEvent) => {
            if (desactivarAudio) return; // 🔇 SILENCIO TOTAL SI HAY MODAL
            const target = e.target as HTMLElement;
            if (target.closest('.indicador-fuelle') || target.closest('.barra-herramientas-contenedor')) return;
            try { target.setPointerCapture(e.pointerId); } catch (_) { }
            const pos = encontrarPosEnPunto(e.clientX, e.clientY);
            if (pos) {
                const mId = `${pos}-${logicaRef.current.direccion}`;
                pointersMap.current.set(e.pointerId, { pos, musicalId: mId });
                logicaRef.current.actualizarBotonActivo(mId, 'add', null, true);
                actualizarVisualBoton(pos, true, false);
                registrarEvento('nota_on', { id: mId, pos });
            }
        };

        // 🎯 Función central que procesa un evento de movimiento
        const procesarMove = (e: PointerEvent, pointerId: number) => {
            const data = pointersMap.current.get(pointerId);
            if (!data) return;
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
        };

        document.addEventListener('pointerdown', handlePointerDown, { capture: true });
        document.addEventListener('pointermove', handlePointerMove, { capture: true });
        document.addEventListener('pointerup', handlePointerUp, { capture: true });
        document.addEventListener('pointercancel', handlePointerUp, { capture: true });

        return () => {
            window.removeEventListener('resize', actualizarGeometriaBase);
            document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
            document.removeEventListener('pointermove', handlePointerMove, { capture: true });
            document.removeEventListener('pointerup', handlePointerUp, { capture: true });
            document.removeEventListener('pointercancel', handlePointerUp, { capture: true });
            // Limpiar RAF pendiente
            if (rafPendingRef.current !== null) {
                cancelAnimationFrame(rafPendingRef.current);
                rafPendingRef.current = null;
            }
        };
    }, [x, actualizarVisualBoton, registrarEvento, trenRef]);

    return { pointersMap, manejarCambioFuelle: (nuevaDireccion: 'halar' | 'empujar', motorAudioPro: any) => {
        if (nuevaDireccion === logicaRef.current.direccion) return;
        motorAudioPro.activarContexto();
        motorAudioPro.detenerTodo(0.012);
        pointersMap.current.forEach((data, pId) => {
            if (data.pos) {
                const nextId = `${data.pos}-${nuevaDireccion}`;
                logicaRef.current.actualizarBotonActivo(nextId, 'add', null, true);
                pointersMap.current.set(pId, { ...data, musicalId: nextId });
            }
        });
        logicaRef.current.setDireccion(nuevaDireccion);
    }};
};
