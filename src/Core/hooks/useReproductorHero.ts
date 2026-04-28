import { useState, useRef, useCallback, useEffect } from 'react';
import type { NotaHero, CancionHero } from '../hero/tipos_Hero';
import { motorAudioPro } from '../audio/AudioEnginePro';

export const useReproductorHero = (
    actualizarBoton: (id: string, accion: 'add' | 'remove', instancias?: any[] | null, silencioso?: boolean) => void,
    setDireccionSinSwap: (dir: 'halar' | 'empujar') => void,
    logica_reproduceTono: (id: string, tiempo?: number, duracion?: number) => { instances: any[] } | null,
    bpmActual: number,
    onBpmCambiado?: (nuevoBpm: number) => void,
    onBeat?: (beatIndex: number) => void,
    onLoopJump?: (startTick: number) => void
) => {
    const [reproduciendo, setReproduciendo] = useState(false);
    const [pausado, setPausado] = useState(false);
    const [cancionActual, setCancionActual] = useState<CancionHero | null>(null);
    const [tickActual, setTickActual] = useState(0);
    const [totalTicks, setTotalTicks] = useState(0);

    const tickRef = useRef(0);
    const checkpointTimeRef = useRef(0);
    const checkpointTickRef = useRef(0);
    const bpmRef = useRef(bpmActual);
    const bpmTargetRef = useRef(bpmActual);

    // El reloj se sincroniza atómicamente dentro del loop, no aquí, para no producir saltos visibles de UI.
    useEffect(() => { bpmTargetRef.current = bpmActual; }, [bpmActual]);

    const pausadoRef = useRef(false);
    const animFrameRef = useRef(0);
    const loopABRef = useRef<{ start: number, end: number, activo: boolean }>({ start: 0, end: 0, activo: false });
    const rangoSeccionRef = useRef<{ inicio: number; fin: number } | null>(null);

    // Audio HTML opcional: cuando hay un mp3 de fondo, el reloj sigue audio.currentTime → cero drift.
    const audioSyncRef = useRef<HTMLAudioElement | null>(null);
    const bpmOriginalSyncRef = useRef<number>(120);
    // Hasta que el audio dispare 'playing', el RAF no debe disparar notas (evita "secuencia antes que mp3").
    const audioSyncSonandoRef = useRef<boolean>(false);
    // Listeners registrados por setAudioSync. Se guardan para poder removerlos al re-cablear (cambio de canción/bpm)
    // y evitar memory leak por listeners acumulados sobre el mismo HTMLAudio.
    const audioSyncListenersRef = useRef<{ audio: HTMLAudioElement; onPlaying: () => void; onSeeked: () => void; onPause: () => void } | null>(null);

    const setAudioSync = useCallback((audio: HTMLAudioElement | null, bpmOriginal?: number) => {
        // Limpia listeners de cualquier audio previo antes de re-cablear.
        const previo = audioSyncListenersRef.current;
        if (previo) {
            previo.audio.removeEventListener('playing', previo.onPlaying);
            previo.audio.removeEventListener('seeked', previo.onSeeked);
            previo.audio.removeEventListener('pause', previo.onPause);
            audioSyncListenersRef.current = null;
        }

        audioSyncRef.current = audio;
        // Si el audio ya está sonando al re-cablear, mantener el flag — evita un "congelado" innecesario del reloj.
        const yaSonando = !!(audio && !audio.paused && audio.readyState >= 2);
        audioSyncSonandoRef.current = yaSonando;
        if (typeof bpmOriginal === 'number' && bpmOriginal > 0) {
            bpmOriginalSyncRef.current = bpmOriginal;
        }
        if (audio) {
            const onPlaying = () => { audioSyncSonandoRef.current = true; };
            const onSeeked = () => { if (!audio.paused) audioSyncSonandoRef.current = true; };
            const onPause = () => { audioSyncSonandoRef.current = false; };
            audio.addEventListener('playing', onPlaying);
            audio.addEventListener('seeked', onSeeked);
            audio.addEventListener('pause', onPause);
            audioSyncListenersRef.current = { audio, onPlaying, onSeeked, onPause };
            // Fallback: si 'playing' no llega en 1500ms, soltar el RAF igual.
            setTimeout(() => {
                if (audioSyncRef.current === audio && !audioSyncSonandoRef.current) {
                    audioSyncSonandoRef.current = true;
                }
            }, 1500);
        }
    }, []);

    const onBpmCambiadoRef = useRef(onBpmCambiado);
    const onBeatRef = useRef(onBeat);
    const onLoopJumpRef = useRef(onLoopJump);
    const lastBeatIndexRef = useRef(-1);

    useEffect(() => { onBpmCambiadoRef.current = onBpmCambiado; }, [onBpmCambiado]);
    useEffect(() => { onBeatRef.current = onBeat; }, [onBeat]);
    useEffect(() => { onLoopJumpRef.current = onLoopJump; }, [onLoopJump]);

    const notasOriginalesRef = useRef<NotaHero[]>([]);
    const notasActivasRef = useRef<Map<string, { endTimeTick: number, instancias: any[], botonId: string }>>(new Map());

    const detenerReproduccion = useCallback(() => {
        setReproduciendo(false);
        setPausado(false);
        (pausadoRef as any).current = false;

        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;

        if ((window as any).motorAudioPro) (window as any).motorAudioPro.detenerTodo();

        notasActivasRef.current.forEach((val, info) => {
            actualizarBoton(val.botonId || info, 'remove', null, false);
        });
        notasActivasRef.current.clear();

        tickRef.current = 0;
        checkpointTickRef.current = 0;
        checkpointTimeRef.current = 0;
        setTickActual(0);
        rangoSeccionRef.current = null;
        audioSyncRef.current = null;
    }, [actualizarBoton]);

    const alternarPausa = useCallback(() => {
        if (!reproduciendo) return;
        const nuevoEstado = !(pausadoRef as any).current;
        (pausadoRef as any).current = nuevoEstado;
        setPausado(nuevoEstado);

        if (nuevoEstado) {
            const ahora = motorAudioPro.tiempoActual;
            const resolucion = 192;
            if (checkpointTimeRef.current > 0) {
                const ticksDesdeUltimoCheckpoint = (ahora - checkpointTimeRef.current) * (bpmRef.current / 60) * resolucion;
                checkpointTickRef.current += ticksDesdeUltimoCheckpoint;
            }
            checkpointTimeRef.current = ahora;
            if ((window as any).motorAudioPro) (window as any).motorAudioPro.detenerTodo();
        } else {
            checkpointTimeRef.current = motorAudioPro.tiempoActual;
        }
    }, [reproduciendo]);

    const loop = useCallback(() => {
        if ((pausadoRef as any).current) {
            animFrameRef.current = requestAnimationFrame(loop);
            return;
        }

        const ahora = motorAudioPro.tiempoActual;
        const resolucion = 192;

        // BPM atómico: re-checkpoint antes de mover el bpmRef, así no se ve un salto en UI.
        if (bpmRef.current !== bpmTargetRef.current) {
            if (checkpointTimeRef.current > 0) {
                const ticksAcumulados = (ahora - checkpointTimeRef.current) * (bpmRef.current / 60) * resolucion;
                checkpointTickRef.current += ticksAcumulados;
            }
            checkpointTimeRef.current = ahora;
            bpmRef.current = bpmTargetRef.current;
            onBpmCambiadoRef.current?.(bpmRef.current);
        }

        // Tick: (1) audio sonando → sigue audio.currentTime; (2) audio pendiente → reloj congelado; (3) sin audio → AudioContext.
        const audioSync = audioSyncRef.current;
        const tieneAudioSync = !!audioSync;
        const audioActivo = audioSyncSonandoRef.current
            && !!(audioSync && !audioSync.paused && audioSync.readyState >= 2);

        let nuevoTickAbsoluto: number;
        if (audioActivo) {
            const bpmRef_orig = bpmOriginalSyncRef.current || bpmRef.current;
            nuevoTickAbsoluto = audioSync!.currentTime * (bpmRef_orig / 60) * resolucion;
            checkpointTickRef.current = nuevoTickAbsoluto;
            checkpointTimeRef.current = ahora;
        } else if (tieneAudioSync) {
            nuevoTickAbsoluto = tickRef.current;
            checkpointTickRef.current = nuevoTickAbsoluto;
            checkpointTimeRef.current = ahora;
        } else {
            const ticksPorSegundo = (bpmRef.current / 60) * resolucion;
            const ticksDesdeCheckpoint = (ahora - checkpointTimeRef.current) * ticksPorSegundo;
            nuevoTickAbsoluto = checkpointTickRef.current + ticksDesdeCheckpoint;
        }
        const deltaTicksFrame = nuevoTickAbsoluto - tickRef.current;
        tickRef.current = nuevoTickAbsoluto;

        if (onBeatRef.current) {
            const beatIndex = Math.floor(tickRef.current / resolucion);
            if (beatIndex > lastBeatIndexRef.current) {
                lastBeatIndexRef.current = beatIndex;
                onBeatRef.current(beatIndex);
            }
        }

        if (loopABRef.current.activo && tickRef.current >= loopABRef.current.end) {
            tickRef.current = loopABRef.current.start;
            checkpointTickRef.current = loopABRef.current.start;
            checkpointTimeRef.current = ahora;
            onLoopJumpRef.current?.(loopABRef.current.start);

            notasActivasRef.current.forEach((val, llave) => actualizarBoton(val.botonId || llave, 'remove', null, true));
            notasActivasRef.current.clear();
            if ((window as any).motorAudioPro) (window as any).motorAudioPro.detenerTodo();
            animFrameRef.current = requestAnimationFrame(loop);
            return;
        }

        notasActivasRef.current.forEach((info, llaveUnica) => {
            if (tickRef.current >= info.endTimeTick) {
                // Detener el audio manualmente permite elasticidad si cambia el BPM mientras la nota suena.
                if (info.instancias && info.instancias.length > 0) {
                    info.instancias.forEach((inst: any) => {
                        if ((window as any).motorAudioPro) {
                            (window as any).motorAudioPro.detener(inst, 0.05);
                        }
                    });
                }
                actualizarBoton(info.botonId, 'remove', null, false);
                notasActivasRef.current.delete(llaveUnica);
            }
        });

        notasOriginalesRef.current.forEach(nota => {
            if (nota.tick >= tickRef.current - deltaTicksFrame && nota.tick < tickRef.current) {
                const llaveUnica = `${nota.botonId}_${nota.tick}`;
                if (!notasActivasRef.current.has(llaveUnica)) {
                    setDireccionSinSwap(nota.fuelle === 'abriendo' ? 'halar' : 'empujar');
                    // Disparo sin duración programada: la nota dura mientras el BPM fluya, hasta su tick de cierre.
                    const result = logica_reproduceTono(nota.botonId);
                    const instancias = result?.instances || [];
                    actualizarBoton(nota.botonId, 'add', instancias, false);
                    notasActivasRef.current.set(llaveUnica, {
                        endTimeTick: nota.tick + nota.duracion,
                        instancias,
                        botonId: nota.botonId
                    });
                }
            }
        });

        setTickActual(Math.floor(tickRef.current));

        const rango = rangoSeccionRef.current;
        if (rango && !loopABRef.current.activo && tickRef.current > rango.fin) {
            detenerReproduccion();
            return;
        }

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

    const reproducirSecuencia = useCallback((
        cancion: CancionHero,
        opciones?: {
            rangoTicks?: { inicio: number; fin: number } | null;
            // Tick exacto donde arrancar el reloj. Útil cuando el caller ya esperó
            // el evento 'playing' del MP3 y quiere alinear el tick a la posición
            // real del audio (audio.currentTime * factor). Si se pasa, sustituye
            // a rango.inicio como punto de arranque, pero rango.fin sigue activo.
            tickInicialOverride?: number | null;
        }
    ) => {
        detenerReproduccion();

        let secuencia = cancion.secuencia || (cancion as any).secuencia_json;
        if (typeof secuencia === 'string') {
            try { secuencia = JSON.parse(secuencia); } catch (e) {}
        }
        if (!Array.isArray(secuencia)) return;

        let seqOrdenada = [...secuencia].sort((a, b) => a.tick - b.tick);

        // Con metrónomo: alinear primer ataque al beat más cercano (todas las notas se desplazan por el mismo offset, conserva feel).
        if ((cancion as any).usoMetronomo && seqOrdenada.length > 0) {
            const resolucion = (cancion as any).resolucion || 192;
            const primerTick = seqOrdenada[0].tick;
            const beatMasCercano = Math.round(primerTick / resolucion) * resolucion;
            const offset = primerTick - beatMasCercano;
            if (Math.abs(offset) > 2 && Math.abs(offset) < resolucion) {
                seqOrdenada = seqOrdenada.map(n => ({ ...n, tick: n.tick - offset }));
            }
        }
        notasOriginalesRef.current = seqOrdenada;

        const ultimoTick = seqOrdenada.length > 0 ? seqOrdenada[seqOrdenada.length - 1].tick + seqOrdenada[seqOrdenada.length - 1].duracion : 0;
        setTotalTicks(ultimoTick);

        // Rango de sección opcional: si presente, arranca en `inicio` y detiene al cruzar `fin`.
        const rango = opciones?.rangoTicks ?? null;
        rangoSeccionRef.current = rango && rango.fin > rango.inicio ? { inicio: rango.inicio, fin: rango.fin } : null;
        const override = opciones?.tickInicialOverride;
        const tickInicial = (typeof override === 'number' && !isNaN(override) && override >= 0)
            ? override
            : (rangoSeccionRef.current ? rangoSeccionRef.current.inicio : 0);

        setCancionActual(cancion);
        setReproduciendo(true);
        (pausadoRef as any).current = false;
        setPausado(false);

        const bpmCancion = (cancion as any).bpm;
        if (typeof bpmCancion === 'number' && bpmCancion > 0) { bpmRef.current = bpmCancion; bpmTargetRef.current = bpmCancion; }

        tickRef.current = tickInicial;
        checkpointTickRef.current = tickInicial;
        checkpointTimeRef.current = motorAudioPro.tiempoActual;
        const resolucion = (cancion as any).resolucion || 192;
        lastBeatIndexRef.current = tickInicial > 0 ? Math.floor(tickInicial / resolucion) - 1 : -1;
        setTickActual(Math.floor(tickInicial));
        animFrameRef.current = requestAnimationFrame(loop);

        // Compensador de latencia: cuando el MP3 dispara 'playing' tras un seek, alinea el reloj a la posición real.
        (window as any).sincronizarRelojConPista = (tickEspecifico?: number) => {
             const tickFinal = typeof tickEspecifico === 'number' && !isNaN(tickEspecifico)
                 ? tickEspecifico
                 : tickInicial;
             sincronizarConPista(tickFinal);
             notasActivasRef.current.forEach((val, llave) => actualizarBoton(val.botonId || llave, 'remove', null, true));
             notasActivasRef.current.clear();
        };
    }, [actualizarBoton, detenerReproduccion, loop, sincronizarConPista]);

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
        sincronizarConPista,
        setAudioSync,
    };
};
