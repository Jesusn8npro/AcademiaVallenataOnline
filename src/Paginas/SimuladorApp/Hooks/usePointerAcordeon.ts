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

export const usePointerAcordeon = ({
    x, logica, actualizarVisualBoton, registrarEvento, trenRef, desactivarAudio = false
}: PointerLogicProps) => {
    const pointersMap = useRef<Map<number, { pos: string; musicalId: string; ts: number }>>(new Map());
    const rectsCache = useRef<Map<string, { left: number; right: number; top: number; bottom: number }>>(new Map());
    const lastTrenRect = useRef<{ left: number; top: number } | null>(null);
    const geometriaListaRef = useRef(false);

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
            const IMAN = 14;
            for (const [pos, r] of rectsCache.current.entries()) {
                if (relX >= r.left - IMAN && relX <= r.right + IMAN && relY >= r.top - IMAN && relY <= r.bottom + IMAN) return pos;
            }
            return null;
        };

        // Refresca solo el offset del tren (1 medición barata) sin re-leer todos los pitos.
        // Importante para que glissandos/scroll/orientation no desincronicen los hitboxes.
        const refrescarOffsetTren = () => {
            if (!tren) return;
            const r = tren.getBoundingClientRect();
            lastTrenRect.current = { left: r.left - x.get(), top: r.top };
        };

        const handlePointerDown = (e: PointerEvent) => {
            if (desactivarAudioRef.current) return;

            const target = e.target as HTMLElement;
            const esAreaJuego = !!(target.closest('.pito-boton') || target.closest('.seccion-bajos-contenedor') || target.closest('.diapason-marco'));

            // 🚀 BLINDAJE SELECTIVO: Solo prevenir default si estamos en el área de toque del acordeón
            // Esto permite que los botones del menú, modales y barra superior funcionen normalmente.
            if (esAreaJuego && e.cancelable) e.preventDefault();

            // 🔊 PERSISTENCIA DE AUDIO
            motorAudioPro.activarContexto();

            if (target.closest('.indicador-fuelle') || target.closest('.barra-herramientas-contenedor')) return;
            try { target.setPointerCapture(e.pointerId); } catch (_) { }
            // Geometría siempre fresca: recálculo completo si no está lista, o solo offset del tren si lo está.
            // Evita hitboxes obsoletos por scroll/orientation/layout sin pagar el costo de medir 33 pitos cada vez.
            if (!geometriaListaRef.current) actualizarGeometria();
            else refrescarOffsetTren();
            const pos = encontrarPosEnPunto(e.clientX, e.clientY);

            const esToqueFuelle = !!target.closest('.seccion-bajos-contenedor');

            if (pos) {
                // Fuelle Virtual: despierta el AudioContext (fix iOS/Android + silenciador iPhone)
                logicaRef.current.setFuelleVirtual?.(true);
                const mId = `${pos}-${logicaRef.current.direccion}`;
                pointersMap.current.set(e.pointerId, { pos, musicalId: mId, ts: e.timeStamp });
                logicaRef.current.actualizarBotonActivo(mId, 'add', null, true);
                actualizarVisualBoton(pos, true, false);
                registrarEvento('nota_on', { id: mId, pos });
            } else if (esToqueFuelle) {
                // Registrar el pointer del fuelle (pos vacío) para que el guard de manejarCambioFuelle
                // sepa que el fuelle está activo y no revierta a halar prematuramente
                pointersMap.current.set(e.pointerId, { pos: '', musicalId: '', ts: e.timeStamp });
            } else if (esAreaJuego) {
                // Cualquier toque en el área de juego (marco, hilera, gap) registra el pointer
                // para soportar glissando: el dedo entró en una zona muerta pero puede deslizarse a un pito.
                pointersMap.current.set(e.pointerId, { pos: '', musicalId: '', ts: e.timeStamp });
            }
        };

        // ⚡ Procesamiento directo (sin RAF) para latencia mínima en glissandos.
        // El RAF anterior agregaba ~16ms de retardo perceptible al deslizar.
        const handlePointerMove = (e: PointerEvent) => {
            const data = pointersMap.current.get(e.pointerId);
            if (!data) return;

            const target = e.target as HTMLElement;
            const esAreaJuego = !!(target.closest('.pito-boton') || target.closest('.seccion-bajos-contenedor') || target.closest('.diapason-marco'));
            if (esAreaJuego && e.cancelable) e.preventDefault();

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
                    pointersMap.current.set(e.pointerId, { pos, musicalId: newMId, ts: e.timeStamp });
                    logicaRef.current.actualizarBotonActivo(newMId, 'add', null, true);
                    actualizarVisualBoton(pos, true, false);
                    registrarEvento('nota_on', { id: newMId, pos });
                } else {
                    pointersMap.current.set(e.pointerId, { pos: '', musicalId: '', ts: e.timeStamp });
                }
            } else {
                // Mantener el timestamp vivo para el watchdog de zombis aunque no cambie de pos.
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

            // Fuelle Virtual: desactivar cuando no quedan dedos en pantalla
            if (pointersMap.current.size === 0) {
                logicaRef.current.setFuelleVirtual?.(false);
            }
        };

        // 🧹 Watchdog: limpia pointers zombi (pointercancel perdidos por gestos del sistema en iOS/Android).
        // Sin esto el pool de voces se llena de notas fantasma y el simulador se "traba" tras un rato.
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

        // 🛑 Si la pestaña se oculta o pierde foco, limpiamos todo: el SO suele matar
        // pointercancel/up en background y deja notas sonando para siempre.
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
            window.clearInterval(watchdogId);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('blur', limpiarTodo);
            document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
            document.removeEventListener('pointermove', handlePointerMove, { capture: true });
            document.removeEventListener('pointerup', handlePointerUp, { capture: true });
            document.removeEventListener('pointercancel', handlePointerUp, { capture: true });
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
        motorAudioPro.activarContexto();
        if (!geometriaListaRef.current) actualizarGeometria();
        // ejecutarSwapDireccion para+arranca cada nota con un crossfade muy corto (~5ms) sin gap audible.
        logicaRef.current.ejecutarSwapDireccion(nuevaDireccion);
        // Sincronizar pointersMap con los nuevos musicalIds para que handlePointerUp
        // pueda remover las notas correctamente al soltar los dedos
        const ahora = performance.now();
        pointersMap.current.forEach((data, pId) => {
            if (data.pos) {
                pointersMap.current.set(pId, { pos: data.pos, musicalId: `${data.pos}-${nuevaDireccion}`, ts: ahora });
            }
        });
    }};
};
