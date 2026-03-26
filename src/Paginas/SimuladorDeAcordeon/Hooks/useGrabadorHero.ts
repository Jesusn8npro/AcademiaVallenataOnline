import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import type { NotaHero, DireccionFuelle } from '../videojuego_acordeon/tipos_Hero';
import { motorAudioPro } from '../AudioEnginePro';

/**
 * HOOK: useGrabadorHero (V3 - Sincronizado por Hardware)
 * Usa motorAudioPro.tiempoActual para coincidir con el metrónomo.
 */
export const useGrabadorHero = (bpmActual: number) => {
    const [grabando, setGrabando] = useState(false);
    const [secuencia, setSecuencia] = useState<NotaHero[]>([]);
    
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

    const obtenerTickActual = useCallback(() => {
        if (checkpointTimeRef.current === 0) return 0;
        
        const ahora = motorAudioPro.tiempoActual;
        const deltaSeg = ahora - checkpointTimeRef.current;
        const resolucion = 192;
        const ticksAdicionales = deltaSeg * (bpmRef.current / 60) * resolucion;
        
        return checkpointTicksRef.current + ticksAdicionales;
    }, []);

    const iniciarGrabacion = useCallback(() => {
        setSecuencia([]);
        let ahora = motorAudioPro.tiempoActual;
        
        // ❌ ELIMINADA FASE CERO EXCESIVA:
        // El Tick 0 debe coincidir EXACTAMENTE con el inicio del audio de la pista y de la tarjeta de sonido.
        
        checkpointTimeRef.current = ahora;
        checkpointTicksRef.current = 0;
        notasAbiertasRef.current.clear();
        setGrabando(true);

        // 🎧 COMPENSADOR DE LATENCIA MÁGICO:
        // Si hay una pista cargada, su `.play()` gasta unos milisegundos cargando en memoria.
        // Cuando por fin empieza a sonar, ejecutamos esto para que el Tick 0 caiga justo en ese momento.
        (window as any).sincronizarRelojConPista = () => {
             console.log('⏰ Audio Latency Compensado! Sincronizando inicio...');
             checkpointTimeRef.current = motorAudioPro.tiempoActual;
        };
    }, []);

    const detenerGrabacion = useCallback(() => {
        if (!grabando) return;
        
        const tickFinal = obtenerTickActual();
        notasAbiertasRef.current.forEach((info, botonId) => {
            const duracion = tickFinal - info.tick;
            setSecuencia(prev => [...prev, {
                tick: info.tick,
                botonId,
                duracion: Math.max(1, Math.floor(duracion)),
                fuelle: info.fuelle
            }]);
        });
        
        setGrabando(false);
        checkpointTimeRef.current = 0;
        notasAbiertasRef.current.clear();
    }, [grabando, obtenerTickActual]);

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

            setSecuencia(prev => [...prev, nuevaNota]);
            notasAbiertasRef.current.delete(botonId);
        }
    }, [grabando, obtenerTickActual]);

    const guardarSecuencia = async (datos: { 
        titulo: string; 
        tipo: 'secuencia' | 'tutorial' | 'ejercicio'; 
        dificultad: 'basico' | 'intermedio' | 'profesional'; 
        usoMetronomo?: boolean;
        pistaFile?: File | null;
    }) => {
        if (secuencia.length === 0) return { error: "No hay notas." };

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
            autor: 'Jesus Gonzalez',
            bpm: bpmRef.current,
            resolucion: 192,
            secuencia_json: secuencia,
            tipo: datos.tipo,
            dificultad: datos.dificultad,
            usoMetronomo: datos.usoMetronomo || false,
            audio_fondo_url: pistaUrlFinal
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
