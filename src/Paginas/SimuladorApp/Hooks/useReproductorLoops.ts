import { useCallback, useEffect, useRef, useState } from 'react';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';
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
 * sigue sonando.
 *
 * Patron mobile-first (copiado de useAudioFondoPracticaLibre): el HTMLAudio se
 * enruta por el AudioContext del motor con `conectarMediaElement`. iOS Safari
 * exige una sola sesion de audio activada por gesto — sin esto, el HTMLAudio
 * compite con el AudioContext del acordeon y el play() es rechazado o silenciado.
 *
 * Reusamos el MISMO HTMLAudioElement en cada cambio de pista (solo cambiamos
 * `src`). Crear `new Audio()` dentro del mismo gesto que un `pause()` previo
 * tambien rompe la user activation en iOS.
 */
export function useReproductorLoops() {
    const [pistaActiva, setPistaActiva] = useState<PistaActiva | null>(null);
    const [volumen, setVolumen] = useState(0.85);
    const [velocidad, setVelocidad] = useState(1.0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Crea (una sola vez) el HTMLAudio persistente y lo conecta al motor.
    const obtenerAudio = useCallback((): HTMLAudioElement => {
        if (audioRef.current) return audioRef.current;
        const audio = new Audio();
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audio.loop = true;
        try { motorAudioPro.conectarMediaElement(audio); } catch (e) {
            console.warn('[Loops] no pude conectar al motor de audio:', e);
        }
        audioRef.current = audio;
        return audio;
    }, []);

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
            // No borramos src ni desconectamos: queremos que el mismo audio
            // este listo para la proxima pista sin re-crear (preserva user
            // activation y evita el cold-start de iOS).
        }
        setPistaActiva(null);
    }, []);

    const reproducir = useCallback(async (pista: PistaPracticaLibre) => {
        // Toggle: misma pista → para.
        if (pistaActiva && pistaActiva.id === pista.id) {
            detener();
            return;
        }
        const url = pista.audioUrl || (pista.capas && pista.capas[0]?.url);
        if (!url) return;

        const audio = obtenerAudio();

        // AudioContext en running antes de play() — iOS lo suspende cuando la
        // tab pierde foco o tras periodos de inactividad.
        try {
            await motorAudioPro.activarContexto();
        } catch (e) {
            console.warn('[Loops] activarContexto fallo:', e);
        }

        // Cambio de URL: solo reasignar src + load. Igual que ProMax PracticaLibre.
        if (audio.src !== url) {
            audio.src = url;
            try { audio.load(); } catch { /* noop */ }
        }
        audio.volume = volumen;
        audio.playbackRate = velocidad;

        try {
            await audio.play();
            setPistaActiva({
                id: pista.id,
                nombre: pista.nombre,
                url,
                artista: pista.artista || null,
                bpm: pista.bpm || null,
            });
        } catch (e: any) {
            // En produccion mobile esto era el catch silencioso que escondia el
            // error real. Ahora lo logueamos para diagnostico.
            console.error('[Loops] audio.play() rechazado:', e?.name, e?.message, e);
            setPistaActiva(null);
        }
    }, [pistaActiva, volumen, velocidad, detener, obtenerAudio]);

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
