import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import type { NotaHero, DireccionFuelle } from '../videojuego_acordeon/tipos_Hero';
import { motorAudioPro } from '../AudioEnginePro';

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
        if (checkpointTimeRef.current === 0) return 0;
        
        const ahora = motorAudioPro.tiempoActual;
        const deltaSeg = ahora - checkpointTimeRef.current;
        const resolucion = 192;
        const ticksAdicionales = deltaSeg * (bpmRef.current / 60) * resolucion;
        
        return checkpointTicksRef.current + ticksAdicionales;
    }, []);

    const iniciarGrabacion = useCallback((existingSequence: NotaHero[] = [], startTick: number = 0) => {
        // Si estamos haciendo Punch-In, conservamos las notas anteriores al punto de entrada
        const sequenceBase = startTick > 0 
            ? existingSequence.filter(n => n.tick < startTick)
            : [];
            
        actualizarSecuencia(sequenceBase);
        let ahora = motorAudioPro.tiempoActual;
        
        checkpointTimeRef.current = ahora;
        checkpointTicksRef.current = startTick;
        notasAbiertasRef.current.clear();
        setGrabando(true);

        (window as any).sincronizarRelojConPista = () => {
             console.log('⏰ Audio Latency Compensado! Sincronizando inicio...');
             checkpointTimeRef.current = motorAudioPro.tiempoActual;
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
