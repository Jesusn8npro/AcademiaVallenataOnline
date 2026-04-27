import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import type { GrabacionReplayHero } from './tiposReplay';
import {
    type UseReproductorReplayParams,
    convertirTicksASegundos, limitarPlaybackRate,
    construirCancionReplay, calcularBpmPistaOriginal,
    invocarSincronizacionConPista, registrarSyncCuandoSuene
} from './_tiposReproductorReplay';
export type { LogicaAcordeon, ReproductorHero, UseReproductorReplayParams } from './_tiposReproductorReplay';

export function useReproductorReplay({ abierta, grabacion, logica, reproductor, bpm, setBpm }: UseReproductorReplayParams) {
    const [preparandoReplay, setPreparandoReplay] = useState(false);
    const audioFondoRef = useRef<HTMLAudioElement | null>(null);
    const tickActualRef = useRef(0);
    const precargaReplayRef = useRef<Promise<void> | null>(null);
    const claveReplayPrecargadoRef = useRef('');

    const resolucionActiva = grabacion?.resolucion || 192;

    const cancionReplay = useMemo(() => construirCancionReplay(grabacion), [grabacion]);

    const totalTicksCalculados = useMemo(() => {
        if (!grabacion?.secuencia_grabada?.length) return 0;
        return grabacion.secuencia_grabada.reduce((max, nota) => Math.max(max, nota.tick + (nota.duracion || 0)), 0);
    }, [grabacion]);

    const botonesReplayUnicos = useMemo(
        () => Array.from(new Set((grabacion?.secuencia_grabada || []).map((n) => n.botonId).filter(Boolean))),
        [grabacion]
    );

    const bpmPistaOriginal = useMemo(() => calcularBpmPistaOriginal(grabacion, bpm), [bpm, grabacion]);

    const playbackRateAudio = useMemo(
        () => limitarPlaybackRate((grabacion?.bpm || bpm || 120) / Math.max(1, bpmPistaOriginal || 120)),
        [bpm, bpmPistaOriginal, grabacion?.bpm]
    );

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
        if (audioFondoRef.current) { audioFondoRef.current.pause(); audioFondoRef.current.src = ''; audioFondoRef.current = null; }
        if (!abierta || !urlAudioFondo) return;
        const audio = new Audio(urlAudioFondo);
        audio.preload = 'auto';
        audio.volume = 1;
        audio.playbackRate = playbackRateAudio;
        audioFondoRef.current = audio;
        return () => { audio.pause(); audio.src = ''; if (audioFondoRef.current === audio) audioFondoRef.current = null; };
    }, [abierta, urlAudioFondo]);

    useEffect(() => { if (!audioFondoRef.current) return; audioFondoRef.current.playbackRate = playbackRateAudio; }, [playbackRateAudio]);

    useEffect(() => {
        const audio = audioFondoRef.current;
        if (!audio) return;
        if (!reproductor.reproduciendo) { audio.pause(); audio.currentTime = 0; }
    }, [reproductor.reproduciendo, reproductor.pausado]);

    useEffect(() => {
        if (!abierta) { reproductor.detenerReproduccion(); audioFondoRef.current?.pause(); return; }
        return () => { reproductor.detenerReproduccion(); audioFondoRef.current?.pause(); motorAudioPro.detenerTodo(); };
    }, [abierta, reproductor.detenerReproduccion]);

    const sincronizarAudioConTick = (tick: number) => {
        const audio = audioFondoRef.current;
        if (!audio) return;
        audio.currentTime = convertirTicksASegundos(tick, bpmPistaOriginal, resolucionActiva);
    };

    const iniciarSecuenciaDesdeTick = (tick: number) => {
        if (!cancionReplay) return;
        const tickNormalizado = Math.max(0, Math.floor(tick));
        reproductor.reproducirSecuencia(cancionReplay as any);
        if (tickNormalizado > 0) reproductor.buscarTick(tickNormalizado);
    };

    const reproducirAudioFondo = async (tick: number, alIniciarReplay = false) => {
        const audio = audioFondoRef.current;
        const tickObjetivo = Math.max(0, Math.floor(tick));
        await precargarNotasReplay();
        if (!audio) {
            if (alIniciarReplay && !reproductor.reproduciendo && cancionReplay) iniciarSecuenciaDesdeTick(tickObjetivo);
            return tickObjetivo;
        }
        sincronizarAudioConTick(tickObjetivo);
        audio.playbackRate = playbackRateAudio;
        if (alIniciarReplay && !reproductor.reproduciendo && cancionReplay) {
            return await new Promise<number>((resolve) => {
                let arrancado = false;
                const iniciarTodo = () => {
                    if (arrancado) return;
                    arrancado = true;
                    audio.removeEventListener('canplay', iniciarTodo);
                    audio.removeEventListener('loadeddata', iniciarTodo);
                    audio.removeEventListener('load', iniciarTodo);
                    window.clearTimeout(timeoutId);
                    registrarSyncCuandoSuene(audio);
                    iniciarSecuenciaDesdeTick(tickObjetivo);
                    audio.play().catch(() => {});
                    resolve(tickObjetivo);
                };
                const timeoutId = window.setTimeout(iniciarTodo, 3000);
                if (audio.readyState >= 2) { iniciarTodo(); return; }
                audio.addEventListener('canplay', iniciarTodo);
                audio.addEventListener('loadeddata', iniciarTodo);
                audio.addEventListener('load', iniciarTodo);
            });
        }
        registrarSyncCuandoSuene(audio);
        try { await audio.play(); } catch {}
        return tickObjetivo;
    };

    const reproducirOReanudar = async () => {
        if (!cancionReplay) return;
        await motorAudioPro.activarContexto();
        await precargarNotasReplay();
        const tickObjetivo = Math.max(0, Math.floor(tickActualRef.current));
        if (!reproductor.reproduciendo) { await reproducirAudioFondo(tickObjetivo, true); return; }
        if (reproductor.pausado) { const reanudacion = reproducirAudioFondo(tickObjetivo, false); reproductor.alternarPausa(); await reanudacion; }
    };

    const pausar = () => {
        if (reproductor.reproduciendo && !reproductor.pausado) { audioFondoRef.current?.pause(); reproductor.alternarPausa(); }
    };

    const buscarTick = (tick: number) => {
        const tickNormalizado = Math.max(0, Math.floor(tick));
        reproductor.buscarTick(tickNormalizado);
        if (audioFondoRef.current) sincronizarAudioConTick(tickNormalizado);
    };

    const reiniciar = async () => {
        if (!cancionReplay) return;
        await precargarNotasReplay();
        reproductor.detenerReproduccion();
        const audio = audioFondoRef.current;
        if (audio) { audio.pause(); audio.currentTime = 0; }
        await motorAudioPro.activarContexto();
        await reproducirAudioFondo(0, true);
    };

    return { preparandoReplay, totalTicksCalculados, tonalidadReplayLista, urlAudioFondo, reproducirOReanudar, pausar, buscarTick, reiniciar };
}
