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
    // Flag: true después del primer cálculo; no se resetea por cambios de dirección
    const geometriaListaRef = useRef(false);

    // 🚀 THROTTLING: RAF para pointermove (reduce de 120 eventos/seg a 1 por frame)
    const rafPendingRef = useRef<number | null>(null);
    const pendingMoveRef = useRef<Map<number, PointerEvent>>(new Map());

    const logicaRef = useRef(logica);
    useEffect(() => { logicaRef.current = logica; }, [logica]);

    useEffect(() => {
        const tren = trenRef.current;
        if (!tren) return;

        const calcularGeometria = () => {
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
            geometriaListaRef.current = true;
        };

        // Recalcula solo si la geometría no está lista (evita limpiar el cache
        // en cada re-run del effect por cambio de deps como grabando/dirección)
        const actualizarGeometriaBase = () => {
            if (geometriaListaRef.current) {
                // Solo actualizar la posición del tren, no los rects de los botones
                if (!tren) return;
                const currentX = x.get();
                const trenBase = tren.getBoundingClientRect();
                lastTrenRect.current = { left: trenBase.left - currentX, top: trenBase.top };
                return;
            }
            calcularGeometria();
        };

        const forzarRecalculo = () => {
            geometriaListaRef.current = false;
            calcularGeometria();
        };

        window.addEventListener('resize', forzarRecalculo);
        // Primer cálculo en el siguiente frame después de montar
        requestAnimationFrame(calcularGeometria);

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

            const ventanaAltura = window.innerHeight;
            const zonaFuelle = ventanaAltura * 0.15;
            const esZonaFuelle = e.clientY > ventanaAltura - zonaFuelle;

            if (pos) {
                const mId = `${pos}-${logicaRef.current.direccion}`;
                pointersMap.current.set(e.pointerId, { pos, musicalId: mId });
                logicaRef.current.actualizarBotonActivo(mId, 'add', null, true);
                actualizarVisualBoton(pos, true, false);
                registrarEvento('nota_on', { id: mId, pos });
            } else if (esZonaFuelle) {
                // Registrar el pointer del fuelle con pos vacío para que el deslizamiento
                // hacia un botón sea detectado por procesarMove sin interrupción
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

            // ⚡ Volver a HALAR cuando no hay dedos presionados (excepto en zona del fuelle)
            const ventanaAltura = window.innerHeight;
            const zonaFuelle = ventanaAltura * 0.15;
            const esZonaFuelle = e.clientY > ventanaAltura - zonaFuelle;

            // Si levantamos fuera de la zona del fuelle y no hay más dedos, volver a HALAR.
            // ejecutarSwapDireccion es seguro aquí porque actualizarBotonActivo(silencioso:true)
            // ya borró la nota del ref de forma síncrona antes de llegar a esta línea.
            if (!esZonaFuelle && pointersMap.current.size === 0 && logicaRef.current.direccion === 'empujar') {
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
    }, [x, actualizarVisualBoton, registrarEvento, trenRef]);

    // Llamar desde SimuladorApp cuando cambia la tonalidad (botones se re-renderizan)
    const limpiarGeometria = () => {
        geometriaListaRef.current = false;
        rectsCache.current.clear();
        const tren = trenRef.current;
        if (tren) requestAnimationFrame(() => {
            const elPitos = tren.querySelectorAll('.pito-boton');
            const currentX = x.get();
            const trenBase = tren.getBoundingClientRect();
            lastTrenRect.current = { left: trenBase.left - currentX, top: trenBase.top };
            elPitos.forEach(el => {
                const pos = (el as HTMLElement).dataset.pos;
                const r = el.getBoundingClientRect();
                if (pos) rectsCache.current.set(pos, {
                    left: r.left - trenBase.left, right: r.right - trenBase.left,
                    top: r.top - trenBase.top, bottom: r.bottom - trenBase.top
                });
            });
            geometriaListaRef.current = true;
        });
    };

    return { pointersMap, limpiarGeometria, manejarCambioFuelle: (nuevaDireccion: 'halar' | 'empujar', motorAudioPro: any) => {
        if (nuevaDireccion === logicaRef.current.direccion) return;
        // Guard: si el revert es a 'halar' pero hay dedos activos en botones,
        // no interrumpir — el timer del fuelle llegó tarde, el usuario está tocando.
        if (nuevaDireccion === 'halar') {
            for (const data of pointersMap.current.values()) {
                if (data.pos !== '') return;
            }
        }
        motorAudioPro.activarContexto();
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
