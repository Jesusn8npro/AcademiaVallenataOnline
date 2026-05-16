import { useCallback, useEffect, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';

import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';
import { useReproductorHero } from '../../../Core/hooks/useReproductorHero';
import { obtenerGrabacion } from '../../../servicios/grabacionesHeroService';
import { useMetronomo } from './useMetronomo';

// Tipos minimos de los hooks externos que necesitamos. Se mantienen como
// alias laxos para no acoplar este hook a los detalles internos de los hooks
// de loops/metronomo (todos son ducktyped en el caller).
type LoopsApi = {
    pistaActiva: any;
    detener: () => void;
};
type MetronomoApi = ReturnType<typeof useMetronomo>;
type LogicaApi = any;

interface ReplayParams {
    logica: LogicaApi;
    loops: LoopsApi;
    metronomoVivo: MetronomoApi;
    isLandscape: boolean;
    disenoCargado: boolean;
    audioContextIniciadoRef: React.MutableRefObject<boolean>;
    setAudioListo: (v: boolean) => void;
    reproducirIdParam: string | null;
    searchParams: URLSearchParams;
    setSearchParams: (params: URLSearchParams, opts?: { replace?: boolean }) => void;
    navigate: NavigateFunction;
}

/**
 * Replay inline para el simulador: reusa la `logica` (acordeon visual) +
 * useReproductorHero. Maneja audio de fondo (Web Audio sample-accurate),
 * metronomo de replay, pause/resume sincronizado, saltos +/-5s, y el flujo
 * "vino de Grabaciones" via ?reproducir=<id> (overlay + countdown + opcion
 * de quedarse).
 */
export const useReplaySimulador = ({
    logica,
    loops,
    metronomoVivo,
    isLandscape,
    disenoCargado,
    audioContextIniciadoRef,
    setAudioListo,
    reproducirIdParam,
    searchParams,
    setSearchParams,
    navigate,
}: ReplayParams) => {
    const [enReproduccion, setEnReproduccion] = useState(false);
    const [replayConMetronomo, setReplayConMetronomo] = useState(false);
    const [bpmReproduccion, setBpmReproduccion] = useState(120);
    const [resolucionReproduccion, setResolucionReproduccion] = useState(192);

    // Audio de fondo del replay inline via Web Audio API. iOS Safari rechaza
    // HTMLAudio + Supabase Storage (Content-Type incorrecto) — el unico camino
    // confiable es decodificar el MP3 nosotros y reproducirlo via AudioBuffer.
    // Mantenemos el buffer + gain + el source actual + estado de offset para
    // pause/resume (los AudioBufferSourceNode no se pueden reusar tras stop).
    const audioFondoReplayRef = useRef<{
        buffer: AudioBuffer;
        gain: GainNode;
        source: AudioBufferSourceNode | null;
        startContextTime: number;
        offsetActual: number;
        velocidad: number;
    } | null>(null);

    const reproductor = useReproductorHero(
        logica.actualizarBotonActivo,
        logica.setDireccionSinSwap,
        logica.reproduceTono,
        bpmReproduccion,
    );

    // Metronomo de REPLAY: instancia independiente para no pisar el metronomo
    // vivo del usuario.
    const metronomoReplay = useMetronomo(120);

    // Detectar fin de reproduccion (el reproductor cambia reproduciendo a false).
    useEffect(() => {
        if (enReproduccion && !reproductor.reproduciendo) {
            setEnReproduccion(false);
        }
    }, [enReproduccion, reproductor.reproduciendo]);

    // ─── Estado del flujo "vino de Grabaciones" ─────────────────────────────
    const [vinoDeGrabaciones, setVinoDeGrabaciones] = useState(false);
    const [autoArrancado, setAutoArrancado] = useState(false);
    const [countdownVolver, setCountdownVolver] = useState<number | null>(null);
    const [usuarioEligioQuedarse, setUsuarioEligioQuedarse] = useState(false);

    // Tiempo (performance.now) en que arranco el replay y duracion total de
    // la grabacion en ms. Sirve para esperar a que termine TODA la grabacion
    // (no solo la ultima nota) antes de mostrar el countdown.
    const replayStartTimeRef = useRef<number | null>(null);
    const duracionReplayMsRef = useRef<number | null>(null);
    const finReplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ref siempre fresca a `logica` (que es un objeto que React recrea en
    // cada render). La usamos en reproducirGrabacion para chequear/esperar
    // a que tonalidad+samples se hayan aplicado tras el setTonalidadSeleccionada.
    const logicaRef = useRef(logica);
    logicaRef.current = logica;

    const detenerAudioFondoReplay = useCallback(() => {
        const data = audioFondoReplayRef.current;
        if (data) {
            if (data.source) {
                try { data.source.stop(); } catch { /* noop */ }
                try { data.source.disconnect(); } catch { /* noop */ }
            }
            try { data.gain.disconnect(); } catch { /* noop */ }
            audioFondoReplayRef.current = null;
        }
    }, []);

    const reproducirGrabacion = useCallback(async (id: string) => {
        try {
            const g: any = await obtenerGrabacion(id);
            if (!g) return;
            const sec = g.secuencia_grabada || g.secuencia || [];
            if (!Array.isArray(sec) || sec.length === 0) return;
            // Capturamos la duracion real (en ms) para saber cuando "termino"
            // de verdad — no solo cuando suena la ultima nota.
            duracionReplayMsRef.current = typeof g.duracion_ms === 'number' && g.duracion_ms > 0 ? g.duracion_ms : null;
            if (finReplayTimerRef.current) {
                clearTimeout(finReplayTimerRef.current);
                finReplayTimerRef.current = null;
            }
            // Si hay un loop sonando, lo paramos antes (no queremos
            // dos audios encimados si la grabacion tambien trae uno).
            if (loops.pistaActiva) loops.detener();
            detenerAudioFondoReplay();

            // Si el usuario tenia el metronomo en vivo prendido, lo apagamos
            // para no encimar con el del replay.
            if (metronomoVivo.activo) metronomoVivo.detener();

            // Aplicar tonalidad de la grabacion para que los pitos coincidan.
            if (g.tonalidad) logica.setTonalidadSeleccionada(g.tonalidad);
            const bpm = g.bpm || 120;
            const resolucion = g.resolucion || 192;
            setBpmReproduccion(bpm);
            setResolucionReproduccion(resolucion);
            const cancionFake = { secuencia: sec, bpm, resolucion } as any;
            await motorAudioPro.activarContexto();

            // ─── Precarga de samples antes de disparar la secuencia ─────────
            // Sin este paso, las notas se MARCAN visualmente pero NO SUENAN:
            // setTonalidadSeleccionada dispara una recarga de samples interna
            // (useEffect con debounce 80ms en useLogicaAcordeon). Si
            // reproducirSecuencia corre antes de que el banco se llene,
            // motorAudioPro.reproducir devuelve null silencioso.
            const tonalidadObjetivo = g.tonalidad || logicaRef.current.tonalidadSeleccionada;
            const tInicio = performance.now();
            while (
                logicaRef.current.tonalidadSeleccionada !== tonalidadObjetivo &&
                performance.now() - tInicio < 1500
            ) {
                await new Promise((r) => setTimeout(r, 30));
            }
            // Damos otro pequeno respiro al useEffect interno que carga samples
            // (debounce 80ms + algun fetch). Evita race con motorAudio si la red es lenta.
            await new Promise((r) => setTimeout(r, 200));

            // Precarga manual de los samples de los botones del recording.
            // motorAudioPro.cargarSonidoEnBanco es idempotente (cache interno).
            try {
                const obtenerRutas = (logicaRef.current as any).obtenerRutasAudio;
                if (typeof obtenerRutas === 'function') {
                    const botonIdsUnicos = Array.from(new Set(sec.map((n: any) => n.botonId).filter(Boolean)));
                    const rutasUnicas = new Map<string, string>();
                    botonIdsUnicos.forEach((botonId: any) => {
                        const rutas: string[] = obtenerRutas(botonId) || [];
                        rutas.forEach((rutaRaw: string) => {
                            const ruta = rutaRaw.startsWith('pitch:') ? rutaRaw.split('|')[1] : rutaRaw;
                            const rutaFinal = ruta.startsWith('http') || ruta.startsWith('/') ? ruta : `/${ruta}`;
                            rutasUnicas.set(ruta, rutaFinal);
                        });
                    });
                    if (rutasUnicas.size > 0) {
                        await Promise.allSettled(
                            Array.from(rutasUnicas.entries()).map(([ruta, rutaFinal]) =>
                                motorAudioPro.cargarSonidoEnBanco(
                                    logicaRef.current.instrumentoId,
                                    ruta,
                                    rutaFinal,
                                ),
                            ),
                        );
                    }
                }
            } catch { /* precarga manual fallo — las notas igual se reproduciran */ }

            // Audio de fondo: si la grabacion guardo una pista, la cargamos
            // con el OFFSET correcto (la posicion en que estaba el loop cuando
            // el alumno empezo a grabar) y la arrancamos en sync con las notas.
            const meta = g.metadata || {};
            const audioFondoUrl: string | null = meta.audio_fondo_url || null;
            const metMeta = meta.metronomo || null;

            // Aplicar config del metronomo de la grabacion al instance de replay.
            // El arranque (setActivo) lo maneja el effect que lo sincroniza con
            // reproductor.reproduciendo + !pausado.
            if (metMeta) {
                if (typeof metMeta.bpm === 'number') metronomoReplay.setBpm(metMeta.bpm);
                if (typeof metMeta.compas === 'number') metronomoReplay.setCompas(metMeta.compas);
                if (typeof metMeta.subdivision === 'number') metronomoReplay.setSubdivision(metMeta.subdivision);
                if (typeof metMeta.volumen === 'number') metronomoReplay.setVolumen(metMeta.volumen);
                if (typeof metMeta.sonido === 'string') metronomoReplay.setSonidoEfecto(metMeta.sonido);
                setReplayConMetronomo(true);
            } else {
                setReplayConMetronomo(false);
            }
            if (audioFondoUrl) {
                const volumenGuardado = typeof meta.pista_volumen === 'number' ? meta.pista_volumen : 0.85;
                const velocidadGuardada = typeof meta.pista_velocidad === 'number' ? meta.pista_velocidad : 1.0;
                const offset = typeof meta.pista_offset_segundos === 'number' ? meta.pista_offset_segundos : 0;

                // Web Audio: descargamos + decodificamos el MP3 (HTMLAudio falla
                // en iOS por el Content-Type incorrecto de Supabase). decodeAudioData
                // sample-accurate -> el seek al offset es exacto, sin events ni jitter.
                try {
                    const response = await fetch(audioFondoUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const arrayBuf = await response.arrayBuffer();
                    const ctx = motorAudioPro.contextoAudio;
                    const buffer = await ctx.decodeAudioData(arrayBuf);

                    if (ctx.state === 'suspended') {
                        try { await ctx.resume(); } catch { /* noop */ }
                    }

                    const gain = ctx.createGain();
                    gain.gain.value = volumenGuardado;
                    gain.connect(ctx.destination);

                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.loop = true;
                    source.playbackRate.value = velocidadGuardada;
                    source.connect(gain);

                    // Arranque sample-accurate: source.start(when, offset) en el
                    // mismo instante que reproductor.reproducirSecuencia.
                    const offsetSeguro = isFinite(offset) && offset > 0
                        ? offset % buffer.duration
                        : 0;
                    source.start(0, offsetSeguro);

                    audioFondoReplayRef.current = {
                        buffer,
                        gain,
                        source,
                        startContextTime: ctx.currentTime,
                        offsetActual: offsetSeguro,
                        velocidad: velocidadGuardada,
                    };

                    // Notas arrancan SINCRONO con la fuente -> tick 0 == offset.
                    replayStartTimeRef.current = performance.now();
                    reproductor.reproducirSecuencia(cancionFake);
                    setEnReproduccion(true);
                    return;
                } catch {
                    // Caemos al path sin audio para que las notas igual suenen.
                }
            }

            // Sin audio de fondo: arrancar las notas directamente.
            replayStartTimeRef.current = performance.now();
            reproductor.reproducirSecuencia(cancionFake);
            setEnReproduccion(true);
        } catch { /* error al cargar grabacion */ }
    }, [logica, reproductor, loops, metronomoVivo, metronomoReplay, detenerAudioFondoReplay]);

    const detenerReproduccion = useCallback(() => {
        reproductor.detenerReproduccion();
        detenerAudioFondoReplay();
        if (metronomoReplay.activo) metronomoReplay.detener();
        setReplayConMetronomo(false);
        setEnReproduccion(false);
    }, [reproductor, detenerAudioFondoReplay, metronomoReplay]);

    // ─── Flujo "vino de Grabaciones" ────────────────────────────────────────
    // Marcamos vinoDeGrabaciones apenas detectamos ?reproducir=<id> para que
    // el overlay "Volver" aparezca de una (independiente del landscape).
    useEffect(() => {
        if (!reproducirIdParam || vinoDeGrabaciones || usuarioEligioQuedarse) return;
        setVinoDeGrabaciones(true);
    }, [reproducirIdParam, vinoDeGrabaciones, usuarioEligioQuedarse]);

    // Auto-arrancar el replay SOLO cuando:
    //   1. Hay ?reproducir=<id> en la URL.
    //   2. El telefono esta en horizontal (sin esto el alumno no ve nada).
    //   3. La config + samples del acordeon YA bajaron de la nube
    //      (logica.disenoCargado === true).
    useEffect(() => {
        if (!reproducirIdParam || autoArrancado) return;
        if (!isLandscape) return;
        if (!disenoCargado) return;
        setAutoArrancado(true);
        // Activamos el contexto en paralelo (no awaiteamos: si la activation
        // todavia esta viva, el motor lo aprovecha; si no, queda en suspended
        // y el primer pointerdown lo activa).
        void motorAudioPro.activarContexto();
        // Marcamos audioListo nosotros mismos para no esperar el primer
        // pointerdown (ya tenemos un gesto previo de Grabaciones).
        if (!audioContextIniciadoRef.current) {
            audioContextIniciadoRef.current = true;
            setAudioListo(true);
        }
        void reproducirGrabacion(reproducirIdParam);
    }, [reproducirIdParam, autoArrancado, reproducirGrabacion, isLandscape, disenoCargado, audioContextIniciadoRef, setAudioListo]);

    // Volver inmediatamente a /grabaciones (cancela cualquier countdown).
    const volverAGrabaciones = useCallback(() => {
        if (finReplayTimerRef.current) {
            clearTimeout(finReplayTimerRef.current);
            finReplayTimerRef.current = null;
        }
        setCountdownVolver(null);
        navigate('/grabaciones');
    }, [navigate]);

    // El usuario eligio quedarse. Removemos el flag y limpiamos el query param
    // para que el simulador quede en modo normal (sin overlay nunca mas).
    const quedarseEnSimulador = useCallback(() => {
        if (finReplayTimerRef.current) {
            clearTimeout(finReplayTimerRef.current);
            finReplayTimerRef.current = null;
        }
        setUsuarioEligioQuedarse(true);
        setCountdownVolver(null);
        setVinoDeGrabaciones(false);
        const params = new URLSearchParams(searchParams);
        params.delete('reproducir');
        setSearchParams(params, { replace: true });
    }, [searchParams, setSearchParams]);

    // Countdown solo cuando termina la grabacion REAL (la duracion completa
    // que se grabo, no solo hasta la ultima nota).
    useEffect(() => {
        if (!vinoDeGrabaciones || usuarioEligioQuedarse) return;
        if (!autoArrancado || enReproduccion) return;
        if (countdownVolver !== null) return;
        // Guard race condition: setAutoArrancado(true) corre antes de que
        // reproducirGrabacion (async) llegue a setear replayStartTimeRef.
        const startedAt = replayStartTimeRef.current;
        if (startedAt === null) return;
        const dur = duracionReplayMsRef.current;
        if (dur === null || dur <= 0) {
            setCountdownVolver(3);
            return;
        }
        const elapsed = performance.now() - startedAt;
        const restante = Math.max(0, dur - elapsed);
        if (finReplayTimerRef.current) clearTimeout(finReplayTimerRef.current);
        finReplayTimerRef.current = setTimeout(() => {
            setCountdownVolver(3);
            finReplayTimerRef.current = null;
        }, restante);
        return () => {
            if (finReplayTimerRef.current) {
                clearTimeout(finReplayTimerRef.current);
                finReplayTimerRef.current = null;
            }
        };
    }, [vinoDeGrabaciones, usuarioEligioQuedarse, autoArrancado, enReproduccion, countdownVolver]);

    // Tick del countdown: cada 1s decrementa, al llegar a 0 navega.
    useEffect(() => {
        if (countdownVolver === null) return;
        if (countdownVolver <= 0) {
            navigate('/grabaciones');
            return;
        }
        const id = window.setTimeout(() => setCountdownVolver((c) => (c === null ? null : c - 1)), 1000);
        return () => window.clearTimeout(id);
    }, [countdownVolver, navigate]);

    // Sincroniza el metronomo de replay con el reproductor: arranca cuando
    // empieza la reproduccion (en sync con la primera nota), se apaga al
    // pausar/terminar. Al pausar+resumir el metronomo reinicia desde beat 0
    // — misma limitacion del patron, aceptada porque el alumno rara vez pausa.
    useEffect(() => {
        if (!replayConMetronomo) {
            if (metronomoReplay.activo) metronomoReplay.detener();
            return;
        }
        const debeSonar = enReproduccion && !reproductor.pausado;
        if (debeSonar && !metronomoReplay.activo) metronomoReplay.iniciar();
        else if (!debeSonar && metronomoReplay.activo) metronomoReplay.detener();
    }, [replayConMetronomo, enReproduccion, reproductor.pausado, metronomoReplay]);

    // Si la reproduccion termina sola (no por click en stop), tambien
    // cortar el audio de fondo.
    useEffect(() => {
        if (!enReproduccion && audioFondoReplayRef.current) {
            detenerAudioFondoReplay();
        }
    }, [enReproduccion, detenerAudioFondoReplay]);

    // Sincronizar pause/resume del audio de fondo con el reproductor.
    // Web Audio: no hay pause/resume nativo en AudioBufferSourceNode, hay que
    // detener la fuente y crear una nueva al reanudar (con el offset guardado).
    useEffect(() => {
        const data = audioFondoReplayRef.current;
        if (!data) return;
        const ctx = motorAudioPro.contextoAudio;

        if (reproductor.pausado && data.source) {
            const elapsed = (ctx.currentTime - data.startContextTime) * data.velocidad;
            const nuevoOffset = (data.offsetActual + elapsed) % data.buffer.duration;
            try { data.source.stop(); } catch { /* noop */ }
            try { data.source.disconnect(); } catch { /* noop */ }
            data.source = null;
            data.offsetActual = nuevoOffset;
        } else if (!reproductor.pausado && enReproduccion && !data.source) {
            const source = ctx.createBufferSource();
            source.buffer = data.buffer;
            source.loop = true;
            source.playbackRate.value = data.velocidad;
            source.connect(data.gain);
            source.start(0, data.offsetActual);
            data.source = source;
            data.startContextTime = ctx.currentTime;
        }
    }, [reproductor.pausado, enReproduccion]);

    // Saltar 5 segundos atras o adelante. Convertimos segundos a ticks usando
    // la formula inversa: tick = (segundos * bpm * resolucion) / 60.
    const saltarSegundos = useCallback((segundos: number) => {
        const ticksASaltar = (segundos * bpmReproduccion * resolucionReproduccion) / 60;
        const tickObjetivo = Math.max(0, Math.min(
            reproductor.totalTicks || Number.MAX_SAFE_INTEGER,
            reproductor.tickActual + ticksASaltar
        ));
        reproductor.buscarTick(tickObjetivo);
    }, [bpmReproduccion, resolucionReproduccion, reproductor]);

    const retrocederReproduccion = useCallback(() => saltarSegundos(-5), [saltarSegundos]);
    const adelantarReproduccion = useCallback(() => saltarSegundos(5), [saltarSegundos]);

    return {
        // Estado de replay
        enReproduccion,
        reproductor,
        bpmReproduccion,
        resolucionReproduccion,
        // Acciones de replay
        reproducirGrabacion,
        detenerReproduccion,
        retrocederReproduccion,
        adelantarReproduccion,
        // Flujo "vino de Grabaciones"
        vinoDeGrabaciones,
        usuarioEligioQuedarse,
        countdownVolver,
        volverAGrabaciones,
        quedarseEnSimulador,
    };
};
