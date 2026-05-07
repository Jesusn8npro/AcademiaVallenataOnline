import { useCallback, useEffect, useRef, useState } from 'react';
import type { PistaPracticaLibre } from '../../AcordeonProMax/PracticaLibre/TiposPracticaLibre';

export interface PistaActiva {
    id: string;
    nombre: string;
    url: string;
    artista?: string | null;
    bpm?: number | null;
}

export interface EstadoLoopError {
    name: string;
    message: string;
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
    const [errorReproduccion, setErrorReproduccion] = useState<EstadoLoopError | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Crea (una sola vez) el HTMLAudio persistente. Importante: NO lo conectamos
    // a motorAudioPro.conectarMediaElement(). Probamos con conexion via
    // createMediaElementSource y en iPhone real el audio quedaba mudo (probable
    // taint por CORS de Supabase Storage o quirk de WebKit). Sin la conexion,
    // el HTMLAudio reproduce nativo a traves del speaker — el unico downside
    // es que en iOS los pitos del acordeon podrian bajar de volumen mientras
    // el loop suena, pero al menos SE OYE.
    const obtenerAudio = useCallback((): HTMLAudioElement => {
        if (audioRef.current) return audioRef.current;
        const audio = new Audio();
        audio.preload = 'auto';
        // Sin crossOrigin: con createMediaElementSource lo necesitabamos, sin el
        // mejor lo dejamos sin tagging para que iOS lo trate como playback nativo.
        audio.loop = true;
        audio.playsInline = true;
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

    const reproducir = useCallback((pista: PistaPracticaLibre) => {
        // Toggle: misma pista → para.
        if (pistaActiva && pistaActiva.id === pista.id) {
            detener();
            return;
        }
        const url = pista.audioUrl || (pista.capas && pista.capas[0]?.url);
        if (!url) return;

        setErrorReproduccion(null);
        const audio = obtenerAudio();

        // CRITICO iOS Safari: TODO esto debe correr SINCRONO dentro del gesto.
        // Cualquier `await` antes de audio.play() invalida la user activation y
        // iOS rechaza el play() con NotAllowedError silencioso.
        if (audio.src !== url) {
            audio.src = url;
            try { audio.load(); } catch { /* noop */ }
        }
        audio.volume = volumen;
        audio.playbackRate = velocidad;

        // play() SINCRONO dentro del mismo tick que el touch event.
        const playPromise = audio.play();

        // Actualizamos UI optimistamente; si play() falla, revertimos.
        setPistaActiva({
            id: pista.id,
            nombre: pista.nombre,
            url,
            artista: pista.artista || null,
            bpm: pista.bpm || null,
        });

        playPromise?.catch((e: any) => {
            const name = e?.name || 'Error';
            const message = e?.message || String(e) || 'No se pudo reproducir.';
            console.error('[Loops] audio.play() rechazado:', name, message, e);
            setErrorReproduccion({ name, message });
            setPistaActiva(null);
        });

        // Tambien mostramos errores de carga del audio (red/CORS/formato).
        const onErrorAudio = () => {
            const err = audio.error;
            const codigo = err ? `code ${err.code}` : 'desconocido';
            const msg = err?.message || codigo;
            console.error('[Loops] audio.error:', codigo, msg);
            setErrorReproduccion({ name: `MediaError(${codigo})`, message: msg });
            setPistaActiva(null);
        };
        audio.addEventListener('error', onErrorAudio, { once: true });
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
        errorReproduccion,
        setVolumen,
        setVelocidad,
        reproducir,
        detener,
        obtenerPosicion,
    };
}
