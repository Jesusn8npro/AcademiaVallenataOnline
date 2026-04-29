import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../../servicios/clienteSupabase';
import type { NotaHero, DireccionFuelle } from '../hero/tipos_Hero';
import { motorAudioPro } from '../audio/AudioEnginePro';

export interface ResultadoDetenerGrabacionHero {
    secuencia: NotaHero[];
    tickFinal: number;
    bpm: number;
    resolucion: number;
}

/**
 * HOOK: useGrabadorHero (V3 - Sincronizado por Hardware)
 * Usa motorAudioPro.tiempoActual para coincidir con el metrónomo.
 */
export const useGrabadorHero = (bpmActual: number) => {
    const [grabando, setGrabando] = useState(false);
    const [secuencia, setSecuencia] = useState<NotaHero[]>([]);
    const secuenciaRef = useRef<NotaHero[]>([]);

    const checkpointTimeRef = useRef<number>(0);
    const checkpointTicksRef = useRef<number>(0);
    const bpmRef = useRef(bpmActual);
    const pausadoRef = useRef(false);

    // Reloj externo opcional: cuando hay un audio (HTMLAudio o ReproductorMP3) en curso, anclamos el
    // tickeo de notas a su currentTime — así las notas grabadas comparten EXACTAMENTE la misma línea
    // de tiempo que el MP3 que escucha el usuario. Sin esto, el motor usa motorAudioPro.tiempoActual
    // que tiene drift respecto al decoder de HTMLAudio (~50-300ms en seeks con offset → secciones
    // no-intro quedan corridas en reproducciones limpias).
    const audioElementRef = useRef<any>(null);
    const audioStartTimeRef = useRef<number>(0);
    // BPM original de la canción que está sonando: lo usamos para escalar los ticks audio-anclados.
    // CRÍTICO: NO usar bpmRef.current (= bpm transport) cuando hay slow practice — los ticks deben
    // quedar en unidades del bpm ORIGINAL para que la reproducción a velocidad normal los interprete bien.
    const audioBpmOriginalRef = useRef<number>(120);

    const notasAbiertasRef = useRef<Map<string, { tick: number; fuelle: DireccionFuelle }>>(new Map());

    // Sincronizar BPM y congelar estado anterior para evitar drift
    useEffect(() => {
        if (grabando) {
            const ahora = motorAudioPro.tiempoActual;
            const resolucion = 192;
            const deltaSeg = ahora - checkpointTimeRef.current;
            const ticksNuevos = deltaSeg * (bpmRef.current / 60) * resolucion;

            checkpointTicksRef.current += ticksNuevos;
            checkpointTimeRef.current = ahora;
        }
        bpmRef.current = bpmActual;
    }, [bpmActual, grabando]);

    const actualizarSecuencia = useCallback((siguiente: NotaHero[]) => {
        secuenciaRef.current = siguiente;
        setSecuencia(siguiente);
    }, []);

    const obtenerTickActual = useCallback(() => {
        const resolucion = 192;
        const audio = audioElementRef.current;
        // Si hay audio anclado, el tick es función pura de su currentTime: cero drift contra el MP3
        // que escucha el usuario (idéntico patrón al que usa el RAF del modal preview, que SÍ funciona).
        // Usamos audioBpmOriginalRef (no bpmRef) para que slow practice NO escale los ticks: el saved
        // sequence queda en unidades del bpm original y se reproduce 1:1 contra el audio a velocidad normal.
        if (audio) {
            const deltaSeg = audio.currentTime - audioStartTimeRef.current;
            const ticksAdicionales = deltaSeg * (audioBpmOriginalRef.current / 60) * resolucion;
            return checkpointTicksRef.current + ticksAdicionales;
        }
        if (checkpointTimeRef.current === 0) return 0;

        const ahora = motorAudioPro.tiempoActual;
        const deltaSeg = ahora - checkpointTimeRef.current;
        const ticksAdicionales = deltaSeg * (bpmRef.current / 60) * resolucion;

        return checkpointTicksRef.current + ticksAdicionales;
    }, []);

    const iniciarGrabacion = useCallback((existingSequence: NotaHero[] = [], startTick: number = 0, audioElement?: any, bpmOriginal?: number) => {
        // Si estamos haciendo Punch-In, conservamos las notas anteriores al punto de entrada
        const sequenceBase = startTick > 0
            ? existingSequence.filter(n => n.tick < startTick)
            : [];

        actualizarSecuencia(sequenceBase);
        let ahora = motorAudioPro.tiempoActual;

        // Anclar al audio si se pasa: las notas se timestamparán contra audio.currentTime en vez del
        // AudioContext. Esto elimina drift por buffering del decoder en seeks con offset (secciones no-intro).
        audioElementRef.current = audioElement || null;
        audioStartTimeRef.current = audioElement ? audioElement.currentTime : 0;
        // BPM original (no el transport): asegura que los ticks queden en la misma escala que la reproducción.
        audioBpmOriginalRef.current = (typeof bpmOriginal === 'number' && bpmOriginal > 0) ? bpmOriginal : bpmRef.current;

        checkpointTimeRef.current = ahora;
        checkpointTicksRef.current = startTick;
        notasAbiertasRef.current.clear();
        setGrabando(true);

        (window as any).sincronizarRelojConPista = () => {
             checkpointTimeRef.current = motorAudioPro.tiempoActual;
             if (audioElementRef.current) audioStartTimeRef.current = audioElementRef.current.currentTime;
        };
    }, [actualizarSecuencia]);

    const detenerGrabacion = useCallback((): ResultadoDetenerGrabacionHero => {
        if (!grabando) {
            return {
                secuencia: secuenciaRef.current,
                tickFinal: 0,
                bpm: bpmRef.current,
                resolucion: 192
            };
        }

        const tickFinal = obtenerTickActual();
        const notasPendientes: NotaHero[] = [];
        notasAbiertasRef.current.forEach((info, botonId) => {
            const duracion = tickFinal - info.tick;
            notasPendientes.push({
                tick: info.tick,
                botonId,
                duracion: Math.max(1, Math.floor(duracion)),
                fuelle: info.fuelle
            });
        });

        const secuenciaFinal = [...secuenciaRef.current, ...notasPendientes]
            .sort((a, b) => a.tick - b.tick);

        actualizarSecuencia(secuenciaFinal);

        setGrabando(false);
        checkpointTimeRef.current = 0;
        audioElementRef.current = null;
        audioStartTimeRef.current = 0;
        notasAbiertasRef.current.clear();

        return {
            secuencia: secuenciaFinal,
            tickFinal,
            bpm: bpmRef.current,
            resolucion: 192
        };
    }, [actualizarSecuencia, grabando, obtenerTickActual]);

    const registrarPresion = useCallback((botonId: string, fuelle: DireccionFuelle) => {
        if (!grabando) return;
        if (notasAbiertasRef.current.has(botonId)) return;

        const tick = obtenerTickActual();
        notasAbiertasRef.current.set(botonId, { tick, fuelle });
    }, [grabando, obtenerTickActual]);

    const registrarLiberacion = useCallback((botonId: string) => {
        if (!grabando) return;
        const info = notasAbiertasRef.current.get(botonId);

        if (info !== undefined) {
            const tickFinal = obtenerTickActual();
            const duracion = tickFinal - info.tick;

            const nuevaNota: NotaHero = {
              tick: info.tick,
              botonId,
              duracion: Math.max(1, Math.floor(duracion)),
              fuelle: info.fuelle
            };

            actualizarSecuencia([...secuenciaRef.current, nuevaNota].sort((a, b) => a.tick - b.tick));
            notasAbiertasRef.current.delete(botonId);
        }
    }, [actualizarSecuencia, grabando, obtenerTickActual]);

    const guardarSecuencia = async (datos: {
        titulo: string;
        autor?: string;
        descripcion?: string;
        youtube_id?: string;
        tipo: 'secuencia' | 'cancion' | 'ejercicio';
        dificultad: 'basico' | 'intermedio' | 'profesional';
        usoMetronomo?: boolean;
        pistaFile?: File | null;
        tonalidad?: string;
    }) => {
        if (secuenciaRef.current.length === 0) return { error: "No hay notas." };

        let pistaUrlFinal = null;

        if (datos.pistaFile) {
            const fileName = `${Date.now()}_${datos.pistaFile.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('pistas_hero')
                .upload(fileName, datos.pistaFile);

            if (uploadError) return { error: `Error subiendo pista: ${uploadError.message}` };

            const { data: urlData } = supabase.storage
                .from('pistas_hero')
                .getPublicUrl(fileName);

            pistaUrlFinal = urlData.publicUrl;
        }

        const nuevaCancion = {
            titulo: datos.titulo,
            autor: datos.autor?.trim() || 'Jesus Gonzalez',
            descripcion: datos.descripcion?.trim() || null,
            bpm: bpmRef.current,
            resolucion: 192,
            secuencia_json: secuenciaRef.current,
            tipo: datos.tipo,
            dificultad: datos.dificultad,
            usoMetronomo: datos.usoMetronomo || false,
            audio_fondo_url: pistaUrlFinal,
            youtube_id: datos.youtube_id?.trim() || null,
            tonalidad: datos.tonalidad || 'F-Bb-Eb'
        };

        return await supabase.from('canciones_hero' as any).insert([nuevaCancion] as any);
    };

    return {
        grabando,
        secuencia,
        iniciarGrabacion,
        detenerGrabacion,
        registrarPresion,
        registrarLiberacion,
        guardarSecuencia
    };
};
