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
    // Resync periódico contra audio.currentTime para combatir drift acumulativo entre AudioContext
    // y sample-clock del HTMLAudio. Conservador: cada 2s, sólo si el drift es notorio (>25 ticks
    // ≈125ms) y siempre que el audio esté establemente sonando (no en mitad de un seek).
    const ultimoResyncTimeRef = useRef<number>(0);
    // Timestamp del último seek (buscarTick). Se usa como guard: durante 300ms post-seek el resync
    // se inhibe para que el audio termine de estabilizarse antes de comparar. Sin esto, el resync
    // podía leer audio.currentTime stale tras un backward seek y "corregir" hacia un valor erróneo.
    const ultimoBuscarTickTimeRef = useRef<number>(-Infinity);
    // Throttle del setTickActual: actualizamos UI a ~30fps. El tickRef sigue 60fps (sample-accurate
    // para audio). Reduce re-renders de PuenteNotas + useEffects consumidores a la mitad.
    // 30fps visual es perceptualmente equivalente a 60fps (cine = 24fps); no se ve "salto" en
    // las notas. La detección de notas perdidas (ventana ~125ms) sigue con 3+ samples por ventana.
    const ultimoTickActualUIRef = useRef<number>(0);

    // Fuente de audio externa (HTMLAudioElement o ReproductorMP3 — ambos tienen la misma API mínima:
    // currentTime, paused, readyState, playbackRate, addEventListener/removeEventListener para 'playing'/'pause'/'seeked').
    // Cuando hay audio enganchado, el RAF lo usa como reloj → cero drift entre notas y MP3.
    const audioSyncRef = useRef<any | null>(null);
    const bpmOriginalSyncRef = useRef<number>(120);
    // Hasta que el audio dispare 'playing', el RAF no debe disparar notas (evita "secuencia antes que mp3").
    const audioSyncSonandoRef = useRef<boolean>(false);
    // Checkpoint capturado al 'playing': posición del audio + AudioContext.currentTime de ese momento.
    // El RAF calcula la posición virtual lineal desde estos checkpoints. Si el audio es ReproductorMP3,
    // su .currentTime YA es continuo (calculado desde AudioContext) — leer directo es equivalente.
    const audioStartContextRef = useRef<number>(0);
    const audioStartPositionRef = useRef<number>(0);
    // Listeners registrados por setAudioSync.
    const audioSyncListenersRef = useRef<{ audio: any; onPlaying: () => void; onSeeked: () => void; onPause: () => void } | null>(null);

    // (Refs del ancla eliminados — el RAF ahora lee audio.currentTime directo, sin precomputo
    // de instante futuro. Patrón ModoMaestro/Competencia: simple, sample-accurate por audio,
    // sin race conditions. arrancarReproduccionAnclada se mantiene como API pero internamente
    // solo cablea setAudioSync.)

    const setAudioSync = useCallback((audio: any | null, bpmOriginal?: number) => {
        // Limpia listeners de cualquier audio previo antes de re-cablear.
        const previo = audioSyncListenersRef.current;
        if (previo) {
            previo.audio.removeEventListener('playing', previo.onPlaying);
            previo.audio.removeEventListener('seeked', previo.onSeeked);
            previo.audio.removeEventListener('pause', previo.onPause);
            audioSyncListenersRef.current = null;
        }

        audioSyncRef.current = audio;
        // Si el audio ya está sonando al re-cablear, capturar el checkpoint INMEDIATO.
        const yaSonando = !!(audio && !audio.paused && audio.readyState >= 2);
        audioSyncSonandoRef.current = yaSonando;
        if (yaSonando && audio) {
            audioStartContextRef.current = motorAudioPro.tiempoActual;
            audioStartPositionRef.current = audio.currentTime;
        }
        if (typeof bpmOriginal === 'number' && bpmOriginal > 0) {
            bpmOriginalSyncRef.current = bpmOriginal;
        }
        if (audio) {
            // 'playing' / 'seeked' resincronizan el checkpoint a la posición REAL del audio.
            // Compensa la latencia de arranque (30-150ms entre play() y el primer sample sonado)
            // y el race del seek (audio.currentTime stale durante el seek/buffering).
            // NO escuchamos 'pause': muchos browsers disparan 'pause' interno durante backward seeks,
            // lo que apagaba audioSyncSonandoRef y mataba el resync periódico para siempre. En su
            // lugar, el resync lee audio.paused directamente cada vuelta (tiempo real, sin estado stale).
            const capturarCheckpoint = () => {
                audioStartContextRef.current = motorAudioPro.tiempoActual;
                audioStartPositionRef.current = audio.currentTime;
                audioSyncSonandoRef.current = true;
                const ct = audio.currentTime;
                if (isFinite(ct) && ct >= 0) {
                    const bpmOrig = bpmOriginalSyncRef.current || 120;
                    const tickFromAudio = ct * (bpmOrig / 60) * 192;
                    if (isFinite(tickFromAudio) && tickFromAudio >= 0) {
                        tickRef.current = tickFromAudio;
                        checkpointTickRef.current = tickFromAudio;
                        checkpointTimeRef.current = motorAudioPro.tiempoActual;
                    }
                }
            };
            const onPlaying = capturarCheckpoint;
            const onSeeked = () => { if (!audio.paused) capturarCheckpoint(); };
            const onPause = () => { /* no-op intencional: ver comentario arriba */ };
            audio.addEventListener('playing', onPlaying);
            audio.addEventListener('seeked', onSeeked);
            audio.addEventListener('pause', onPause);
            audioSyncListenersRef.current = { audio, onPlaying, onSeeked, onPause };
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

        // Detener cada instancia explícitamente ANTES de detenerTodo: sin esto, notas que se acaban de disparar
        // (race con detenerTodo) quedan sonando porque su tono nunca recibe un release individual.
        notasActivasRef.current.forEach((val) => {
            if (val.instancias && val.instancias.length > 0) {
                val.instancias.forEach((inst: any) => {
                    if ((window as any).motorAudioPro) {
                        try { (window as any).motorAudioPro.detener(inst, 0.05); } catch (_) {}
                    }
                });
            }
        });

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

        const ahora = motorAudioPro.tiempoActual;
        const resolucion = 192;

        if (nuevoEstado) {
            if (checkpointTimeRef.current > 0) {
                const ticksDesdeUltimoCheckpoint = (ahora - checkpointTimeRef.current) * (bpmRef.current / 60) * resolucion;
                checkpointTickRef.current += ticksDesdeUltimoCheckpoint;
            }
            checkpointTimeRef.current = ahora;
            if ((window as any).motorAudioPro) (window as any).motorAudioPro.detenerTodo();
        } else {
            checkpointTimeRef.current = ahora;
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

        // PATRÓN: AudioContext math (igual que ModoMaestroSolo). Los eventos 'playing'/'seeked'
        // del HTMLAudio resincronizan el checkpoint en momentos discretos. Entre eventos, el tick
        // avanza determinísticamente. Mientras audio.seeking === true (puede durar segundos si el
        // seek requiere bufferear nuevo audio — típico en seek atrás lejos), CONGELAMOS el tick:
        // sin esto el RAF avanza linealmente y al despertar onSeeked tira tickRef hacia atrás a la
        // posición real → playhead salta y se disparan notas equivocadas.
        const ticksPorSegundo = (bpmRef.current / 60) * resolucion;
        const audioSync = audioSyncRef.current;
        const audioSeeking = !!(audioSync && audioSync.seeking);

        let nuevoTickAbsoluto: number;
        if (audioSeeking) {
            // Tick congelado. checkpointTime avanza para que al despertar el delta sea ~0 y no
            // se acumule "tiempo perdido" mientras el HTMLAudio buscaba/buffereaba.
            nuevoTickAbsoluto = checkpointTickRef.current;
            checkpointTimeRef.current = ahora;
        } else {
            // Resync periódico anti-drift. Conservador para evitar saltos visibles del playhead:
            //   - Cada 2s (no 1s — menor frecuencia, menos saltos cosméticos).
            //   - 300ms desde el último buscarTick (que audio.currentTime se estabilice tras el seek).
            //   - Drift > 25 ticks (~125ms — solo cuando es realmente perceptible).
            //   - Drift < 80 ticks (sobre eso podría ser bug, no drift residual).
            //   - Solo corregir hacia adelante (audio adelante del RAF). Saltar atrás re-dispara notas.
            //   - Lee audio.paused EN VIVO en vez de audioSyncSonandoRef (que algunos backward seeks
            //     dejaban apagado para siempre por 'pause' interno del browser).
            if (
                audioSync &&
                audioSync.readyState >= 2 &&
                !audioSync.paused &&
                audioSync.currentTime > 0.05 &&
                isFinite(audioSync.currentTime) &&
                (ahora - ultimoResyncTimeRef.current) > 2.0 &&
                (ahora - ultimoBuscarTickTimeRef.current) > 0.3
            ) {
                const bpmOrig = bpmOriginalSyncRef.current || bpmRef.current;
                const tickFromAudio = audioSync.currentTime * (bpmOrig / 60) * resolucion;
                if (isFinite(tickFromAudio) && tickFromAudio >= 0) {
                    const driftAbs = Math.abs(tickFromAudio - tickRef.current);
                    if (driftAbs > 25 && driftAbs < 80 && tickFromAudio > tickRef.current) {
                        checkpointTickRef.current = tickFromAudio;
                        checkpointTimeRef.current = ahora;
                        tickRef.current = tickFromAudio;
                    }
                }
                ultimoResyncTimeRef.current = ahora;
            }

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
            // Gate por rango de sección: si hay una sección activa, NO disparamos audio del maestro para
            // notas anteriores a su tickInicio. Esto permite que la reproducción arranque durante el lead-in
            // (tick avanzando, PuenteNotas mostrando notas que se acercan) SIN que suenen las notas de
            // secciones previas que el alumno no quiere escuchar.
            const rangoSeccion = rangoSeccionRef.current;
            if (rangoSeccion && nota.tick < rangoSeccion.inicio) return;

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

        // Throttle UI a ~30fps. tickRef sigue actualizado cada frame (audio sample-accurate);
        // solo setTickActual es throttled. PuenteNotas y useEffects consumidores re-renderizan
        // a 30Hz en vez de 60Hz → -50% trabajo React sin perdida visual perceptible.
        if ((ahora - ultimoTickActualUIRef.current) > 0.033) {
            setTickActual(Math.floor(tickRef.current));
            ultimoTickActualUIRef.current = ahora;
        }

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

        // Snap-to-beat: SOLO cuando la canción NO tiene MP3 de fondo. Con audio, los ticks ya están anclados
        // a audio.currentTime (saved durante grabación con grabador anclado al audio), así que CUALQUIER shift
        // aquí desincroniza secuencia vs MP3 → notas adelantadas/atrasadas vs el audio que escucha el alumno.
        // Es el bug que se manifestaba al refrescar la página o al desplazar la BarraTimeline: el modal preview
        // no llamaba a este reproductor, pero la BarraTimeline / Competencia sí → shift aplicado → desincrono.
        const tieneAudioFondo = !!((cancion as any).audio_fondo_url || (cancion as any).audioFondoUrl);
        if ((cancion as any).usoMetronomo && !tieneAudioFondo && seqOrdenada.length > 0) {
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

        // CRÍTICO: NO sobreescribir bpmRef con cancion.bpm. El transport (bpmActual=hero.bpm) puede ser distinto
        // de cancion.bpm (slow practice). Si forzamos bpmRef = cancion.bpm, el RAF avanza al tempo original
        // mientras el audio.playbackRate avanza a transport/original → DRIFT permanente ("va corrida").
        // bpmTargetRef sigue bpmActual via useEffect; lo usamos como fuente de verdad y dejamos que el RAF
        // converja a ese valor en el próximo frame. Para el primer frame, alineamos bpmRef explícitamente.
        bpmRef.current = bpmTargetRef.current;

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

        const ahora = motorAudioPro.tiempoActual;
        tickRef.current = tick;
        checkpointTickRef.current = tick;
        checkpointTimeRef.current = ahora;
        ultimoBuscarTickTimeRef.current = ahora;
        setTickActual(Math.floor(tick));

        // Si hay audio enganchado, seek SÍNCRONO aquí. Sin esto el RAF lee audio.currentTime (vieja)
        // en el siguiente frame y "snap back" al tick anterior — el scrub no toma efecto hasta que
        // el useEffect de useAudioFondoPracticaLibre seekea el audio (1+ frames después).
        const audioSync = audioSyncRef.current;
        if (audioSync) {
            const bpmOrig = bpmOriginalSyncRef.current || 120;
            const segundosObjetivo = (tick / 192) * (60 / bpmOrig);
            try { audioSync.currentTime = Math.max(0, segundosObjetivo); } catch (_) {}
        }

        // Mismo patrón que detenerReproduccion: detener instancias explícitamente antes del detenerTodo.
        notasActivasRef.current.forEach((val) => {
            if (val.instancias && val.instancias.length > 0) {
                val.instancias.forEach((inst: any) => {
                    if ((window as any).motorAudioPro) {
                        try { (window as any).motorAudioPro.detener(inst, 0.05); } catch (_) {}
                    }
                });
            }
        });

        if ((window as any).motorAudioPro) (window as any).motorAudioPro.detenerTodo();
        notasActivasRef.current.forEach((val, llave) => actualizarBoton(val.botonId || llave, 'remove', null, true));
        notasActivasRef.current.clear();
    }, [actualizarBoton]);

    const setLoopPoints = useCallback((start: number, end: number, activo: boolean) => {
        loopABRef.current = { start, end, activo };
    }, []);

    /**
     * NUEVO camino sample-accurate (admin/practica). Recibe la canción a tocar + un "anchor" producido por
     * useAudioFondoPracticaLibre.iniciarReproduccionAnclada — el caller programó el audio para arrancar
     * EN anchor.contextStartTime con offset anchor.offsetSeg. Aquí simplemente armamos el RAF para que
     * compute el tick desde la misma referencia temporal: cero race con eventos asíncronos del audio.
     *
     * Diferencia clave vs reproducirSecuencia + setAudioSync: no leemos audio.currentTime ni esperamos
     * 'playing'. La fórmula del tick es pura aritmética sobre AudioContext.currentTime, que es la misma
     * referencia con la que el AudioBufferSourceNode fue programado → sample-accurate determinístico.
     */
    const arrancarReproduccionAnclada = useCallback((
        cancion: CancionHero,
        anchor: { contextStartTime: number; tickInicialReal: number; bpmOriginal: number; audio: any },
    ) => {
        detenerReproduccion();

        let secuencia: any = (cancion as any).secuencia || (cancion as any).secuencia_json;
        if (typeof secuencia === 'string') {
            try { secuencia = JSON.parse(secuencia); } catch (_) {}
        }
        if (!Array.isArray(secuencia)) return;

        const seqOrdenada = [...secuencia].sort((a, b) => a.tick - b.tick);
        notasOriginalesRef.current = seqOrdenada;
        const ultimoTick = seqOrdenada.length > 0
            ? seqOrdenada[seqOrdenada.length - 1].tick + seqOrdenada[seqOrdenada.length - 1].duracion
            : 0;
        setTotalTicks(ultimoTick);
        rangoSeccionRef.current = null;

        // Cablear el audio al RAF — única fuente de verdad para el tick (lee audio.currentTime cada
        // frame). Anchor.contextStartTime ya no se usa: el RAF deriva el tick directamente del audio,
        // sin precomputo. Esto es el patrón ModoMaestro/Competencia: simple, sin race, sin ancla.
        setAudioSync(anchor.audio, anchor.bpmOriginal);

        bpmRef.current = bpmTargetRef.current;
        tickRef.current = anchor.tickInicialReal;
        checkpointTickRef.current = anchor.tickInicialReal;
        checkpointTimeRef.current = motorAudioPro.tiempoActual;
        const resolucion = (cancion as any).resolucion || 192;
        lastBeatIndexRef.current = anchor.tickInicialReal > 0
            ? Math.floor(anchor.tickInicialReal / resolucion) - 1
            : -1;
        setTickActual(Math.floor(anchor.tickInicialReal));
        setCancionActual(cancion);
        setReproduciendo(true);
        (pausadoRef as any).current = false;
        setPausado(false);

        animFrameRef.current = requestAnimationFrame(loop);
    }, [detenerReproduccion, loop, setAudioSync]);

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
        arrancarReproduccionAnclada,
    };
};
