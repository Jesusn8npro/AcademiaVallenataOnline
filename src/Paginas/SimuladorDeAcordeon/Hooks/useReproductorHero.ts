import { useState, useRef, useCallback, useEffect } from 'react';
import type { NotaHero, CancionHero } from '../videojuego_acordeon/tipos_Hero';
import { motorAudioPro } from '../AudioEnginePro';

/**
 * HOOK: useReproductorHero (V2 - Sincronizado por Ticks)
 * Ahora permite cambios de BPM en tiempo real, pausa, rebobinado y bucles (loops).
 */
export const useReproductorHero = (
    actualizarBoton: (id: string, accion: 'add' | 'remove', instancias?: any[] | null, silencioso?: boolean) => void,
    setDireccionSinSwap: (dir: 'halar' | 'empujar') => void,
    logica_reproduceTono: (id: string, tiempo?: number, duracion?: number) => { instances: any[] } | null,
    bpmActual: number, // Nuevo parámetro: BPM que viene del simulador
    onBpmCambiado?: (nuevoBpm: number) => void, // Callback cuando cambia el BPM
    onBeat?: (beatIndex: number) => void, // Callback para cada beat (metrónomo)
    onLoopJump?: (startTick: number) => void
) => {
    const [reproduciendo, setReproduciendo] = useState(false);
    const [pausado, setPausado] = useState(false);
    const [cancionActual, setCancionActual] = useState<CancionHero | null>(null);
    const [tickActual, setTickActual] = useState(0);
    const [totalTicks, setTotalTicks] = useState(0);

    // --- REFS PARA EL MOTOR DE PRECISIÓN ABSOLUTA (HARDWARE CLOCK) ---
    const tickRef = useRef(0);
    const checkpointTimeRef = useRef(0); // Ahora en SEGUNDOS (AudioContext)
    const checkpointTickRef = useRef(0);
    const bpmRef = useRef(bpmActual);

    const bpmTargetRef = useRef(bpmActual);
    
    // Almacenamos el BPM objetivo, pero NO saltamos el reloj aquí.
    // El reloj se sincroniza atómicamente dentro del loop para evitar desincronizaciones de UI.
    useEffect(() => {
        bpmTargetRef.current = bpmActual;
    }, [bpmActual]);

    const pausadoRef = useRef(false);
    const animFrameRef = useRef(0);
    const loopABRef = useRef<{ start: number, end: number, activo: boolean }>({ start: 0, end: 0, activo: false });

    // Callbacks para Pro Max (metrónomo y cambios de BPM)
    const onBpmCambiadoRef = useRef(onBpmCambiado);
    const onBeatRef = useRef(onBeat);
    const onLoopJumpRef = useRef(onLoopJump);
    const lastBeatIndexRef = useRef(-1);

    useEffect(() => {
        onBpmCambiadoRef.current = onBpmCambiado;
    }, [onBpmCambiado]);

    useEffect(() => {
        onBeatRef.current = onBeat;
    }, [onBeat]);

    useEffect(() => {
        onLoopJumpRef.current = onLoopJump;
    }, [onLoopJump]);

    // Notas que están "listas" o "pasadas"
    const notasOriginalesRef = useRef<NotaHero[]>([]);
    const notasActivasRef = useRef<Map<string, { endTimeTick: number, instancias: any[], botonId: string }>>(new Map());

    // --- LIMPIEZA TOTAL ---
    const detenerReproduccion = useCallback(() => {
        setReproduciendo(false);
        setPausado(false);
        (pausadoRef as any).current = false;
        
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;

        // Limpiar motor y UI
        if ((window as any).motorAudioPro) (window as any).motorAudioPro.detenerTodo();
        
        notasActivasRef.current.forEach((val, info) => {
            actualizarBoton(val.botonId || info, 'remove', null, false);
        });
        notasActivasRef.current.clear();
        
        tickRef.current = 0;
        checkpointTickRef.current = 0;
        checkpointTimeRef.current = 0;
        setTickActual(0);
    }, [actualizarBoton]);

    const alternarPausa = useCallback(() => {
        if (!reproduciendo) return;
        const nuevoEstado = !(pausadoRef as any).current;
        (pausadoRef as any).current = nuevoEstado;
        setPausado(nuevoEstado);
        
        if (nuevoEstado) {
            // Pausado: Congelamos posición exacta
            const ahora = motorAudioPro.tiempoActual;
            const resolucion = 192;
            if (checkpointTimeRef.current > 0) {
                const ticksDesdeUltimoCheckpoint = (ahora - checkpointTimeRef.current) * (bpmRef.current / 60) * resolucion;
                checkpointTickRef.current += ticksDesdeUltimoCheckpoint;
            }
            checkpointTimeRef.current = ahora;
            if ((window as any).motorAudioPro) (window as any).motorAudioPro.detenerTodo();
        } else {
            // Al reanudar, marcamos el "ahora" como nuevo checkpoint relativo
            checkpointTimeRef.current = motorAudioPro.tiempoActual;
        }
    }, [reproduciendo]);

    // --- EL CORAZÓN DEL REPRODUCTOR (Loop de Ticks impulsado por Hardware) ---
    const loop = useCallback(() => {
        if ((pausadoRef as any).current) {
            animFrameRef.current = requestAnimationFrame(loop);
            return;
        }

        const ahora = motorAudioPro.tiempoActual;
        const resolucion = 192;
        
        // 🔄 ATOMIC BPM SYNC: Sincronización precisa en tiempo real
        if (bpmRef.current !== bpmTargetRef.current) {
            if (checkpointTimeRef.current > 0) {
                const ticksAcumulados = (ahora - checkpointTimeRef.current) * (bpmRef.current / 60) * resolucion;
                checkpointTickRef.current += ticksAcumulados;
            }
            checkpointTimeRef.current = ahora;
            bpmRef.current = bpmTargetRef.current;
            // 📢 Notificar cambio de BPM (para AcordeonProMax)
            onBpmCambiadoRef.current?.(bpmRef.current);
        }

        // Transformación de tiempo a ticks
        const ticksPorSegundo = (bpmRef.current / 60) * resolucion;
        const ticksDesdeCheckpoint = (ahora - checkpointTimeRef.current) * ticksPorSegundo;
        
        const nuevoTickAbsoluto = checkpointTickRef.current + ticksDesdeCheckpoint;
        const deltaTicksFrame = nuevoTickAbsoluto - tickRef.current;
        tickRef.current = nuevoTickAbsoluto;

        // 🎵 Disparar callback de beat cuando cruzamos una línea de beat
        if (onBeatRef.current) {
            const beatIndex = Math.floor(tickRef.current / resolucion);
            if (beatIndex > lastBeatIndexRef.current) {
                lastBeatIndexRef.current = beatIndex;
                onBeatRef.current(beatIndex);
            }
        }

        // Manejo de Bucle A-B (Precisión al salto)
        if (loopABRef.current.activo && tickRef.current >= loopABRef.current.end) {
            tickRef.current = loopABRef.current.start;
            checkpointTickRef.current = loopABRef.current.start;
            checkpointTimeRef.current = ahora;
            onLoopJumpRef.current?.(loopABRef.current.start);

            notasActivasRef.current.forEach((val, llave) => actualizarBoton(val.botonId || llave, 'remove', null, true));
            notasActivasRef.current.clear();
            if ((window as any).motorAudioPro) (window as any).motorAudioPro.detenerTodo();
            // Retornamos de inmediato para limpiar este frame
            animFrameRef.current = requestAnimationFrame(loop);
            return;
        }

        // 1. Apagar notas cuya duración terminó
        notasActivasRef.current.forEach((info, llaveUnica) => {
            if (tickRef.current >= info.endTimeTick) {
                // 🛑 Detener el audio manualmente (Esto permite elasticidad si cambia el BPM)
                if (info.instancias && info.instancias.length > 0) {
                    info.instancias.forEach((inst: any) => {
                        if ((window as any).motorAudioPro) {
                            (window as any).motorAudioPro.detener(inst, 0.05); // Fade rápido
                        }
                    });
                }
                
                // Apagar luz UI
                actualizarBoton(info.botonId, 'remove', null, false);
                notasActivasRef.current.delete(llaveUnica);
            }
        });

        // 2. Encender notas en TIEMPO REAL
        notasOriginalesRef.current.forEach(nota => {
            // Nota cruzó el umbral en este frame
            if (nota.tick >= tickRef.current - deltaTicksFrame && nota.tick < tickRef.current) {
                // Generar un ID único por nota (tick + botonId)
                const llaveUnica = `${nota.botonId}_${nota.tick}`;
                
                if (!notasActivasRef.current.has(llaveUnica)) {
                    setDireccionSinSwap(nota.fuelle === 'abriendo' ? 'halar' : 'empujar');
                    
                    // 🎶 Disparo Inmediato SIN duracion programada
                    // Esto permite que la nota dure todo el tiempo que deba mientras el BPM fluye libremente.
                    // Si el usuario frena el BPM casi a 0, la nota seguirá sonando hasta cruzar su tick de cierre.
                    const result = logica_reproduceTono(nota.botonId);
                    const instancias = result?.instances || [];

                    actualizarBoton(nota.botonId, 'add', instancias, false);

                    // Guardamos usando la llave única incluyendo botonId para poder apagarlo luego
                    notasActivasRef.current.set(llaveUnica, {
                        endTimeTick: nota.tick + nota.duracion,
                        instancias,
                        botonId: nota.botonId
                    });
                }
            }
        });

        setTickActual(Math.floor(tickRef.current));

        // Finalización lógica
        const ultimoTickMusica = notasOriginalesRef.current[notasOriginalesRef.current.length - 1]?.tick || 0;
        if (!loopABRef.current.activo && tickRef.current > (ultimoTickMusica + 500)) {
            detenerReproduccion();
            return;
        }

        animFrameRef.current = requestAnimationFrame(loop);
    }, [actualizarBoton, detenerReproduccion, logica_reproduceTono, setDireccionSinSwap]);

    const sincronizarConPista = useCallback((tickObjetivo?: number) => {
        const tickBase = typeof tickObjetivo === 'number' && !isNaN(tickObjetivo)
            ? tickObjetivo
            : tickRef.current;

        tickRef.current = tickBase;
        checkpointTickRef.current = tickBase;
        checkpointTimeRef.current = motorAudioPro.tiempoActual;
        setTickActual(Math.floor(tickBase));
    }, []);

    const reproducirSecuencia = useCallback((cancion: CancionHero) => {
        detenerReproduccion();
        
        let secuencia = cancion.secuencia || (cancion as any).secuencia_json;
        if (typeof secuencia === 'string') {
            try { secuencia = JSON.parse(secuencia); } catch (e) {}
        }
        if (!Array.isArray(secuencia)) return;

        const seqOrdenada = [...secuencia].sort((a, b) => a.tick - b.tick);
        notasOriginalesRef.current = seqOrdenada;
        
        const ultimoTick = seqOrdenada.length > 0 ? seqOrdenada[seqOrdenada.length - 1].tick + seqOrdenada[seqOrdenada.length - 1].duracion : 0;
        setTotalTicks(ultimoTick);
        
        setCancionActual(cancion);
        setReproduciendo(true);
        (pausadoRef as any).current = false;
        setPausado(false);
        
        tickRef.current = 0;
        checkpointTickRef.current = 0;
        checkpointTimeRef.current = motorAudioPro.tiempoActual;
        animFrameRef.current = requestAnimationFrame(loop);

        // 🎧 COMPENSADOR DE LATENCIA MÁGICO:
        // Si hay una pista cargada, la obligamos a sincronizarse a este momento cero real.
        (window as any).sincronizarRelojConPista = () => {
             console.log('⏰ Sincronizando inicio maestro del reproductor a la pista...');
             sincronizarConPista();
        };
    }, [detenerReproduccion, loop, sincronizarConPista]);

    const buscarTick = useCallback((tick: number) => {
        if (typeof tick !== 'number' || isNaN(tick)) return;
        
        tickRef.current = tick;
        checkpointTickRef.current = tick;
        checkpointTimeRef.current = motorAudioPro.tiempoActual;
        setTickActual(Math.floor(tick));
        
        if ((window as any).motorAudioPro) (window as any).motorAudioPro.detenerTodo();
        notasActivasRef.current.forEach((val, llave) => actualizarBoton(val.botonId || llave, 'remove', null, true));
        notasActivasRef.current.clear();
    }, [actualizarBoton]);

    const setLoopPoints = useCallback((start: number, end: number, activo: boolean) => {
        loopABRef.current = { start, end, activo };
    }, []);

    return {
        reproduciendo,
        pausado,
        cancionActual,
        tickActual,
        totalTicks,
        reproducirSecuencia,
        detenerReproduccion,
        alternarPausa,
        buscarTick,
        setLoopPoints,
        sincronizarConPista
    };
};
