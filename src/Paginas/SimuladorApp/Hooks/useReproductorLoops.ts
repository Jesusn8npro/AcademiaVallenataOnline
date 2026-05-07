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

    // Helper para crear un HTMLAudio con la URL ya en el constructor. iPhone real
    // dio MEDIA_ERR_SRC_NOT_SUPPORTED (code 4) cuando crebamos el audio vacio y
    // luego seteabamos `audio.src = url` — iOS no carga bien el src asignado
    // post-construccion en cierto orden. Pasar la URL al constructor (igual que
    // PracticaLibre) lo dispara en el ciclo correcto y carga sin problema.
    // crossOrigin='anonymous' es necesario para Supabase Storage en iOS: sin
    // CORS explicito el response queda opaco y iOS lo rechaza con code 4.
    const crearAudio = useCallback((url: string): HTMLAudioElement => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audio.loop = true;
        audio.playsInline = true;
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

        // Si hay un audio anterior con OTRA URL, lo descartamos. iOS no aplica
        // bien `audio.src = nuevaUrl` despues de tener src previo — code 4.
        // Mejor crear uno nuevo con la URL en el constructor.
        const prev = audioRef.current;
        if (prev && prev.src !== url) {
            try { prev.pause(); } catch { /* noop */ }
            try { prev.src = ''; } catch { /* noop */ }
            audioRef.current = null;
        }

        // Crear audio nuevo con URL en constructor (si no hay) o reusar.
        let audio = audioRef.current;
        if (!audio) {
            audio = crearAudio(url);
            audioRef.current = audio;
        }
        audio.volume = volumen;
        audio.playbackRate = velocidad;

        // Listener de error ANTES de play() para capturar fallos de carga.
        const onErrorAudio = () => {
            const err = audio!.error;
            const codigo = err ? `code ${err.code}` : 'desconocido';
            const msg = err?.message || `MediaError ${codigo} (no se pudo cargar el audio)`;
            console.error('[Loops] audio.error:', codigo, msg, 'url:', url);
            setErrorReproduccion({ name: `MediaError ${codigo}`, message: msg });
            setPistaActiva(null);
        };
        audio.addEventListener('error', onErrorAudio, { once: true });

        // CRITICO iOS Safari: play() SINCRONO dentro del mismo tick del touch.
        // Cualquier `await` antes invalida la user activation -> NotAllowedError.
        const playPromise = audio.play();

        // UI optimista; revertimos si play() rechaza.
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
    }, [pistaActiva, volumen, velocidad, detener, crearAudio]);

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
