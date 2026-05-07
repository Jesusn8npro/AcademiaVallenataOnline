import { useCallback, useEffect, useRef, useState } from 'react';
import type { PistaPracticaLibre } from '../../AcordeonProMax/PracticaLibre/TiposPracticaLibre';

export interface PistaActiva {
    id: string;
    nombre: string;
    url: string;
    artista?: string | null;
    bpm?: number | null;
}

/**
 * Hook que vive en SimuladorAppNormal y maneja la pista de loops del SimuladorApp.
 * El audio se mantiene fuera del modal — si el usuario cierra el modal, el loop
 * sigue sonando. Tambien expone la pista activa para que el icono de la barra
 * pueda mostrar un indicador "sonando" y para que el grabador la guarde como
 * audio de fondo en la metadata.
 */
export function useReproductorLoops() {
    const [pistaActiva, setPistaActiva] = useState<PistaActiva | null>(null);
    const [volumen, setVolumen] = useState(0.85);
    const [velocidad, setVelocidad] = useState(1.0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Aplicar volumen y velocidad en vivo al audio actual.
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volumen;
    }, [volumen]);
    useEffect(() => {
        if (audioRef.current) audioRef.current.playbackRate = velocidad;
    }, [velocidad]);

    const detener = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            try { audio.pause(); } catch { /* noop */ }
            audio.src = '';
            audioRef.current = null;
        }
        setPistaActiva(null);
    }, []);

    const reproducir = useCallback((pista: PistaPracticaLibre) => {
        // Toggle: misma pista → para.
        if (pistaActiva && pistaActiva.id === pista.id) {
            detener();
            return;
        }
        // Para la actual antes de empezar la nueva.
        const prev = audioRef.current;
        if (prev) {
            try { prev.pause(); } catch { /* noop */ }
            prev.src = '';
        }
        const url = pista.audioUrl || (pista.capas && pista.capas[0]?.url);
        if (!url) return;
        const audio = new Audio(url);
        audio.volume = volumen;
        audio.playbackRate = velocidad;
        audio.loop = true;
        audio.play().catch(() => {
            // Autoplay puede fallar si no hubo gesto reciente.
            // No dejamos audioRef colgado: lo limpiamos.
            audioRef.current = null;
            setPistaActiva(null);
        });
        audioRef.current = audio;
        setPistaActiva({
            id: pista.id,
            nombre: pista.nombre,
            url,
            artista: pista.artista || null,
            bpm: pista.bpm || null,
        });
    }, [pistaActiva, volumen, velocidad, detener]);

    // Cleanup al desmontar el componente padre.
    useEffect(() => {
        return () => {
            const audio = audioRef.current;
            if (audio) {
                try { audio.pause(); } catch { /* noop */ }
                audio.src = '';
                audioRef.current = null;
            }
        };
    }, []);

    /**
     * Devuelve la posicion actual del loop en segundos (audio.currentTime).
     * Usado por el grabador para anclar la pista al momento exacto en que
     * se inicio la grabacion → replay seekea a este offset y suena en sync.
     */
    const obtenerPosicion = useCallback(() => {
        const a = audioRef.current;
        if (!a || !isFinite(a.currentTime)) return 0;
        return a.currentTime;
    }, []);

    return {
        pistaActiva,
        volumen,
        velocidad,
        setVolumen,
        setVelocidad,
        reproducir,
        detener,
        obtenerPosicion,
    };
}
