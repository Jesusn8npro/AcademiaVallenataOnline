import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import { ReproductorMP3 } from '../../../../Core/audio/ReproductorMP3';
import { useMetronomoEstudiante } from '../../../AcordeonProMax/PracticaLibre/Hooks/useMetronomoEstudiante';
import type { GrabacionReplayHero } from './tiposReplay';
import {
    type UseReproductorReplayParams,
    convertirTicksASegundos, limitarPlaybackRate,
    construirCancionReplay, calcularBpmPistaOriginal,
} from './_tiposReproductorReplay';
export type { LogicaAcordeon, ReproductorHero, UseReproductorReplayParams } from './_tiposReproductorReplay';

export function useReproductorReplay({ abierta, grabacion, logica, reproductor, bpm, setBpm }: UseReproductorReplayParams) {
    const [preparandoReplay, setPreparandoReplay] = useState(false);
    // Migrado de HTMLAudioElement → ReproductorMP3 (AudioBufferSourceNode).
    // Sample-accurate, mismo clock que el RAF de notas (vía setAudioSync) → cero drift.
    const audioFondoRef = useRef<ReproductorMP3 | null>(null);
    const tickActualRef = useRef(0);
    const precargaReplayRef = useRef<Promise<void> | null>(null);
    const claveReplayPrecargadoRef = useRef('');
    // Promise de la carga del MP3 (download + decode). La awaitamos antes de cualquier seek
    // porque `ReproductorMP3.set currentTime` clampa a `duration` (que es 0 sin buffer)
    // → si seteás currentTime=98s antes de que termine la carga, queda en 0 → audio arranca en 0.
    const cargaAudioPromiseRef = useRef<Promise<void> | null>(null);

    const resolucionActiva = grabacion?.resolucion || 192;

    const cancionReplay = useMemo(() => construirCancionReplay(grabacion), [grabacion]);

    const bpmPistaOriginal = useMemo(() => calcularBpmPistaOriginal(grabacion, bpm), [bpm, grabacion]);

    // Tick inicial del replay. La secuencia ya está normalizada por `construirCancionReplay` para
    // que sus ticks sean audio musical ticks puros (sin offset de lead-in).
    //
    // Cuando la grabación es de una sección no-intro, retrocedemos `LEADIN_PREVIEW_SEGUNDOS` ticks
    // antes del primer tick grabado: audio + RAF arrancan ahí, así suena ~3s de pista sola antes
    // de que la primera nota dispare — mismo feel que el lead-in de competencia, evita que las
    // notas se escuchen "de golpe" al apretar play.
    //
    // Para intros (sin sección) o practica_libre, arrancamos exactamente en el primer tick: ahí no
    // hay lead-in en la grabación original y un preview del segundo 0 sería ruido innecesario.
    const LEADIN_PREVIEW_SEGUNDOS = 3;
    const tickInicialReplay = useMemo(() => {
        const seq = cancionReplay?.secuencia;
        if (!Array.isArray(seq) || seq.length === 0) return 0;
        const primerTick = Math.min(...seq.map((n: any) => Number(n.tick) || 0));

        const secInicio = Number((grabacion?.metadata as any)?.seccion_tick_inicio) || 0;
        const tieneSeccion = grabacion?.modo === 'competencia' && secInicio > 0;
        if (!tieneSeccion) return Math.max(0, Math.floor(primerTick));

        const reso = grabacion?.resolucion || 192;
        const bpmOrig = bpmPistaOriginal || grabacion?.bpm || 120;
        const previewTicks = Math.floor(LEADIN_PREVIEW_SEGUNDOS * (bpmOrig / 60) * reso);
        return Math.max(0, Math.floor(primerTick - previewTicks));
    }, [cancionReplay, grabacion, bpmPistaOriginal]);


    const totalTicksCalculados = useMemo(() => {
        if (!grabacion?.secuencia_grabada?.length) return 0;
        return grabacion.secuencia_grabada.reduce((max, nota) => Math.max(max, nota.tick + (nota.duracion || 0)), 0);
    }, [grabacion]);

    const botonesReplayUnicos = useMemo(
        () => Array.from(new Set((grabacion?.secuencia_grabada || []).map((n) => n.botonId).filter(Boolean))),
        [grabacion]
    );

    // Si la grabacion vino de SimuladorApp con un loop de fondo, la velocidad
    // de la pista la guardamos explicitamente en `metadata.pista_velocidad`.
    // En ese caso usamos ese valor en lugar del calculo bpm/bpmOriginal porque
    // el loop NO esta atado al bpm de la cancion (es una pista independiente).
    const pistaVelocidadGuardada = useMemo(() => {
        const v = (grabacion?.metadata as any)?.pista_velocidad;
        return typeof v === 'number' && isFinite(v) && v > 0 ? v : null;
    }, [grabacion]);

    const playbackRateAudio = useMemo(
        () => pistaVelocidadGuardada !== null
            ? limitarPlaybackRate(pistaVelocidadGuardada)
            : limitarPlaybackRate((grabacion?.bpm || bpm || 120) / Math.max(1, bpmPistaOriginal || 120)),
        [bpm, bpmPistaOriginal, grabacion?.bpm, pistaVelocidadGuardada]
    );

    // Offset de la pista en el momento de iniciar la grabacion (segundos).
    // Sin esto el audio arrancaria desde 0 y las notas no harian match con
    // lo que el alumno escuchaba al grabar. Solo se usa para grabaciones
    // de practica_libre con loop de fondo (SimuladorApp).
    const pistaOffsetSegundos = useMemo(() => {
        const v = (grabacion?.metadata as any)?.pista_offset_segundos;
        return typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0;
    }, [grabacion]);

    const tonalidadReplayLista = !grabacion?.tonalidad || logica.tonalidadSeleccionada === grabacion.tonalidad;

    const clavePrecargaReplay = useMemo(
        () => [grabacion?.id || 'sin-grabacion', grabacion?.tonalidad || 'sin-tonalidad', logica.instrumentoId, botonesReplayUnicos.join('|')].join('::'),
        [botonesReplayUnicos, grabacion?.id, grabacion?.tonalidad, logica.instrumentoId]
    );

    const urlAudioFondo = useMemo(() => {
        if (!grabacion) return null;
        return grabacion.canciones_hero?.audio_fondo_url || grabacion.metadata?.audio_fondo_url || null;
    }, [grabacion]);

    useEffect(() => {
        if (!grabacion) return;
        setBpm(grabacion.bpm || 120);
        const efectos = grabacion.metadata?.efectos || grabacion.metadata?.practica_libre?.efectos;
        if (efectos) {
            motorAudioPro.actualizarEQ(efectos.bajos || 0, efectos.medios || 0, efectos.agudos || 0);
            motorAudioPro.actualizarReverb((efectos.reverb || 0) / 100);
        } else {
            motorAudioPro.actualizarEQ(0, 0, 0);
            motorAudioPro.actualizarReverb(0);
        }
    }, [grabacion]);

    // Metrónomo del replay: si la grabación se hizo en modo metrónomo, reconstruimos los clicks
    // con la misma config (bpm/compás/sonido/volumen) que tenía el alumno cuando grabó.
    // No queda mezclado dentro del audio, suena como guía paralela mientras el RAF avanza.
    const metronomoReplay = useMetronomoEstudiante();
    const metronomoMetadata = useMemo(() => {
        const m = grabacion?.metadata?.metronomo;
        return m && typeof m === 'object' && m.activo ? m : null;
    }, [grabacion]);

    useEffect(() => {
        if (!metronomoMetadata) return;
        if (typeof metronomoMetadata.bpm === 'number') metronomoReplay.setBpm(metronomoMetadata.bpm);
        if (typeof metronomoMetadata.compas === 'number') metronomoReplay.setCompas(metronomoMetadata.compas);
        if (typeof metronomoMetadata.subdivision === 'number') metronomoReplay.setSubdivision(metronomoMetadata.subdivision);
        if (typeof metronomoMetadata.volumen === 'number') metronomoReplay.setVolumen(metronomoMetadata.volumen);
        if (typeof metronomoMetadata.sonido === 'string') metronomoReplay.setSonido(metronomoMetadata.sonido);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metronomoMetadata]);

    // Activar/desactivar el metrónomo siguiendo el estado del reproductor.
    useEffect(() => {
        if (!metronomoMetadata) {
            if (metronomoReplay.activo) metronomoReplay.setActivo(false);
            return;
        }
        const debeSonar = reproductor.reproduciendo && !reproductor.pausado;
        if (debeSonar !== metronomoReplay.activo) metronomoReplay.setActivo(debeSonar);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metronomoMetadata, reproductor.reproduciendo, reproductor.pausado]);

    // Cleanup al cerrar el modal.
    useEffect(() => {
        if (!abierta && metronomoReplay.activo) metronomoReplay.setActivo(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierta]);

    const precargarNotasReplay = useCallback(async () => {
        if (!abierta || !grabacion || !logica.disenoCargado || logica.cargando || !tonalidadReplayLista) return;
        if (claveReplayPrecargadoRef.current === clavePrecargaReplay && precargaReplayRef.current) {
            return precargaReplayRef.current;
        }
        setPreparandoReplay(true);
        const rutasUnicas = new Map<string, string>();
        botonesReplayUnicos.forEach((botonId) => {
            const rutas = logica.obtenerRutasAudio(botonId);
            rutas.forEach((rutaRaw) => {
                const ruta = rutaRaw.startsWith('pitch:') ? rutaRaw.split('|')[1] : rutaRaw;
                const rutaFinal = ruta.startsWith('http') || ruta.startsWith('/') ? ruta : `/${ruta}`;
                rutasUnicas.set(ruta, rutaFinal);
            });
        });
        const promesa = Promise.allSettled(
            Array.from(rutasUnicas.entries()).map(([ruta, rutaFinal]) =>
                motorAudioPro.cargarSonidoEnBanco(logica.instrumentoId, ruta, rutaFinal)
            )
        ).then(() => {
            claveReplayPrecargadoRef.current = clavePrecargaReplay;
        }).finally(() => {
            if (precargaReplayRef.current === promesa) setPreparandoReplay(false);
        });
        precargaReplayRef.current = promesa;
        return promesa;
    }, [abierta, botonesReplayUnicos, clavePrecargaReplay, grabacion, logica.cargando, logica.disenoCargado, logica.instrumentoId, logica.obtenerRutasAudio, tonalidadReplayLista]);

    useEffect(() => {
        if (!abierta || !grabacion?.tonalidad) return;
        logica.setTonalidadSeleccionada(grabacion.tonalidad);
    }, [abierta, grabacion?.tonalidad, logica.setTonalidadSeleccionada]);

    useEffect(() => {
        if (!abierta || !grabacion?.metadata?.instrumento_id) return;
        logica.setInstrumentoId(grabacion.metadata.instrumento_id);
    }, [abierta, grabacion?.metadata?.instrumento_id, logica.setInstrumentoId]);

    useEffect(() => {
        if (!abierta || !grabacion?.metadata?.timbre) return;
        logica.setAjustes((prev: any) => ({ ...prev, timbre: grabacion.metadata?.timbre }));
    }, [abierta, grabacion?.metadata?.timbre, logica.setAjustes]);

    useEffect(() => {
        if (!abierta || !grabacion) {
            setPreparandoReplay(false);
            precargaReplayRef.current = null;
            claveReplayPrecargadoRef.current = '';
            return;
        }
        if (!logica.disenoCargado || logica.cargando || !tonalidadReplayLista) { setPreparandoReplay(true); return; }
        void precargarNotasReplay();
    }, [abierta, grabacion, logica.cargando, logica.disenoCargado, precargarNotasReplay, tonalidadReplayLista]);

    useEffect(() => {
        if (!abierta) return;
        logica.setModoVista('notas');
    }, [abierta, logica.setModoVista]);

    useEffect(() => {
        if (!abierta) return;
        const bloquearTeclas = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
            event.stopPropagation();
        };
        window.addEventListener('keydown', bloquearTeclas, true);
        window.addEventListener('keyup', bloquearTeclas, true);
        return () => { window.removeEventListener('keydown', bloquearTeclas, true); window.removeEventListener('keyup', bloquearTeclas, true); };
    }, [abierta]);

    useEffect(() => { tickActualRef.current = reproductor.tickActual; }, [reproductor.tickActual]);

    useEffect(() => {
        if (!abierta) return;
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = overflowAnterior; };
    }, [abierta]);

    useEffect(() => {
        if (audioFondoRef.current) {
            try { audioFondoRef.current.pause(); } catch (_) {}
            try { audioFondoRef.current.destruir(); } catch (_) {}
            audioFondoRef.current = null;
        }
        if (!abierta || !urlAudioFondo) return;
        const audio = new ReproductorMP3(motorAudioPro.contextoAudio);
        audio.volume = 1;
        audio.playbackRate = playbackRateAudio;
        audioFondoRef.current = audio;
        // Carga upfront — descarga + decodifica todo el MP3 una vez.
        // Trackeamos la promise para que `iniciarReplaySincronizado` la pueda awaitear:
        // `ReproductorMP3.cargar` retorna inmediatamente si ya hay una carga en vuelo
        // (no awaitéa la concurrente) → un segundo `await audio.cargar(url)` resuelve con
        // buffer todavía nulo → `currentTime = X` clampa a 0 (duration=0) → audio arranca en 0.
        cargaAudioPromiseRef.current = audio.cargar(urlAudioFondo).catch(() => {});
        return () => {
            try { audio.pause(); } catch (_) {}
            try { audio.destruir(); } catch (_) {}
            if (audioFondoRef.current === audio) audioFondoRef.current = null;
            cargaAudioPromiseRef.current = null;
        };
    }, [abierta, urlAudioFondo]);

    useEffect(() => { if (!audioFondoRef.current) return; audioFondoRef.current.playbackRate = playbackRateAudio; }, [playbackRateAudio]);

    useEffect(() => {
        const audio = audioFondoRef.current;
        if (!audio) return;
        if (!reproductor.reproduciendo) {
            try { audio.pause(); } catch (_) {}
            try { audio.currentTime = 0; } catch (_) {}
        }
    }, [reproductor.reproduciendo, reproductor.pausado]);

    useEffect(() => {
        if (!abierta) {
            reproductor.detenerReproduccion();
            try { audioFondoRef.current?.pause(); } catch (_) {}
            return;
        }
        return () => {
            reproductor.detenerReproduccion();
            try { audioFondoRef.current?.pause(); } catch (_) {}
            motorAudioPro.detenerTodo();
        };
    }, [abierta, reproductor.detenerReproduccion]);

    const sincronizarAudioConTick = (tick: number) => {
        const audio = audioFondoRef.current;
        if (!audio) return;
        try {
            // segMusicales = real_seconds que corresponden a este tick. Para una
            // grabacion practica_libre con loop, el AUDIO no avanza al ritmo real
            // sino al ritmo `pista_velocidad` (V). Asi que audio_seconds_consumidos
            // = real_seconds * V. El offset es la posicion del audio cuando el
            // alumno empezo a grabar.
            const segMusicales = convertirTicksASegundos(tick, bpmPistaOriginal, resolucionActiva);
            const factorAudio = pistaVelocidadGuardada !== null ? pistaVelocidadGuardada : 1;
            audio.currentTime = pistaOffsetSegundos + segMusicales * factorAudio;
        } catch (_) {}
    };

    /** Arranca la secuencia + audio + setAudioSync en el mismo instante para sample-accurate. */
    const iniciarReplaySincronizado = async (tickInicial: number) => {
        if (!cancionReplay) return;
        const audio = audioFondoRef.current;
        const tickObjetivo = Math.max(0, Math.floor(tickInicial));

        // Sin audio: simple, solo dispara la secuencia.
        if (!audio) {
            reproductor.reproducirSecuencia(cancionReplay as any, {
                tickInicialOverride: tickObjetivo,
            } as any);
            return;
        }

        // 1) Asegurar buffer decodificado antes de cualquier seek (currentTime= clampa a duration=0
        //    sin buffer → audio arranca en 0).
        try {
            if (cargaAudioPromiseRef.current) await cargaAudioPromiseRef.current;
            if (!audio.cargado) await audio.cargar(urlAudioFondo!);
        } catch (_) {}

        // 2) Configurar playbackRate antes del seek y posicionar (audio sigue paused).
        audio.playbackRate = playbackRateAudio;
        sincronizarAudioConTick(tickObjetivo);

        // 3) CRÍTICO: esperar el evento 'playing' ANTES de arrancar el RAF.
        //    Sin este await, había desfase: `reproducirSecuencia` setea checkpointTime=ahora,
        //    luego `await audio.play()` introduce un gap de microtask + sync time hasta que el
        //    AudioBufferSourceNode realmente empieza (startContextTime). Resultado: la secuencia
        //    corre mientras el audio aún está silencioso → notas "tarde" vs el MP3.
        //    Esperando 'playing' alineamos el checkpoint con el startContextTime real del audio.
        //    Patrón validado en `useAudioFondoPracticaLibre.iniciarReproduccionAnclada`.
        await new Promise<void>((resolve) => {
            let resuelto = false;
            const finalizar = () => { if (resuelto) return; resuelto = true; resolve(); };
            const onPlaying = () => { audio.removeEventListener('playing', onPlaying); finalizar(); };
            audio.addEventListener('playing', onPlaying);
            audio.play().catch(() => finalizar());
            setTimeout(() => { audio.removeEventListener('playing', onPlaying); finalizar(); }, 1500);
        });

        // 4) Audio ya sonando → arrancar RAF: checkpointTime queda dentro del mismo microtask
        //    que el startContextTime del audio (sub-ms drift inicial).
        reproductor.reproducirSecuencia(cancionReplay as any, {
            tickInicialOverride: tickObjetivo,
        } as any);

        // 5) Cablear audio→RAF para drift correction continuo (los listeners 'seeked'/'playing'
        //    futuros recapturarán el checkpoint contra audio.currentTime real).
        (reproductor as any).setAudioSync?.(audio, bpmPistaOriginal);
    };

    const reproducirOReanudar = async () => {
        if (!cancionReplay) return;
        await motorAudioPro.activarContexto();
        await precargarNotasReplay();
        // Si nunca se inició → arranca desde tick inicial (sección o 0); sino retoma desde tickActual.
        const tickObjetivo = !reproductor.reproduciendo
            ? (tickActualRef.current > 0 ? tickActualRef.current : tickInicialReplay)
            : tickActualRef.current;
        if (!reproductor.reproduciendo) {
            await iniciarReplaySincronizado(tickObjetivo);
            return;
        }
        if (reproductor.pausado) {
            const audio = audioFondoRef.current;
            if (audio) { sincronizarAudioConTick(tickObjetivo); try { await audio.play(); } catch (_) {} }
            reproductor.alternarPausa();
        }
    };

    const pausar = () => {
        if (reproductor.reproduciendo && !reproductor.pausado) {
            try { audioFondoRef.current?.pause(); } catch (_) {}
            reproductor.alternarPausa();
        }
    };

    const buscarTick = (tick: number) => {
        const tickNormalizado = Math.max(0, Math.floor(tick));
        reproductor.buscarTick(tickNormalizado);
        sincronizarAudioConTick(tickNormalizado);
    };

    const reiniciar = async () => {
        if (!cancionReplay) return;
        await precargarNotasReplay();
        reproductor.detenerReproduccion();
        const audio = audioFondoRef.current;
        if (audio) { try { audio.pause(); audio.currentTime = 0; } catch (_) {} }
        await motorAudioPro.activarContexto();
        // Reset al tick inicial guardado (sección si existe, sino 0).
        await iniciarReplaySincronizado(tickInicialReplay);
    };

    return { preparandoReplay, totalTicksCalculados, tonalidadReplayLista, urlAudioFondo, reproducirOReanudar, pausar, buscarTick, reiniciar };
}
